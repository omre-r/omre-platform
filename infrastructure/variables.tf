variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "omre"
}

variable "db_password" {
  description = "RDS PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Admin email for Cognito (ends with @omrefragrances.com)"
  type        = string
  default     = "admin@omrefragrances.com"
}
