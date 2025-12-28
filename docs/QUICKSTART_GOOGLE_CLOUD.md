# Quick Start: Deploy to Google Cloud Run

This is a simplified quick-start guide. For detailed instructions, see [DEPLOY_GOOGLE_CLOUD.md](./DEPLOY_GOOGLE_CLOUD.md).

## Prerequisites
- [Google Cloud account](https://cloud.google.com/) with billing enabled
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- MongoDB database URL (e.g., from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## 1. Install and Configure gcloud

```bash
# Install gcloud CLI
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

## 2. Set Environment Variables

Create a file `.env.yaml` with your environment variables:

```yaml
NODE_ENV: production
MONGO_URI: "your-mongodb-connection-string"
JWT_SECRET: "your-secret-key-min-32-chars"
CORS_ORIGINS: "https://your-domain.com"
STRIPE_SECRET_KEY: "your-stripe-secret"
```

**IMPORTANT**: Add `.env.yaml` to `.gitignore` (already done)

## 3. Deploy to Cloud Run

### Option A: Using the deployment script (recommended)

```bash
# Make script executable (if not already)
chmod +x deploy-gcloud.sh

# Run deployment
./deploy-gcloud.sh production
```

### Option B: Manual deployment

```bash
# Deploy from source
gcloud run deploy gnb-transfer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --min-instances 1 \
  --env-vars-file .env.yaml
```

## 4. Update Environment Variables

After deployment, set/update environment variables:

```bash
# Update single variable
gcloud run services update gnb-transfer \
  --update-env-vars "NODE_ENV=production" \
  --region us-central1

# Update multiple variables
gcloud run services update gnb-transfer \
  --update-env-vars "VAR1=value1,VAR2=value2" \
  --region us-central1

# Update from file
gcloud run services update gnb-transfer \
  --env-vars-file .env.yaml \
  --region us-central1
```

## 5. Get Your Service URL

```bash
# Get the URL of your deployed service
gcloud run services describe gnb-transfer \
  --region us-central1 \
  --format 'value(status.url)'
```

Visit the URL to see your application running!

## 6. Test the Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe gnb-transfer --region us-central1 --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/api/health

# Test API
curl $SERVICE_URL/api/v1/tours

# Open in browser
open $SERVICE_URL
```

## 7. View Logs

```bash
# View recent logs
gcloud run logs read --service=gnb-transfer --region=us-central1 --limit=50

# Stream logs in real-time
gcloud run logs tail --service=gnb-transfer --region=us-central1
```

## Common Commands

```bash
# Update the service
gcloud run deploy gnb-transfer --source . --region us-central1

# Scale the service
gcloud run services update gnb-transfer \
  --min-instances 2 \
  --max-instances 20 \
  --region us-central1

# View service details
gcloud run services describe gnb-transfer --region us-central1

# Delete the service
gcloud run services delete gnb-transfer --region us-central1
```

## Troubleshooting

### Container fails to start
```bash
# Check logs
gcloud run logs read --service=gnb-transfer --region=us-central1 --limit=100

# Verify environment variables are set
gcloud run services describe gnb-transfer --region=us-central1
```

### API returns 404
- Ensure `NODE_ENV=production` is set
- Check that frontend was built correctly (check logs)
- Verify CORS_ORIGINS includes your domain

### Database connection fails
- Verify MongoDB connection string is correct
- Ensure MongoDB allows connections from Google Cloud (0.0.0.0/0)
- Check if JWT_SECRET is set

## Cost Estimation

Cloud Run pricing (approximate):
- **Free tier**: 2 million requests/month, 360,000 GB-seconds of memory
- **After free tier**: ~$0.40 per million requests + compute time

For a typical application with moderate traffic:
- **Estimated cost**: $10-50/month (depending on traffic)

To minimize costs:
- Set `--min-instances 0` for dev environments
- Use appropriate `--memory` setting (1Gi-2Gi)
- Implement caching strategies

## Next Steps

1. **Set up custom domain**: Map your domain to Cloud Run
2. **Configure CI/CD**: Auto-deploy from GitHub
3. **Enable monitoring**: Set up Cloud Monitoring and alerts
4. **Security**: Use Secret Manager for sensitive data
5. **Performance**: Configure CDN for static assets

For detailed instructions, see [DEPLOY_GOOGLE_CLOUD.md](./DEPLOY_GOOGLE_CLOUD.md)

## Support

- **Full documentation**: [docs/DEPLOY_GOOGLE_CLOUD.md](./DEPLOY_GOOGLE_CLOUD.md)
- **Google Cloud docs**: https://cloud.google.com/run/docs
- **Issues**: Create an issue in the GitHub repository
