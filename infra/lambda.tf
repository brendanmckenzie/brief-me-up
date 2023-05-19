data "local_file" "lambda_zip" {
  filename = "${path.module}/../build/function.zip"
}

data "local_file" "layer_zip" {
  filename = "${path.module}/../build/layer.${data.local_file.layer_pkg_zip.content_sha1}.zip"
}
data "local_file" "layer_pkg_zip" {
  filename = "${path.module}/../yarn.lock"
}

resource "aws_lambda_layer_version" "nodemodules_layer" {
  filename         = data.local_file.layer_zip.filename
  # source_code_hash = data.local_file.layer_zip.content_base64sha256
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
