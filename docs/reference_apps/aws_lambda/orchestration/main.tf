#================================================
# Authentication to AWS

/*
 * Uncommment below for remote state
 */
# terraform {
#   backend "s3" {
#     bucket = "sample-org-terraform-state-sharedservices"
#     key    = "sample_app.json"
#     region = "eu-west-1"
#     workspace_key_prefix = "tf-state/sharedservices-state"
#     dynamodb_table = "lock-id-terraform-eu-west-1"
#     profile = "default"
#   }
# }

#
# todo: import apigw resources/template apigw resources
#
provider "aws" {
  version = "~>1.56.0"
  region  = "${var.region}"
  profile = "${var.profile}"
}

module "labels" {
  source     = "git::https://github.com/cloudposse/terraform-null-label.git?ref=master"
  namespace  = "test"
  stage      = "${var.stage}"
  name       = "${var.name}"
  attributes = "${var.attributes}"
  delimiter  = "-"
  tags       = "${var.tags}"
}

# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name = "${module.labels.id}-api"
}

resource "aws_api_gateway_resource" "resource" {
  path_part   = "{proxy+}"
  parent_id   = "${aws_api_gateway_rest_api.api.root_resource_id}"
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
}

resource "aws_api_gateway_method" "method" {
  depends_on  = ["aws_api_gateway_resource.resource"]
  count         = "${length(var.api_methods)}"
  rest_api_id   = "${aws_api_gateway_rest_api.api.id}"
  resource_id   = "${aws_api_gateway_resource.resource.id}"
  http_method   = "${var.api_methods[count.index]}"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  depends_on  = ["aws_api_gateway_method.method"]
  count                   = "${length(aws_api_gateway_method.method.*.http_method)}"
  rest_api_id             = "${aws_api_gateway_rest_api.api.id}"
  resource_id             = "${aws_api_gateway_resource.resource.id}"
  // http_method             = "${aws_api_gateway_method.method.http_method}"
  http_method             = "${element(aws_api_gateway_method.method.*.http_method, count.index)}"
  // LAMBDA can only be invoked by a POST
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.default.arn}/invocations"
  // credentials             = "${aws_iam_role.apigw.arn}"

  # Transforms the incoming XML request to JSON
  request_templates {
    "application/json" = <<EOF
{
   "body" : $input.json('$')
}
EOF
  }
}

# Lambda
resource "aws_lambda_permission" "apigw_lambda" {
  count         = "${length(aws_api_gateway_method.method.*.http_method)}"
  statement_id  = "${module.labels.id}-api-AllowExecutionFromAPIGateway-${count.index}"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.default.arn}"
  principal     = "apigateway.amazonaws.com"

  # More: http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html
  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/${element(aws_api_gateway_method.method.*.http_method, count.index)}${aws_api_gateway_resource.resource.path}"
}

resource "random_id" "default" {
  byte_length = 8
}

data "archive_file" "default" {
  type        = "zip"
  source_dir  = "../domain"
  output_path = ".terraform/archive_files/sample_stronghold_${random_id.default.dec}.zip"
}

resource "aws_lambda_function" "default" {
  filename      = "${data.archive_file.default.output_path}"
  function_name = "${module.labels.id}-api"
  role = "${aws_iam_role.default.arn}"
  handler          = "${var.handler}"
  source_code_hash = "${data.archive_file.default.output_base64sha256}"
  runtime          = "${var.runtime}"
  memory_size = "256"
  timeout     = "15"

  environment {
    variables {
      NODE_ENV          = "dev"
      STAGE             = "dev"
      HEADER_VALS       = ""
      LOG_LEVEL         = "debug"
      FNC_NAME          = "${module.labels.id}-api"
    }
  }

  tags = "${module.labels.tags}"
}

# IAM lambda
resource "aws_iam_role" "default" {
  name = "${module.labels.id}-lambda-role"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
POLICY
}

data "aws_iam_policy_document" "default" {
  statement {
    # todo: restrict actions
    actions = [
      "logs:*"
    ]
    # todo: restrict resources
    # "arn:aws:logs:eu-west-1:${var.aws_accounts["sharedservices"]}:log-group:/aws/lambda/${aws_lambda_function.default.function_name}*",
    resources = [
      "*",
    ]
  }
}

resource "aws_iam_policy" "default" {
  name        = "${module.labels.id}"
  description = ""
  policy      = "${data.aws_iam_policy_document.default.json}"
}

resource "aws_iam_role_policy_attachment" "default" {
  role       = "${aws_iam_role.default.name}"
  policy_arn = "${aws_iam_policy.default.arn}"
}

resource "aws_api_gateway_deployment" "default" {
  depends_on  = ["aws_api_gateway_integration.integration"]
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  stage_name  = "${var.name}"
  variables {
    status = "dev"
  }
}

resource "aws_api_gateway_domain_name" "default" {
  domain_name     = "${var.name}.${replace(data.aws_route53_zone.public.name, var.search_regex, var.replace_regex)}"
  certificate_arn = "${data.aws_acm_certificate.default.arn}"
}

resource "aws_api_gateway_base_path_mapping" "default" {
  api_id      = "${aws_api_gateway_rest_api.api.id}"
  stage_name  = "${aws_api_gateway_deployment.default.stage_name}"
  domain_name = "${aws_api_gateway_domain_name.default.domain_name}"
  base_path   = "${var.name}"
}

resource "aws_route53_record" "public" {
  zone_id = "${data.aws_route53_zone.public.zone_id}"
  name = "${var.name}.${data.aws_route53_zone.public.name}"
  type = "A"
  alias {
    name                   = "${aws_api_gateway_domain_name.default.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.default.cloudfront_zone_id}"
    evaluate_target_health = false
  }
}
