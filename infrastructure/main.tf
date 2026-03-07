terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==================== DATA SOURCES ====================
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ==================== S3 BUCKET ====================
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend"

  tags = {
    Name        = "OMRE Frontend"
    Environment = "Prototype"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# ==================== COGNITO ====================
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = false
  }

  schema {
    attribute_data_type = "String"
    name                = "given_name"
    required            = false
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "family_name"
    required            = false
    mutable             = true
  }

  schema {
    attribute_data_type      = "String"
    name                     = "favorite_notes"
    required                 = false
    mutable                  = true
    string_attribute_constraints {
      min_length = 0
      max_length = 500
    }
  }

  schema {
    attribute_data_type      = "String"
    name                     = "is_admin"
    required                 = false
    mutable                  = true
    string_attribute_constraints {
      min_length = 1
      max_length = 5
    }
  }

  lambda_config {
    post_confirmation = aws_lambda_function.cognito_post_confirmation.arn
  }

  tags = {
    Name = "OMRE Users"
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}

# ==================== RDS SECURITY GROUP ====================
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for OMRE RDS PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  # Allow PostgreSQL from anywhere (for prototype - restrict in production!)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# ==================== RDS POSTGRESQL ====================
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "omre_db"
  username = "omre_admin"
  password = var.db_password

  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-db-final-snapshot"

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  deletion_protection = false

  tags = {
    Name        = "OMRE Database"
    Environment = "Prototype"
  }
}

# ==================== LAMBDA IAM ROLES ====================
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "lambda_rds_scheduler" {
  name = "${var.project_name}-lambda-rds-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_rds_scheduler_basic" {
  role       = aws_iam_role.lambda_rds_scheduler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_rds_control" {
  name = "${var.project_name}-lambda-rds-control"
  role = aws_iam_role.lambda_rds_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:StartDBInstance",
          "rds:StopDBInstance",
          "rds:DescribeDBInstances"
        ]
        Resource = aws_db_instance.main.arn
      }
    ]
  })
}

# ==================== LAMBDA FUNCTIONS ====================

# Package Lambda functions
data "archive_file" "cognito_post_confirmation" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/cognito_post_confirmation"
  output_path = "${path.module}/lambda_functions/cognito_post_confirmation.zip"
}

data "archive_file" "get_users" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/get_users"
  output_path = "${path.module}/lambda_functions/get_users.zip"
}

data "archive_file" "get_user_by_id" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/get_user_by_id"
  output_path = "${path.module}/lambda_functions/get_user_by_id.zip"
}

data "archive_file" "stop_rds" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/stop_rds"
  output_path = "${path.module}/lambda_functions/stop_rds.zip"
}

data "archive_file" "start_rds" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/start_rds"
  output_path = "${path.module}/lambda_functions/start_rds.zip"
}

# Cognito Post-Confirmation Lambda
resource "aws_lambda_function" "cognito_post_confirmation" {
  filename         = data.archive_file.cognito_post_confirmation.output_path
  function_name    = "${var.project_name}-cognito-post-confirmation"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.cognito_post_confirmation.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.address
      DB_PORT     = aws_db_instance.main.port
      DB_NAME     = aws_db_instance.main.db_name
      DB_USER     = aws_db_instance.main.username
      DB_PASSWORD = var.db_password
    }
  }
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cognito_post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# Get Users Lambda
resource "aws_lambda_function" "get_users" {
  filename         = data.archive_file.get_users.output_path
  function_name    = "${var.project_name}-get-users"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.get_users.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.address
      DB_PORT     = aws_db_instance.main.port
      DB_NAME     = aws_db_instance.main.db_name
      DB_USER     = aws_db_instance.main.username
      DB_PASSWORD = var.db_password
    }
  }
}

# Get User By ID Lambda
resource "aws_lambda_function" "get_user_by_id" {
  filename         = data.archive_file.get_user_by_id.output_path
  function_name    = "${var.project_name}-get-user-by-id"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.get_user_by_id.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.address
      DB_PORT     = aws_db_instance.main.port
      DB_NAME     = aws_db_instance.main.db_name
      DB_USER     = aws_db_instance.main.username
      DB_PASSWORD = var.db_password
    }
  }
}

# Stop RDS Lambda
resource "aws_lambda_function" "stop_rds" {
  filename         = data.archive_file.stop_rds.output_path
  function_name    = "${var.project_name}-stop-rds"
  role             = aws_iam_role.lambda_rds_scheduler.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.stop_rds.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main.id
    }
  }
}

# Start RDS Lambda
resource "aws_lambda_function" "start_rds" {
  filename         = data.archive_file.start_rds.output_path
  function_name    = "${var.project_name}-start-rds"
  role             = aws_iam_role.lambda_rds_scheduler.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.start_rds.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main.id
    }
  }
}

# ==================== API GATEWAY ====================
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "OMRE Fragrances API"
}

# /admin resource
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "admin"
}

# /admin/users resource
resource "aws_api_gateway_resource" "admin_users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "users"
}

# GET /admin/users
resource "aws_api_gateway_method" "get_users" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.admin_users.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_users.id
  http_method = aws_api_gateway_method.get_users.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_users.invoke_arn
}

resource "aws_lambda_permission" "get_users" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# /admin/users/{id} resource
resource "aws_api_gateway_resource" "admin_user_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin_users.id
  path_part   = "{id}"
}

# GET /admin/users/{id}
resource "aws_api_gateway_method" "get_user_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.admin_user_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_user_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_user_id.id
  http_method = aws_api_gateway_method.get_user_by_id.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_user_by_id.invoke_arn
}

resource "aws_lambda_permission" "get_user_by_id" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_by_id.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Enable CORS for /admin/users
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.admin_users.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_users.id
  http_method = aws_api_gateway_method.users_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /admin/users/{id}
resource "aws_api_gateway_method" "user_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.admin_user_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.admin_user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  status_code = aws_api_gateway_method_response.user_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.get_users,
    aws_api_gateway_integration.get_user_by_id,
    aws_api_gateway_integration.users_options,
    aws_api_gateway_integration.user_id_options
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "prod"

  # Force redeployment when resources change
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.admin.id,
      aws_api_gateway_resource.admin_users.id,
      aws_api_gateway_resource.admin_user_id.id,
      aws_api_gateway_method.get_users.id,
      aws_api_gateway_method.get_user_by_id.id,
      aws_api_gateway_integration.get_users.id,
      aws_api_gateway_integration.get_user_by_id.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ==================== EVENTBRIDGE (RDS SCHEDULER) ====================

# Stop RDS at 11 PM EST (4 AM UTC next day)
resource "aws_cloudwatch_event_rule" "stop_rds" {
  name                = "${var.project_name}-stop-rds"
  description         = "Stop RDS at 11 PM Michigan time"
  schedule_expression = "cron(0 4 * * ? *)"
}

resource "aws_cloudwatch_event_target" "stop_rds" {
  rule      = aws_cloudwatch_event_rule.stop_rds.name
  target_id = "StopRDS"
  arn       = aws_lambda_function.stop_rds.arn
}

resource "aws_lambda_permission" "stop_rds_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stop_rds.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stop_rds.arn
}

# Start RDS at 11 AM EST (4 PM UTC)
resource "aws_cloudwatch_event_rule" "start_rds" {
  name                = "${var.project_name}-start-rds"
  description         = "Start RDS at 11 AM Michigan time"
  schedule_expression = "cron(0 16 * * ? *)"
}

resource "aws_cloudwatch_event_target" "start_rds" {
  rule      = aws_cloudwatch_event_rule.start_rds.name
  target_id = "StartRDS"
  arn       = aws_lambda_function.start_rds.arn
}

resource "aws_lambda_permission" "start_rds_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_rds.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.start_rds.arn
}
