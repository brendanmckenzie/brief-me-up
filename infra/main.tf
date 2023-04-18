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

resource "null_resource" "deps" {

  triggers = {
    package_json = "${base64sha256(file("../package.json"))}"
  }

  provisioner "local-exec" {
    command = "mkdir -p ../layer/nodejs && cp -R ../node_modules ../layer/nodejs"
  }
}
resource "null_resource" "package" {

  provisioner "local-exec" {
    command = "cd .. ; yarn ; yarn run tsc ; cp -R res dist/"
  }
}

data "archive_file" "layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../layer/"
  output_path = "${path.module}/../dist/layer.zip"

  depends_on = [null_resource.deps]

  excludes = [
    "nodejs/node_modules/@types",
    "nodejs/node_modules/typescript",
    "nodejs/node_modules/ts-node",
    "nodejs/node_modules/aws-sdk",
    "nodejs/node_modules/aws-lambda",
  ]
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

  depends_on = [null_resource.package]

  architectures = ["arm64"]
  runtime       = "nodejs18.x"
  timeout       = 900
  memory_size   = 512

  environment {
    variables = {
      OPENAI_API_KEY = ""

      SMTP_HOST   = ""
      SMTP_PORT   = ""
      SMTP_USER   = ""
      SMTP_PASS   = ""
      SMTP_SECURE = ""

      MAIL_FROM = ""
      MAIL_TO   = ""
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
