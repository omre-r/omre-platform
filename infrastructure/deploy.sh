#!/bin/bash
# OMRE Terraform Deployment Script
# Run this in AWS CloudShell after uploading the omre-terraform folder

set -e  # Exit on any error

echo "=========================================="
echo "OMRE Fragrances - Infrastructure Deploy"
echo "=========================================="
echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "ERROR: terraform.tfvars not found!"
    echo "Please create it first:"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo "  nano terraform.tfvars  # Edit with your password"
    exit 1
fi

# Check if db_password is still the default
if grep -q "CHANGE_ME" terraform.tfvars; then
    echo "ERROR: Please change the db_password in terraform.tfvars!"
    echo "  nano terraform.tfvars"
    exit 1
fi

echo "Step 1/4: Installing Lambda dependencies..."
echo ""

cd lambda_functions/cognito_post_confirmation && npm install --silent && cd ../..
echo "  ✓ cognito_post_confirmation"

cd lambda_functions/get_users && npm install --silent && cd ../..
echo "  ✓ get_users"

cd lambda_functions/get_user_by_id && npm install --silent && cd ../..
echo "  ✓ get_user_by_id"

cd lambda_functions/stop_rds && npm install --silent && cd ../..
echo "  ✓ stop_rds"

cd lambda_functions/start_rds && npm install --silent && cd ../..
echo "  ✓ start_rds"

echo ""
echo "Step 2/4: Initializing Terraform..."
terraform init

echo ""
echo "Step 3/4: Planning deployment..."
terraform plan -out=tfplan

echo ""
echo "=========================================="
echo "Review the plan above."
echo "=========================================="
echo ""
read -p "Deploy infrastructure? (yes/no): " CONFIRM

if [ "$CONFIRM" == "yes" ]; then
    echo ""
    echo "Step 4/4: Applying Terraform..."
    terraform apply tfplan
    
    echo ""
    echo "=========================================="
    echo "✓ DEPLOYMENT COMPLETE!"
    echo "=========================================="
    echo ""
    echo "IMPORTANT OUTPUTS:"
    terraform output
    
    echo ""
    echo "NEXT STEPS:"
    echo "1. Copy the rds_endpoint above"
    echo "2. Open DBeaver and connect to PostgreSQL:"
    echo "   - Host: <rds_endpoint without :5432>"
    echo "   - Port: 5432"
    echo "   - Database: omre_db"
    echo "   - User: omre_admin"
    echo "   - Password: <your db_password from terraform.tfvars>"
    echo "3. Run scripts/init_db.sql in DBeaver"
    echo ""
else
    echo "Deployment cancelled."
    rm -f tfplan
fi
