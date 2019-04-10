variable "region" {
  default = "eu-west-1"
}

// variable "component_name" {
//   default = "access-management"
// }

variable "name" {
  default = "stronghold"
}

variable "stage" {
  default = "dev"
}

variable "namespace" {
  default = ""
}

variable "runtime" {
  default = "nodejs8.10"
}

variable "handler" {
  default = "lambda.handler"
}

variable "public_zone" {
  default = ""
}

variable "attributes" {
  default = []
}

variable "tags" {
  type = "map"
  default = {}
}

variable "search_regex" {
  default = "/\\.$$/"
}

variable "replace_regex" {
  default = ""
}

variable "api_methods" {
  type = "list"
  // default = ["GET", "POST"]
}

variable "profile" {
  default = ""
}
