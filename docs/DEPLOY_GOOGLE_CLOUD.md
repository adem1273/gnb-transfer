# Google Cloud Deployment Guide

This guide provides comprehensive instructions for deploying the GNB Transfer application to Google Cloud using either Cloud Run or App Engine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Environment Variables](#environment-variables)
- [Cloud Run Deployment](#cloud-run-deployment)
- [App Engine Deployment](#app-engine-deployment)
- [Local Docker Testing](#local-docker-testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/) (for local testing)
- Google Cloud Project with billing enabled
- MongoDB database (MongoDB Atlas recommended)

### Google Cloud Setup
```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# For App Engine (optional)
gcloud services enable appengine.googleapis.com
```

## Deployment Options

### Cloud Run (Recommended)
- **Pros**: Fully managed, auto-scaling, pay-per-use, faster deployments
- **Cons**: Cold starts (mitigated with min instances)
- **Best for**: Production applications with variable traffic

### App Engine Flexible
- **Pros**: Integrated with Google Cloud ecosystem, automatic SSL
- **Cons**: Slower deployments, higher minimum cost
- **Best for**: Applications requiring advanced App Engine features

## Environment Variables

### Required Environment Variables
Set these in Google Cloud Console or via gcloud CLI:

```bash
# Critical Variables
NODE_ENV=production
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gnb-transfer?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# CORS Configuration
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional: Email Configuration
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Optional: OpenAI Integration
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Frontend Configuration (build-time)
VITE_API_URL=https://your-backend-url.run.app/api
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

### Setting Environment Variables

#### For Cloud Run:
```bash
# Set individual variables
gcloud run services update gnb-transfer \
  --set-env-vars="NODE_ENV=production,MONGO_URI=your_mongo_uri" \
  --region=us-central1

# Or use a YAML file (recommended for many variables)
gcloud run services update gnb-transfer \
  --env-vars-file=.env.yaml \
  --region=us-central1
```

#### For App Engine:
Add to `app.yaml`:
```yaml
env_variables:
  NODE_ENV: 'production'
  MONGO_URI: 'your_mongo_uri'
```

**IMPORTANT**: Never commit secrets to version control. Use Google Secret Manager for sensitive data:
```bash
# Create a secret
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Cloud Run Deployment

### Method 1: Using Cloud Build (Recommended)

1. **Configure Cloud Build trigger** (one-time setup):
```bash
# Connect your GitHub repository
gcloud alpha builds triggers create github \
  --repo-name=gnb-transfer \
  --repo-owner=adem1273 \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

2. **Manual deployment with Cloud Build**:
```bash
# Build and deploy in one command
gcloud builds submit --config=cloudbuild.yaml
```

### Method 2: Using gcloud run deploy

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/gnb-transfer:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/gnb-transfer:latest

# Deploy to Cloud Run
gcloud run deploy gnb-transfer \
  --image gcr.io/YOUR_PROJECT_ID/gnb-transfer:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 1 \
  --set-env-vars "NODE_ENV=production,MONGO_URI=your_mongo_uri,JWT_SECRET=your_jwt_secret"
```

### Method 3: One-Command Deployment (Simplest)

```bash
# Deploy directly from source (Cloud Build will build the image)
gcloud run deploy gnb-transfer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi
```

### Configure Custom Domain (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service gnb-transfer \
  --domain your-domain.com \
  --region us-central1
```

## App Engine Deployment

### Deploy to App Engine Flexible

1. **Initialize App Engine** (one-time setup):
```bash
gcloud app create --region=us-central
```

2. **Deploy the application**:
```bash
gcloud app deploy app.yaml
```

3. **View the application**:
```bash
gcloud app browse
```

4. **View logs**:
```bash
gcloud app logs tail -s default
```

## Local Docker Testing

### Build and Run Locally

```bash
# Build the Docker image
docker build -t gnb-transfer .

# Run the container
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e MONGO_URI=your_mongo_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e PORT=8080 \
  gnb-transfer

# Test the application
curl http://localhost:8080/api/health
```

### Test with docker-compose (includes MongoDB)

```bash
# Start all services
docker-compose up

# Stop all services
docker-compose down
```

### Verify Deployment
```bash
# Check if frontend loads
curl http://localhost:8080/

# Check API health
curl http://localhost:8080/api/health

# Check API response
curl http://localhost:8080/api/v1/tours

# Test admin panel (open in browser)
open http://localhost:8080/admin
```

## Post-Deployment Configuration

### 1. Set up MongoDB Connection
Ensure your MongoDB instance (Atlas recommended) allows connections from Google Cloud:
- Add `0.0.0.0/0` to IP whitelist (or use VPC peering for better security)
- Use connection string with `retryWrites=true&w=majority`

### 2. Configure Stripe Webhooks
```bash
# Get your Cloud Run URL
gcloud run services describe gnb-transfer --region us-central1 --format 'value(status.url)'

# Add webhook endpoint in Stripe Dashboard:
# URL: https://your-app.run.app/api/v1/stripe/webhook
# Events: payment_intent.succeeded, payment_intent.failed
```

### 3. Set up CORS
Update CORS_ORIGINS environment variable with your frontend domain:
```bash
gcloud run services update gnb-transfer \
  --update-env-vars "CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com" \
  --region us-central1
```

### 4. Enable Cloud Logging
Logs are automatically sent to Cloud Logging. View them:
```bash
# View recent logs
gcloud run logs read --service=gnb-transfer --region=us-central1 --limit=50

# Stream logs in real-time
gcloud run logs tail --service=gnb-transfer --region=us-central1
```

## Continuous Deployment

### Automatic Deployment from GitHub

1. **Create Cloud Build trigger**:
```bash
gcloud builds triggers create github \
  --repo-name=gnb-transfer \
  --repo-owner=adem1273 \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

2. **Push to main branch** - automatically triggers build and deployment

## Monitoring and Maintenance

### View Application Metrics
```bash
# Cloud Run metrics in Console
# Visit: https://console.cloud.google.com/run

# Or use gcloud
gcloud run services describe gnb-transfer --region us-central1
```

### Update the Service
```bash
# Update environment variables
gcloud run services update gnb-transfer \
  --update-env-vars "NEW_VAR=value" \
  --region us-central1

# Update image
gcloud run services update gnb-transfer \
  --image gcr.io/YOUR_PROJECT_ID/gnb-transfer:latest \
  --region us-central1

# Scale the service
gcloud run services update gnb-transfer \
  --min-instances 2 \
  --max-instances 20 \
  --region us-central1
```

## Troubleshooting

### Common Issues

#### 1. Container fails to start
```bash
# Check logs
gcloud run logs read --service=gnb-transfer --region=us-central1 --limit=100

# Common causes:
# - Missing environment variables (MONGO_URI, JWT_SECRET)
# - Database connection issues
# - Port mismatch (ensure PORT=8080)
```

#### 2. Frontend not loading
```bash
# Verify build was successful
docker build -t test-build .

# Check if dist directory exists in container
docker run test-build ls -la /app/dist

# Verify backend serves static files
curl https://your-app.run.app/
```

#### 3. API endpoints return 404
```bash
# Check CORS configuration
# Ensure CORS_ORIGINS includes your frontend domain

# Verify API routes
curl https://your-app.run.app/api/health
curl https://your-app.run.app/api/v1/tours
```

#### 4. MongoDB connection issues
```bash
# Test MongoDB connection string locally
node -e "require('mongoose').connect('your_mongo_uri').then(() => console.log('Connected')).catch(e => console.error(e))"

# Check MongoDB Atlas network access
# Ensure 0.0.0.0/0 is whitelisted or use VPC peering
```

#### 5. Build timeout
```bash
# Increase build timeout in cloudbuild.yaml
# timeout: 1200s (20 minutes)

# Or use a more powerful machine
# options:
#   machineType: 'N1_HIGHCPU_8'
```

### Performance Optimization

#### Reduce Cold Starts
```bash
# Set minimum instances
gcloud run services update gnb-transfer \
  --min-instances 1 \
  --region us-central1
```

#### Optimize Memory
```bash
# Adjust memory allocation
gcloud run services update gnb-transfer \
  --memory 1Gi \
  --region us-central1
```

#### Enable CPU Boost
```bash
# Allocate more CPU
gcloud run services update gnb-transfer \
  --cpu 2 \
  --region us-central1
```

## Cost Optimization

### Cloud Run Pricing
- **Compute**: Billed per 100ms of request time
- **Memory**: Billed per GB-second
- **Requests**: First 2 million requests/month free

### Tips to Reduce Costs
1. Use `--min-instances 0` for development environments
2. Set appropriate `--timeout` (default 300s is often too high)
3. Right-size `--memory` and `--cpu` based on actual usage
4. Use Cloud CDN for static assets
5. Implement caching strategies (Redis/Memcached)

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable VPC Connector** for private database access
3. **Implement IAM roles** properly
4. **Use HTTPS only** (automatic in Cloud Run)
5. **Enable Cloud Armor** for DDoS protection
6. **Set up Cloud Monitoring** alerts
7. **Regular security audits** with Cloud Security Scanner

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Support

For issues specific to this deployment, please check:
- Application logs: `gcloud run logs read --service=gnb-transfer`
- Health endpoint: `https://your-app.run.app/api/health`
- API documentation: `https://your-app.run.app/api/docs`

For general Google Cloud support:
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-platform)
