terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.54"
    }
  }
  required_version = ">= 1.3.0"

  backend "s3" {
    bucket = "briefmeup"
    key    = "network/terraform.tfstate"
    region = "ap-southeast-2"
  }
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
      TZ       = "Australia/Melbourne"
      WEB_ROOT = aws_cloudfront_distribution.s3_distribution.domain_name
      BUCKET   = aws_s3_bucket.storage.bucket
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

  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      "arn:aws:secretsmanager:ap-southeast-2:705488526907:secret:prod/briefmeup-d1fECt"
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

resource "aws_cloudfront_origin_access_identity" "ident" {
  comment = "briefmeup-cfroai"
}


resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.storage.bucket_regional_domain_name
    origin_id   = "briefmeup-s3"
    origin_path = "/public"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.ident.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "briefmeup"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "briefmeup-s3"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}




data "aws_iam_policy_document" "cfroai_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.storage.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.ident.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cfroai_policy" {
  bucket = aws_s3_bucket.storage.id
  policy = data.aws_iam_policy_document.cfroai_policy.json
}

resource "aws_s3_bucket_public_access_block" "bucket_public_acls" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls   = true
  block_public_policy = true
  # restrict_public_buckets = true
  # ignore_public_acls      = true
}
