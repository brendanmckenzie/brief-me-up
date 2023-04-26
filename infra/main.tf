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

resource "aws_s3_bucket" "storage" {
  bucket = "briefmeup"
}

data "local_file" "lambda_zip" {
  filename = "${path.module}/../build/function.zip"
}

data "local_file" "layer_zip" {
  filename = "${path.module}/../build/layer.zip"
}

resource "aws_lambda_layer_version" "nodemodules_layer" {
  filename         = data.local_file.layer_zip.filename
  source_code_hash = data.local_file.layer_zip.content_base64sha256
  layer_name       = "briefmeup_nodemodules_layer"

  compatible_runtimes      = ["nodejs18.x"]
  compatible_architectures = ["arm64"]
}

resource "aws_lambda_function" "processing_lambda" {
  filename         = data.local_file.lambda_zip.filename
  function_name    = "briefmeup"
  handler          = "lambda.handler"
  source_code_hash = data.local_file.lambda_zip.content_base64sha256
  role             = aws_iam_role.processing_lambda_role.arn

  layers = [aws_lambda_layer_version.nodemodules_layer.arn]

  architectures = ["arm64"]
  runtime       = "nodejs18.x"
  timeout       = 900
  memory_size   = 512

  environment {
    variables = {
      TZ     = "Australia/Melbourne"
      BUCKET = aws_s3_bucket.storage.bucket
    }
  }
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

  statement {
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.storage.arn,
      "${aws_s3_bucket.storage.arn}/*"
    ]
  }
}



resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "schedule"
  description         = "Schedule for Lambda Function"
  schedule_expression = "cron(0 20 ? * * *)"
}

resource "aws_cloudwatch_event_target" "schedule_lambda" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "processing_lambda"
  arn       = aws_lambda_function.processing_lambda.arn
}


resource "aws_lambda_permission" "allow_events_bridge_to_run_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processing_lambda.function_name
  principal     = "events.amazonaws.com"
}
