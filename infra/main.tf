terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.54"
    }
  }
  required_version = ">= 1.3.0"
}

provider "aws" {
  region = "ap-southeast-2"
}


data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/../dist/function.zip"
  excludes    = ["function.zip", "layer.zip"]
}

data "archive_file" "layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../node_modules"
  output_path = "${path.module}/../dist/layer.zip"

  excludes = ["@types", "typescript", "ts-node", "aws-sdk", "aws-lambda", ".*"]
}

resource "aws_lambda_layer_version" "nodemodules_layer" {
  filename         = data.archive_file.layer_zip.output_path
  source_code_hash = data.archive_file.layer_zip.output_base64sha256
  layer_name       = "briefmeup_nodemodules_layer"

  compatible_runtimes      = ["nodejs18.x"]
  compatible_architectures = ["arm64"]
}


resource "aws_lambda_function" "processing_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "briefmeup"
  handler          = "lambda.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.processing_lambda_role.arn

  layers = [aws_lambda_layer_version.nodemodules_layer.arn]

  architectures = ["arm64"]
  runtime       = "nodejs18.x"
  timeout       = 900
  memory_size   = 512
}

resource "aws_iam_role" "processing_lambda_role" {
  name               = "briefmeup"
  path               = "/service-role/"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  inline_policy {
    name   = "briefmeup_policy"
    policy = data.aws_iam_policy_document.policy_doc.json
  }
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}


data "aws_iam_policy_document" "policy_doc" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}
