
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
    resources = ["${aws_s3_bucket.storage.arn}/public/*"]

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

resource "aws_s3_object" "workoutcss" {
  bucket = aws_s3_bucket.storage.id
  key    = "public/css/workout.css"
  source = "../res/workout.css"

  etag = filemd5("../res/workout.css")
}
resource "aws_s3_object" "workoutjs" {
  bucket = aws_s3_bucket.storage.id
  key    = "public/js/workout.js"
  source = "../res/workout.js"

  etag = filemd5("../res/workout.js")
}
