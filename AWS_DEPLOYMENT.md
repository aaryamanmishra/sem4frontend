# AWS Deployment Guide

This guide covers deploying BankUI to AWS using Lambda + API Gateway for the backend and CloudFront + S3 for the frontend.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- SAM CLI (optional, for local Lambda testing)
- Docker (for building Lambda packages)

## Part 1: Backend Deployment (AWS Lambda)

### 1. Create Lambda Deployment Package

```bash
# Navigate to backend directory
cd backend

# Create deployment directory
mkdir -p lambda_deployment

# Copy requirements and install to deployment directory
pip install -r requirements.txt -t lambda_deployment/

# Copy application code
cp -r app lambda_deployment/
cp lambda_handler.py lambda_deployment/
cp config.py lambda_deployment/

# Create zip file
cd lambda_deployment
zip -r ../lambda_function.zip .
cd ..
```

### 2. Create Lambda Function via AWS Console

1. Go to AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Name: `bankui-backend-api`
5. Runtime: `Python 3.11`
6. Architecture: `x86_64`
7. Click "Create function"

### 3. Upload and Configure Lambda

1. In function details, go to "Code" section
2. Under "Code source", click "Upload from" → ".zip file"
3. Upload the `lambda_function.zip`
4. Set Handler to: `lambda_handler.handler`

### 4. Set Environment Variables

In Lambda configuration, set these environment variables:

```
DATABASE_URL = postgresql://user:password@host:port/database
SECRET_KEY = your-super-secret-key-change-this
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ENVIRONMENT = production
AWS_REGION = ap-south-1
```

### 5. Configure Lambda Settings

- **Timeout**: 30 seconds
- **Memory**: 512 MB (can increase if needed)
- **Ephemeral storage**: 512 MB

### 6. Create API Gateway

1. Go to API Gateway console
2. Click "Create API"
3. Choose "REST API"
4. Name: `bankui-api`
5. Click "Create"

### 7. Configure API Gateway Routes

1. Click "Resources" in left menu
2. Right-click on "/" and select "Create method"
3. Choose "ANY"
4. Integration type: "AWS Lambda"
5. Lambda function: `bankui-backend-api`
6. Click "Create"

### 8. Enable CORS

1. Select "Resources" → "/"
2. Click "Actions" → "Enable CORS"
3. Leave default settings
4. Click "Enable CORS and replace existing CORS headers"

### 9. Deploy API

1. Click "Actions" → "Deploy API"
2. Deployment stage: `prod` (or create new)
3. Click "Deploy"
4. Copy the invoke URL (e.g., `https://abc123.execute-api.ap-south-1.amazonaws.com/prod`)

## Part 2: Frontend Deployment (CloudFront + S3)

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build

# This creates a `dist` folder with production build
```

### 2. Create S3 Bucket

```bash
aws s3 mb s3://bankui-frontend --region ap-south-1
```

### 3. Configure S3 for Static Website

```bash
# Upload build files
aws s3 sync dist/ s3://bankui-frontend --delete

# Set bucket policy to allow public read
aws s3api put-bucket-policy --bucket bankui-frontend --policy file://s3-bucket-policy.json
```

Create `s3-bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bankui-frontend/*"
    }
  ]
}
```

### 4. Create CloudFront Distribution

1. Go to CloudFront console
2. Click "Create distribution"
3. **Origin domain**: Select your S3 bucket
4. **Origin access**: Choose "Origin access control settings"
5. **Viewer protocol policy**: Redirect HTTP to HTTPS
6. **Default root object**: `index.html`
7. Under "Custom error responses":
   - Status code: 403 → Error caching min TTL: 0, Response page path: `/index.html`
   - Status code: 404 → Error caching min TTL: 0, Response page path: `/index.html`
8. Click "Create distribution"

### 5. Update API Configuration

Create `.env.production` in frontend and build:

```
VITE_API_URL=https://your-api-gateway-url/prod
```

Rebuild frontend:
```bash
npm run build
aws s3 sync dist/ s3://bankui-frontend --delete
```

## Part 3: Database Configuration

### 1. Verify Database Connection

The application uses Railway PostgreSQL database. Ensure:
- Connection string is correct in Lambda environment variables
- Network connectivity is available from Lambda

### 2. Run Migrations

Option 1: From local machine
```bash
python backend/migrations/create_tables.py
```

Option 2: Via Lambda
1. Add migration script to Lambda
2. Invoke with test event
3. Check CloudWatch logs

## Part 4: Monitoring & Logging

### CloudWatch Logs

1. Go to CloudWatch console
2. Check `/aws/lambda/bankui-backend-api` log group
3. Monitor for errors and performance

### API Gateway Logs

1. Go to API Gateway → APIs → bankui-api
2. Settings → CloudWatch log role
3. Set execution role with CloudWatch permissions

### X-Ray (Optional)

1. Enable X-Ray in Lambda
2. Go to X-Ray console to trace requests

## Part 5: Domain Configuration (Optional)

### 1. Register Domain

Use Route 53 or external registrar

### 2. Create Certificate

1. Go to ACM (AWS Certificate Manager)
2. Request certificate for your domain
3. Validate domain ownership

### 3. Configure CloudFront

1. In CloudFront distribution settings
2. Add alternate domain names (CNAME)
3. Set SSL certificate

### 4. Update Route 53 Records

1. Go to Route 53
2. Create A record pointing to CloudFront distribution

## Deployment Checklist

- [ ] Lambda function created with correct runtime
- [ ] Environment variables set
- [ ] API Gateway configured with Lambda
- [ ] CORS enabled
- [ ] API deployed to stage
- [ ] Frontend built and uploaded to S3
- [ ] CloudFront distribution created
- [ ] Database migrations completed
- [ ] Test login flow with Lambda + API Gateway
- [ ] Monitor CloudWatch logs
- [ ] Domain/SSL configured (if using custom domain)

## Troubleshooting

### Lambda Timeout
- Increase timeout in Lambda settings
- Check database connection speed

### CORS Errors
- Verify API Gateway CORS configuration
- Check CloudFront cache settings
- Verify frontend sends correct headers

### Database Connection Errors
- Verify CONNECTION_STRING environment variable
- Check network connectivity from Lambda VPC
- Verify RLS/security groups

### Cold Start Performance
- Lambda cold starts take 5-10 seconds
- Consider provisioned concurrency for production
- Optimize Lambda package size

## Cost Optimization

- **Lambda**: Monitor invocations, consider reserved concurrency
- **API Gateway**: Monitor requests, enable caching
- **S3**: Enable versioning, lifecycle policies
- **CloudFront**: Set appropriate TTL values
- **CloudWatch**: Set log retention period

## Security Considerations

1. Change `SECRET_KEY` in Lambda environment
2. Use AWS Secrets Manager for sensitive data
3. Enable WAF on API Gateway
4. Set minimum TLS version to 1.2
5. Enable CloudTrail for audit logging
6. Regular security updates for dependencies

## Rollback Strategy

### Backend
1. Keep previous Lambda version
2. Point API Gateway to previous version if issues occur

### Frontend
1. Keep previous S3 versions
2. Create CloudFront invalidation for /index.html if needed

## Scaling Considerations

As traffic grows:

1. **Lambda**: Enable provisioned concurrency
2. **API Gateway**: Enable caching for GET requests
3. **CloudFront**: Adjust cache TTL based on content
4. **Database**: Monitor connection pool usage

## Next Steps

1. Test payment flow end-to-end
2. Set up CI/CD pipeline for automated deployments
3. Configure monitoring and alerts
4. Plan for backup and disaster recovery
