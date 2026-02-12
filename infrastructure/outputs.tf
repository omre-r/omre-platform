output "s3_website_url" {
  description = "S3 website URL"
  value       = "http://${aws_s3_bucket.frontend.bucket}.s3-website-${var.aws_region}.amazonaws.com"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/admin"
}

output "rds_endpoint" {
  description = "RDS endpoint for DBeaver"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS username"
  value       = aws_db_instance.main.username
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost"
  value       = <<-EOT
    RDS (12 hrs/day): ~$8.42/month
    Lambda: $0.00 (free tier)
    S3: $0.01/month
    API Gateway: $0.00 (free tier)
    
    Total: ~$8.50/month
    Credits remaining after 4 months: $166
  EOT
}
