# GNB Transfer - Complete Setup and Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Environment Variables](#environment-variables)
3. [Git Hooks Setup](#git-hooks-setup)
4. [Production Deployment](#production-deployment)
5. [Monitoring and Operations](#monitoring-and-operations)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## Local Development Setup

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **MongoDB**: Local instance or MongoDB Atlas account
- **Git**: Latest version

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/adem1273/gnb-transfer.git
cd gnb-transfer
```

#### 2. Install Dependencies
```bash
# Install root and frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Setup Environment Variables

**Frontend (.env in root directory)**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

**Backend (backend/.env)**:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure all required variables (see [Environment Variables](#environment-variables) section).

#### 4. Setup Git Hooks (Recommended)
```bash
./setup-hooks.sh
```

This will install pre-commit hooks that:
- Check for secrets and sensitive data
- Prevent committing .env files
- Run ESLint on JavaScript files
- Check for console statements
- Detect large files

#### 5. Start Development Servers

**Option A: Run both servers concurrently**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

---

## Environment Variables

### Backend Environment Variables (backend/.env)

#### Required Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database - MongoDB Atlas or local MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer

# Authentication - Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Payment Processing - Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# CORS - Allowed origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# OpenAI - For AI features
OPENAI_API_KEY=sk-your_openai_api_key_here
```

#### Optional Variables

```env
# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Error Tracking - Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Backups
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=gnb-transfer-backups
BACKUP_ENCRYPTION_KEY=your_encryption_key
```

### Frontend Environment Variables (.env in root)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Payment - Stripe Public Key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### How to Generate Secrets

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# Backup Encryption Key (32 bytes)
openssl rand -base64 32

# Session Secret (32 bytes)
openssl rand -base64 32
```

---

## Git Hooks Setup

### Automatic Setup
```bash
./setup-hooks.sh
```

### Manual Setup
```bash
# Copy pre-commit hook
cp .git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Or configure Git to use custom hooks directory
git config core.hooksPath .git-hooks
```

### What the Pre-Commit Hook Does
1. **Secret Detection**: Scans for API keys, passwords, and tokens
2. **Env File Prevention**: Blocks commits containing .env files
3. **Linting**: Runs ESLint on changed JavaScript files
4. **Console Statements**: Warns about console.log statements
5. **File Size Check**: Warns about large files (>5MB)
6. **Dependency Check**: Alerts on package.json changes

### Bypass Hook (Emergency Only)
```bash
git commit --no-verify -m "Emergency fix"
```

---

## Production Deployment

### Recommended Free Tier Stack
- **Frontend**: Vercel (Free tier)
- **Backend**: Render (Free tier) or Railway (Free tier)
- **Database**: MongoDB Atlas (Free tier - 512MB)
- **File Storage**: Cloudinary (Free tier) or AWS S3
- **Error Tracking**: Sentry (Free tier - 5000 events/month)
- **Analytics**: Google Analytics 4 (Free)

### Frontend Deployment (Vercel)

#### Method 1: Git Integration (Recommended)
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
   ```
7. Deploy

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Configure Custom Domain (Optional)
1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your domain
3. Configure DNS records as instructed

### Backend Deployment (Render)

#### Setup Instructions
1. Go to [Render](https://render.com)
2. Click "New +" > "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: gnb-transfer-backend
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. Add Environment Variables (see backend .env.example)
6. Create Service

#### Render Configuration File
The repository includes `render.yaml` for automatic configuration.

#### Get Deploy Hook URL
1. Go to Render Dashboard > Service > Settings
2. Scroll to "Deploy Hook"
3. Copy the webhook URL
4. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`

### Backend Deployment (Railway - Alternative)

#### Setup Instructions
1. Go to [Railway](https://railway.app)
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the backend configuration
5. Add Environment Variables
6. Deploy

#### Railway Configuration File
The repository includes `railway.json` for automatic configuration.

### Database Setup (MongoDB Atlas)

#### Create Free Tier Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create account or login
3. Create new cluster (M0 Free tier)
4. Choose cloud provider and region
5. Create cluster (takes 3-5 minutes)

#### Configure Database Access
1. Go to "Database Access"
2. Add new database user
3. Choose authentication method (password)
4. Set username and strong password
5. Grant "Read and Write to any database" role

#### Configure Network Access
1. Go to "Network Access"
2. Add IP Address
3. For development: Add your current IP
4. For production: Add deployment platform IPs
   - Render: Add 0.0.0.0/0 (or specific IPs)
   - Railway: Add 0.0.0.0/0 (or specific IPs)
   - Note: 0.0.0.0/0 allows all IPs (less secure but easier)

#### Get Connection String
1. Go to "Databases" > Click "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with your database name (e.g., gnb-transfer)

#### Add to Environment Variables
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer?retryWrites=true&w=majority
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

The repository includes automated CI/CD workflows:

#### 1. Frontend CI/CD (`.github/workflows/frontend.yml`)
- **Triggers**: Push/PR to main or develop
- **Jobs**:
  - Install dependencies
  - Run linting
  - Build application
  - Run tests
  - Deploy to Vercel (main branch only)

#### 2. Backend CI/CD (`.github/workflows/backend.yml`)
- **Triggers**: Push/PR to backend/** files
- **Jobs**:
  - Install dependencies
  - Run linting
  - Run unit tests
  - Security scan (npm audit)
  - Deploy to Render/Railway (main branch only)

#### 3. Security Scanning (`.github/workflows/security.yml`)
- **Triggers**: Push/PR, scheduled daily
- **Jobs**:
  - CodeQL analysis
  - Dependency review
  - NPM security audit
  - Secret scanning

#### 4. Health Check (`.github/workflows/health-check.yml`)
- **Triggers**: Scheduled daily at 8 AM UTC
- **Jobs**:
  - Check backend health
  - Check frontend health
  - Check database connectivity
  - Alert on failures (Slack/GitHub Issues)

#### 5. Database Backup (`.github/workflows/backup.yml`)
- **Triggers**: Scheduled daily at 3 AM UTC, manual
- **Jobs**:
  - Backup MongoDB database
  - Encrypt backup
  - Upload to S3 and GitHub Artifacts
  - Verify backup integrity
  - Cleanup old backups

### Required GitHub Secrets

Configure these in: Repository Settings > Secrets and variables > Actions

#### Frontend Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
VITE_API_URL=https://your-backend.onrender.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

#### Backend Deployment
```
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxx
BACKEND_URL=https://your-backend.onrender.com
```

Or for Railway:
```
RAILWAY_TOKEN=your_railway_token
```

#### Database Backups
```
MONGO_URI=mongodb+srv://...
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BACKUP_BUCKET=gnb-transfer-backups
BACKUP_ENCRYPTION_KEY=your_encryption_key
```

#### Monitoring and Alerts
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### How to Get Tokens

#### Vercel Token
```bash
# Install Vercel CLI
npm install -g vercel

# Login and get token
vercel login
# Token will be in ~/.vercel/auth.json

# Or create token in dashboard
# https://vercel.com/account/tokens
```

#### Render Deploy Hook
1. Go to Render Dashboard
2. Select your service
3. Settings > Deploy Hook
4. Copy webhook URL

#### Railway Token
1. Go to Railway Dashboard
2. Account Settings > Tokens
3. Create new token
4. Copy token

---

## Monitoring and Operations

### Health Monitoring

#### Manual Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/api/health

# Backend readiness
curl https://your-backend.onrender.com/api/ready

# Metrics (JSON)
curl https://your-backend.onrender.com/api/metrics

# Metrics (Prometheus format)
curl https://your-backend.onrender.com/metrics
```

#### Automated Health Checks
- GitHub Actions runs daily health checks
- Alerts sent to Slack and/or GitHub Issues on failure
- Configure `SLACK_WEBHOOK_URL` secret for Slack notifications

### Logging

#### Log Locations
- **Development**: Console output
- **Production**: 
  - Console (platform logs)
  - File logs in `backend/logs/` (if enabled)
  - Sentry for errors

#### View Logs
```bash
# Render
# Dashboard > Service > Logs

# Railway
# Dashboard > Service > Deployments > View Logs

# Local file logs
tail -f backend/logs/application-YYYY-MM-DD.log
tail -f backend/logs/error-YYYY-MM-DD.log
```

### Error Tracking (Sentry)

#### Setup
1. Create account at [Sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN
4. Add to backend environment variables:
   ```env
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```
5. Deploy

#### View Errors
- Visit Sentry Dashboard
- Filter by environment (production/development)
- Review error details, stack traces, and breadcrumbs

### Database Monitoring

#### MongoDB Atlas Monitoring
- Visit MongoDB Atlas Dashboard
- Go to cluster > Metrics
- Monitor:
  - Connection count
  - Query performance
  - Storage usage
  - Network I/O

### Performance Monitoring

#### Metrics Endpoint
```bash
curl https://your-backend.onrender.com/api/metrics | jq
```

Returns:
- Request statistics (total, success, errors)
- Response time metrics
- Error statistics
- System metrics (memory, CPU, uptime)

---

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

#### "MongoDB connection failed"
- Check MONGO_URI is correct
- Verify network access in MongoDB Atlas
- Check database user credentials
- Ensure IP whitelist includes deployment platform

#### "CORS errors in browser"
- Update CORS_ORIGINS in backend
- Include your frontend domain
- Redeploy backend

#### "Port already in use"
```bash
# Find process using port
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)

# Or change port
PORT=5001 npm start
```

#### "Build fails on Vercel"
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure package.json scripts are correct

### Getting Help

- **Documentation**: [RUNBOOK.md](./RUNBOOK.md)
- **Issues**: Create a GitHub issue
- **Email**: [support email]

---

## Security Best Practices

1. **Never commit secrets**: Use .env files (gitignored)
2. **Use strong secrets**: Generate with `openssl rand -base64 32`
3. **Enable 2FA**: On GitHub, Vercel, Render, MongoDB Atlas
4. **Regular updates**: Keep dependencies updated (Dependabot enabled)
5. **Monitor alerts**: Check Dependabot and security alerts
6. **Use pre-commit hooks**: Install with `./setup-hooks.sh`
7. **Rotate secrets**: Regularly rotate JWT_SECRET, API keys
8. **Backup database**: Automated daily backups configured
9. **Monitor logs**: Check for suspicious activity
10. **Use HTTPS**: Enabled by default on Vercel and Render

---

## Additional Resources

- [RUNBOOK.md](./RUNBOOK.md) - Operations and incident response
- [AI_FEATURES_API_DOCS.md](./AI_FEATURES_API_DOCS.md) - API documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

---

**Last Updated**: 2024-01-01  
**Maintained By**: GNB Transfer Development Team
