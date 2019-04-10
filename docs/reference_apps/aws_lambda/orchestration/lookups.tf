provider "aws" {
  alias  = "ssvc-us-east-1"
  region = "us-east-1"
  profile = "${var.profile}"
}

data "aws_route53_zone" "public" {
  name = "${var.public_zone}."
}

data "aws_acm_certificate" "default" {
  provider    = "aws.ssvc-us-east-1"
  domain      = "*.${var.public_zone}"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}
