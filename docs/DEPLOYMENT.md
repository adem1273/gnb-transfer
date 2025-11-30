# Deployment Guide - Free Tier Infrastructure

This guide provides step-by-step instructions for deploying the GNB Transfer application using entirely free-tier hosting services.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
- [Backend Deployment (Render/Railway)](#backend-deployment-renderrailway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [CI/CD Setup (GitHub Actions)](#cicd-setup-github-actions)
- [Performance Optimizations](#performance-optimizations)
- [Cost Breakdown](#cost-breakdown)

---

## Overview

The application uses the following free-tier services:

| Service | Purpose | Free Tier Limits |
|---------|---------|------------------|
| **MongoDB Atlas** | Database | 512MB storage, shared cluster |
| **Render** or **Railway** | Backend API | 750 hours/month (Render), 500 hours/month (Railway) |
| **Vercel** | Frontend hosting | 100GB bandwidth, unlimited sites |
| **GitHub Actions** | CI/CD | 2,000 minutes/month for public repos |
| **Cloudinary** (optional) | Image hosting | 25GB storage, 25GB bandwidth |

**Total Monthly Cost:** $0

---

## Prerequisites

1. **GitHub Account** - For repository hosting and CI/CD
2. **MongoDB Atlas Account** - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
3. **Vercel Account** - [Sign up here](https://vercel.com/signup)
4. **Render Account** - [Sign up here](https://render.com/register) OR
5. **Railway Account** - [Sign up here](https://railway.app/)
6. **Stripe Account** - [Sign up here](https://stripe.com) (for payment processing)

---

## Database Setup (MongoDB Atlas)

### Step 1: Create a Free Cluster

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Build a Database"**
3. Select **"Shared"** (Free tier)
4. Choose your cloud provider and region (select closest to your backend hosting)
5. Keep cluster name as default or customize
6. Click **"Create Cluster"**

### Step 2: Create Database User

1. Navigate to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username and generate a secure password
5. Set user privileges to **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Configure Network Access

1. Navigate to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0) - Required for serverless backends
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go back to **Database** and click **"Connect"** on your cluster
2. Select **"Connect your application"**
3. Copy the connection string (looks like: `mongodb+srv://...`)
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with your database name (e.g., `gnb-transfer`)

**Save this connection string** - you'll need it for backend deployment.

### Step 5: Create Indexes (Optional but Recommended)

Connect to your database using MongoDB Compass or the Atlas UI and create indexes:

```javascript
// On 'bookings' collection
db.bookings.createIndex({ "user": 1, "status": 1 });
db.bookings.createIndex({ "email": 1 });
db.bookings.createIndex({ "tourId": 1, "status": 1 });

// On 'tours' collection
db.tours.createIndex({ "title": "text", "description": "text" });
db.tours.createIndex({ "isCampaign": 1, "price": -1 });

// On 'users' collection (automatically created by Mongoose)
db.users.createIndex({ "email": 1 }, { unique: true });
```

---

## Backend Deployment (Render/Railway)

### Option A: Render (Recommended)

#### Step 1: Connect Repository

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `gnb-transfer` repository

#### Step 2: Configure Service

Use these settings:

- **Name:** `gnb-transfer-backend` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** Leave empty
- **Runtime:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Plan:** `Free`

#### Step 3: Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate with: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (sk_live_...) |
| `CORS_ORIGINS` | Your Vercel frontend URL (add after frontend deployment) |
| `BCRYPT_ROUNDS` | `10` |

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (~5 minutes)
3. Your backend will be available at: `https://your-service-name.onrender.com`

#### Step 5: Verify Health

Visit `https://your-service-name.onrender.com/api/health` to verify deployment.

---

### Option B: Railway

#### Step 1: Connect Repository

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `gnb-transfer` repository

#### Step 2: Configure Service

1. Railway will auto-detect Node.js
2. Add environment variables (same as Render above)
3. Railway uses the `railway.json` configuration automatically

#### Step 3: Deploy

1. Railway will automatically deploy
2. Click on your service to get the deployment URL
3. Your backend will be available at: `https://your-service-name.railway.app`

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your `gnb-transfer` repository
4. Vercel will auto-detect it as a Vite project

### Step 2: Configure Build Settings

Vercel should auto-configure these, but verify:

- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Environment Variables

Add these environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend URL (e.g., `https://gnb-transfer-backend.onrender.com/api`) |
| `VITE_STRIPE_PUBLIC_KEY` | Your Stripe public key (pk_live_...) |

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~3-5 minutes)
3. Your frontend will be available at: `https://your-project-name.vercel.app`

### Step 5: Update Backend CORS

Go back to your backend service (Render/Railway) and update the `CORS_ORIGINS` environment variable to include your Vercel URL:

```
CORS_ORIGINS=https://your-project-name.vercel.app
```

Restart the backend service for changes to take effect.

---

## CI/CD Setup (GitHub Actions)

The repository includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) for automated deployments.

### Step 1: Add GitHub Secrets

Go to your repository **Settings** → **Secrets and variables** → **Actions** and add:

#### For Vercel Deployment:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory and follow prompts
3. Get these values from `.vercel/project.json`:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Get `VERCEL_TOKEN` from [Vercel account settings](https://vercel.com/account/tokens)

Add these as GitHub secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL` (your backend URL)

#### For Render Deployment:

1. Go to Render dashboard → Your service → Settings
2. Scroll to **Deploy Hook**
3. Copy the deploy hook URL
4. Add as GitHub secret: `RENDER_DEPLOY_HOOK_URL`

### Step 2: Enable Actions

GitHub Actions is enabled by default. The workflow will:
- Run on every push to `main` or `develop` branches
- Run on pull requests
- Automatically deploy to production on `main` branch pushes

---

## Performance Optimizations

### Caching Strategy

The backend implements in-memory caching with `node-cache`:

- **Tours list**: Cached for 10 minutes
- **Campaign tours**: Cached for 15 minutes
- **Most popular tours**: Cached for 30 minutes
- **Individual tours**: Cached for 15 minutes

Cache is automatically invalidated when tours are created/updated/deleted.

### Frontend Optimizations

- **Code splitting**: React components are lazy-loaded
- **Asset compression**: Gzip and Brotli compression enabled
- **Tree shaking**: Unused code removed during build
- **Minification**: Console logs removed in production
- **Vendor chunking**: React libraries separated for better caching

### Database Optimizations

- Indexes on frequently queried fields (see MongoDB setup)
- Compound indexes for common query patterns
- Connection pooling handled by Mongoose

---

## Cost Breakdown

### Monthly Costs (All Free Tier)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| MongoDB Atlas | 512MB, shared cluster | Database storage | $0 |
| Render/Railway | 750/500 hours | Backend hosting | $0 |
| Vercel | 100GB bandwidth | Frontend hosting | $0 |
| GitHub Actions | 2,000 minutes | CI/CD | $0 |
| Cloudinary (optional) | 25GB storage, 25GB bandwidth | Image hosting | $0 |

**Total:** $0/month

### Free Tier Limitations

1. **Render Free Tier:**
   - Spins down after 15 minutes of inactivity
   - Cold start ~30 seconds on first request
   - 750 hours/month (sufficient for 1 service running 24/7)

2. **Railway Free Tier:**
   - $5 credit each month
   - Spins down after inactivity
   - 500 hours/month execution time

3. **MongoDB Atlas:**
   - 512MB storage limit
   - Shared cluster (slower performance)
   - Suitable for ~1000-5000 documents

4. **Vercel:**
   - 100GB bandwidth/month
   - Serverless function timeout: 10 seconds (Hobby plan)

### Scaling Beyond Free Tier

When you outgrow free tier:

1. **MongoDB Atlas:** Upgrade to M2 cluster (~$9/month)
2. **Render:** Starter plan at $7/month (no spin down)
3. **Vercel:** Pro plan at $20/month (100GB → unlimited bandwidth)

---

## Monitoring and Health Checks

### Health Endpoint

The backend provides a comprehensive health check endpoint:

```
GET /api/health
```

Response includes:
- Server status
- Database connection status
- Cache statistics
- Memory usage
- Uptime

### Monitoring Tools (Free)

- **UptimeRobot**: Monitor backend uptime (free plan: 50 monitors)
- **Vercel Analytics**: Built-in analytics for frontend
- **MongoDB Atlas Monitoring**: Database performance metrics

---

## Troubleshooting

### Backend Won't Start

1. Check environment variables are set correctly
2. Verify MongoDB connection string is valid
3. Check Render/Railway logs for errors

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` is set correctly
2. Check backend CORS settings include frontend URL
3. Ensure backend is running (check health endpoint)

### Database Connection Errors

1. Verify IP whitelist includes 0.0.0.0/0
2. Check database user credentials
3. Ensure connection string password is URL-encoded

### Build Failures

1. Check Node.js version (requires 18+)
2. Verify all dependencies are installed
3. Check GitHub Actions logs for specific errors

---

## Security Checklist

- [ ] All environment variables are set (not hardcoded)
- [ ] JWT_SECRET is a strong random string
- [ ] MongoDB uses strong password
- [ ] CORS is configured with specific origins (not *)
- [ ] Rate limiting is enabled
- [ ] Helmet middleware is active
- [ ] HTTPS is enforced (automatic on Vercel/Render)

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service-specific documentation
3. Check repository issues on GitHub


## Additional Deployment Information

# Production Deployment & Monitoring Guide

## Overview

This guide provides complete instructions for deploying the GNB Transfer application to production and setting up automated monitoring and backup systems.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Deployment Process](#deployment-process)
5. [MongoDB Atlas Backup](#mongodb-atlas-backup)
6. [Error Monitoring with Sentry](#error-monitoring-with-sentry)
7. [Analytics Integration](#analytics-integration)
8. [Health Check Monitoring](#health-check-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the deployment process, ensure you have:

- [x] GitHub repository access with admin rights
- [x] MongoDB Atlas account (free tier available)
- [x] Vercel account for frontend hosting
- [x] Render or Railway account for backend hosting
- [x] Stripe account for payment processing
- [x] (Optional) Sentry account for error tracking
- [x] (Optional) Google Analytics 4 account
- [x] (Optional) Microsoft Clarity account
- [x] (Optional) AWS account for backup storage

---

## Environment Setup

### 1. GitHub Secrets Configuration

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions**

#### Required Secrets

**For Vercel (Frontend):**
```
VERCEL_TOKEN           # Get from: https://vercel.com/account/tokens
VERCEL_ORG_ID          # From .vercel/project.json after first deployment
VERCEL_PROJECT_ID      # From .vercel/project.json after first deployment
VITE_API_URL           # Your backend URL (e.g., https://api.gnb-transfer.com/api)
VITE_STRIPE_PUBLIC_KEY # Your Stripe public key (pk_live_...)
```

**For Render (Backend):**
```
RENDER_DEPLOY_HOOK_URL # Get from Render dashboard → Service → Settings → Deploy Hook
BACKEND_URL            # Your backend URL (e.g., https://api.gnb-transfer.com)
```

**For MongoDB:**
```
MONGO_URI              # Your MongoDB Atlas connection string
```

**Optional but Recommended:**
```
VITE_GA_MEASUREMENT_ID    # Google Analytics Measurement ID (G-XXXXXXXXXX)
VITE_CLARITY_PROJECT_ID   # Microsoft Clarity Project ID
SENTRY_DSN                # Sentry Data Source Name
FRONTEND_URL              # Your frontend URL (e.g., https://gnb-transfer.com)
SLACK_WEBHOOK_URL         # For deployment notifications
```

**For Backups (Optional):**
```
AWS_ACCESS_KEY_ID         # AWS access key for S3 backups
AWS_SECRET_ACCESS_KEY     # AWS secret key
AWS_REGION                # AWS region (default: us-east-1)
S3_BACKUP_BUCKET          # S3 bucket name for backups
BACKUP_ENCRYPTION_KEY     # Strong encryption key for backups
```

### 2. Backend Environment Variables

Set these in your Render/Railway dashboard:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<generate-strong-secret>  # Use: openssl rand -base64 32
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

---

## CI/CD Pipeline

The project includes several automated workflows:

### Available Workflows

1. **`production-deploy.yml`** - Main production deployment workflow
2. **`frontend.yml`** - Frontend-specific CI/CD
3. **`backend.yml`** - Backend-specific CI/CD
4. **`ci-cd.yml`** - Unified CI/CD pipeline
5. **`backup.yml`** - Daily database backup
6. **`health-check.yml`** - Daily health monitoring
7. **`security.yml`** - Security scanning

### Production Deployment Workflow

The `production-deploy.yml` workflow automatically:
- Detects changes in frontend/backend
- Runs linting and tests
- Builds production artifacts
- Deploys to Vercel and Render
- Verifies deployment health
- Sends notifications

**Trigger Options:**
- **Automatic:** Pushes to `main` branch
- **Manual:** GitHub Actions → Production Deployment → Run workflow

**Manual Deployment:**
```bash
# Go to GitHub Actions
# Select "Production Deployment"
# Click "Run workflow"
# Select:
#   - Branch: main
#   - Deploy target: both/frontend/backend
#   - Environment: production/staging
```

---

## Deployment Process

### Step-by-Step Deployment

#### 1. Initial Setup

**a. Setup Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
cd /path/to/gnb-transfer
vercel

# Follow prompts to create project
# Copy ORG_ID and PROJECT_ID from .vercel/project.json
# Add to GitHub secrets
```

**b. Setup Render:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** gnb-transfer-backend
   - **Branch:** main
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Add all backend variables
5. Copy deploy hook URL from Settings → Deploy Hook
6. Add to GitHub secrets as `RENDER_DEPLOY_HOOK_URL`

**c. Setup MongoDB Atlas:**
1. Create free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Add IP whitelist: 0.0.0.0/0 (for serverless backends)
4. Get connection string
5. Add to GitHub secrets as `MONGO_URI`

#### 2. First Deployment

```bash
# Commit and push to main branch
git add .
git commit -m "Initial production deployment"
git push origin main

# Or trigger manual deployment from GitHub Actions
```

#### 3. Verify Deployment

**Backend Health Check:**
```bash
curl https://your-backend-url.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": {
    "connected": true,
    "name": "gnb-transfer"
  }
}
```

**Frontend Check:**
```bash
curl -I https://your-frontend.vercel.app
```

Expected: `HTTP/2 200`

---

## MongoDB Atlas Backup

### Configuration

The backup system runs automatically with the following features:

**Backup Schedule:**
- Runs daily at 3 AM UTC
- Retention: 7 days in GitHub Artifacts
- Retention: 30 days in S3 (if configured)

**What's Backed Up:**
- Complete database dump (all collections)
- Compressed with gzip
- Encrypted if `BACKUP_ENCRYPTION_KEY` is set

### Manual Backup

Trigger manually from GitHub Actions:
```bash
# GitHub → Actions → Database Backup → Run workflow
# Select backup type: scheduled/manual/emergency
```

### Backup Storage Options

**Option 1: GitHub Artifacts (Default)**
- No setup required
- 7-day retention
- Limited to workflow runs

**Option 2: AWS S3 (Recommended)**
```bash
# Setup AWS credentials in GitHub secrets:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BACKUP_BUCKET=gnb-transfer-backups
BACKUP_ENCRYPTION_KEY=<strong-random-string>

# Backups will automatically upload to S3
# Old backups (>30 days) are automatically deleted
```

### Restore from Backup

**From GitHub Artifacts:**
```bash
# Download backup from GitHub Actions artifacts
# Extract the archive
tar -xzf backup.tar.gz

# Restore to MongoDB
mongorestore --uri="your-mongodb-uri" --gzip ./backup-directory
```

**From S3:**
```bash
# Download from S3
aws s3 cp s3://your-bucket/mongodb/backup.tar.gz.enc ./

# Decrypt (if encrypted)
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in backup.tar.gz.enc \
  -out backup.tar.gz \
  -pass pass:"your-encryption-key"

# Extract and restore
tar -xzf backup.tar.gz
mongorestore --uri="your-mongodb-uri" --gzip ./backup-directory
```

---

## Error Monitoring with Sentry

### Setup

**1. Create Sentry Project:**
```bash
# Go to https://sentry.io
# Create new project → Select "Node.js"
# Copy the DSN
```

**2. Configure Backend:**
```bash
# Add to Render environment variables:
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Sentry is already integrated in backend/config/sentry.mjs
# It will automatically initialize when DSN is present
```

**3. Verify Integration:**
```bash
# Check backend logs for:
# "Sentry initialized successfully"

# Test by triggering an error:
curl -X POST https://your-backend-url.onrender.com/api/test-error
```

### Features

**Automatic Error Tracking:**
- All uncaught exceptions
- Express route errors
- Database errors
- Performance monitoring

**Privacy Protection:**
- Sensitive headers removed (authorization, cookies)
- Sensitive data filtered (passwords, tokens)
- Configurable ignore list

**Access Errors:**
- Go to Sentry dashboard
- View error details, stack traces, breadcrumbs
- Set up alerts and notifications

### Alternative: Logtail

If you prefer Logtail instead of Sentry:

```bash
# Install
npm install --save winston-logtail

# Update backend/config/logger.mjs to include Logtail transport
# Add LOGTAIL_SOURCE_TOKEN to environment variables
```

---

## Analytics Integration

### Google Analytics 4

**Setup:**
```bash
# 1. Create GA4 property at https://analytics.google.com
# 2. Create web data stream
# 3. Copy Measurement ID (G-XXXXXXXXXX)
# 4. Add to GitHub secrets:
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 5. Add to Vercel environment variables (same value)
```

**Verification:**
```bash
# Open your website
# Open DevTools → Network
# Look for requests to google-analytics.com
# Check GA4 real-time reports
```

### Microsoft Clarity

**Setup:**
```bash
# 1. Create project at https://clarity.microsoft.com
# 2. Copy Project ID
# 3. Add to GitHub secrets:
VITE_CLARITY_PROJECT_ID=your_project_id

# 4. Add to Vercel environment variables (same value)
```

**Verification:**
```bash
# Visit your website
# Wait a few minutes
# Check Clarity dashboard for recordings
```

### Privacy & GDPR Compliance

The app includes:
- Cookie consent banner (CookieConsent component)
- Opt-out functionality
- Analytics initialization only after consent
- Privacy-compliant tracking

Users can opt-out via privacy settings or browser settings.

---

## Health Check Monitoring

### Automated Health Checks

**Schedule:** Daily at 8 AM UTC (configurable in `.github/workflows/health-check.yml`)

**Checks Performed:**
- Backend API health endpoint
- Backend readiness endpoint
- Frontend availability
- Database connectivity

**Notifications:**
- Slack notifications on failure (if configured)
- GitHub issues created for repeated failures
- Email alerts (if GitHub notifications enabled)

### Manual Health Check

**Trigger from GitHub Actions:**
```bash
# GitHub → Actions → Health Check Monitoring → Run workflow
```

**Check Manually:**
```bash
# Backend health
curl https://your-backend-url.onrender.com/api/health

# Expected response includes:
# - status: ok/error
# - uptime
# - database connection status
# - memory usage
```

### Setting Up Alerts

**Option 1: Slack Notifications**
```bash
# Create Slack webhook
# Add to GitHub secrets:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Option 2: External Monitoring (UptimeRobot)**
```bash
# Sign up at https://uptimerobot.com (free tier: 50 monitors)
# Create monitor for:
#   - https://your-backend.onrender.com/api/health
#   - https://your-frontend.vercel.app
# Set alert contacts (email, Slack, etc.)
```

---

## Troubleshooting

### Deployment Failures

**Frontend Build Fails:**
```bash
# Check build logs in GitHub Actions
# Common issues:
# - Missing environment variables
# - Dependency conflicts
# - TypeScript errors

# Fix:
# 1. Verify all secrets are set
# 2. Run build locally: npm run build
# 3. Check Vercel deployment logs
```

**Backend Deployment Fails:**
```bash
# Check Render logs
# Common issues:
# - MongoDB connection failure
# - Missing environment variables
# - Port configuration

# Fix:
# 1. Verify MONGO_URI is correct
# 2. Check all environment variables are set
# 3. Review Render deployment logs
```

### Backend Not Accessible

```bash
# Check if Render service is running
# Render free tier spins down after inactivity

# Solutions:
# 1. Wait 30-60 seconds for cold start
# 2. Check Render dashboard for errors
# 3. Verify CORS_ORIGINS includes frontend URL
```

### Database Connection Issues

```bash
# Common issues:
# - IP not whitelisted
# - Wrong connection string
# - Password not URL-encoded

# Fix:
# 1. MongoDB Atlas → Network Access → Add 0.0.0.0/0
# 2. Verify connection string format
# 3. URL-encode special characters in password
```

### Analytics Not Tracking

```bash
# Check browser console for errors
# Verify environment variables are set
# Check ad blockers aren't blocking scripts

# Debug:
# 1. Open DevTools → Console
# 2. Look for analytics initialization logs
# 3. Check Network tab for analytics requests
# 4. Verify user hasn't opted out
```

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] Frontend is accessible at production URL
- [ ] Backend health endpoint returns 200 OK
- [ ] Database connection is working
- [ ] Authentication works (login/signup)
- [ ] Payment processing works (test with Stripe test cards)
- [ ] Analytics tracking is active (check GA4 real-time)
- [ ] Error monitoring is capturing events (check Sentry)
- [ ] Backups are running (check GitHub Actions)
- [ ] Health checks are passing (check workflow runs)
- [ ] SSL certificates are valid (HTTPS)
- [ ] CORS is properly configured
- [ ] Environment variables are all set
- [ ] Monitoring alerts are configured

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review Sentry error reports
- [ ] Check application performance metrics
- [ ] Review analytics data

**Monthly:**
- [ ] Update dependencies (npm update)
- [ ] Review and optimize database indexes
- [ ] Check backup integrity
- [ ] Review security alerts

**Quarterly:**
- [ ] Update Node.js version if needed
- [ ] Review and update documentation
- [ ] Perform load testing
- [ ] Review and renew SSL certificates (automatic with Vercel/Render)

---

## Support & Resources

- **Documentation:** See DEPLOYMENT.md, RUNBOOK.md
- **GitHub Issues:** For bug reports and feature requests
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Sentry Docs:** https://docs.sentry.io
- **GA4 Docs:** https://developers.google.com/analytics/devguides/collection/ga4

---

## Quick Reference

### Useful Commands

```bash
# Check backend health
curl https://your-backend.onrender.com/api/health

# Trigger deployment
git push origin main

# Run manual backup
# GitHub → Actions → Database Backup → Run workflow

# Check logs
# Render → Your Service → Logs
# Vercel → Your Project → Deployments → View Function Logs

# Restore database
mongorestore --uri="mongodb-uri" --gzip ./backup-dir
```

### Important URLs

- **Frontend:** https://your-frontend.vercel.app
- **Backend:** https://your-backend.onrender.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Sentry:** https://sentry.io
- **Google Analytics:** https://analytics.google.com
- **Microsoft Clarity:** https://clarity.microsoft.com

---

**Last Updated:** 2024
**Maintainer:** GNB Transfer Team
