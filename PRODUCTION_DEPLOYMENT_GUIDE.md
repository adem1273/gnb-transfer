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
