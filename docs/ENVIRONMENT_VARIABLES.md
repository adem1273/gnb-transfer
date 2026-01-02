# Environment Variables Reference

Complete reference for all environment variables used in the GNB Transfer application.

## Table of Contents

1. [Frontend Environment Variables](#frontend-environment-variables)
2. [Backend Environment Variables](#backend-environment-variables)
3. [GitHub Actions Secrets](#github-actions-secrets)
4. [Configuration by Environment](#configuration-by-environment)

---

## Frontend Environment Variables

Located in root `.env` file (copy from `.env.example`)

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` | Yes |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_test_...` or `pk_live_...` | Yes |

### Optional Variables (Recommended)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID | `G-XXXXXXXXXX` | No |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity Project ID | `abc123xyz` | No |

### Environment-Specific Values

**Development:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_test_key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_CLARITY_PROJECT_ID=your_project_id
```

**Production:**
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_CLARITY_PROJECT_ID=your_project_id
```

---

## Backend Environment Variables

Located in `backend/.env` file (copy from `backend/.env.example`)

### Core Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development`, `production` | Yes |
| `PORT` | Server port | `5000` | Yes |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with `openssl rand -base64 32` | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d`, `24h`, `30d` | Yes |
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` | Yes |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173,https://app.com` | Recommended* |

*`CORS_ORIGINS` is highly recommended for production. If not set, the server will use safe defaults (`https://gnb-transfer.onrender.com`) and display warnings, but will not crash.

### Payment Processing

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | No |

### AI Features

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | No* |

*Required only if AI features are enabled

### Logging & Monitoring

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` | No |
| `ENABLE_FILE_LOGGING` | Enable file-based logging | `true`, `false` | No |
| `SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` | No |

### Email Configuration (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` | No |
| `EMAIL_PORT` | SMTP server port | `587` | No |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` | No |
| `EMAIL_PASSWORD` | SMTP password/app password | `your_app_password` | No |
| `EMAIL_FROM` | Email sender address | `noreply@gnb-transfer.com` | No |

### Rate Limiting

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `RATE_LIMIT_WHITELIST` | Comma-separated IPs to whitelist | `192.168.1.1,10.0.0.1` | No |
| `SKIP_RATE_LIMIT` | Skip rate limiting (dev only) | `true`, `false` | No |
| `TRUST_PROXY` | Trust proxy headers | `true`, `false`, `1`, `2` | Recommended* |

*`TRUST_PROXY` should be set to `true` or `1` in production when behind a reverse proxy (nginx, CloudFlare, load balancer)

### Cache & Redis Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | Recommended* |
| `CACHE_ENABLED` | Enable caching | `true`, `false` | No |
| `CACHE_TTL` | Cache time-to-live (seconds) | `3600` (1 hour) | No |
| `CACHE_CHECK_PERIOD` | Cache cleanup period (seconds) | `600` (10 min) | No |

*`REDIS_URL` is required for distributed rate limiting and caching in production

### File Upload

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5 MB) | No |
| `UPLOAD_DIR` | Upload directory path | `./uploads` | No |

### Feature Flags

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_AI_FEATURES` | Enable AI chat features | `true`, `false` | No |
| `ENABLE_ANALYTICS` | Enable analytics tracking | `true`, `false` | No |
| `ENABLE_PAYMENT` | Enable payment processing | `true`, `false` | No |
| `DEBUG` | Enable debug mode | `true`, `false` | No |

### Backup & Storage (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | `AKIA...` | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` | No |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `S3_BACKUP_BUCKET` | S3 bucket for backups | `gnb-backups` | No |
| `BACKUP_ENCRYPTION_KEY` | Backup encryption key | Generate strong random string | No |

### Monitoring URLs

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BACKEND_URL` | Backend public URL | `https://api.gnb-transfer.com` | No |
| `FRONTEND_URL` | Frontend public URL | `https://gnb-transfer.com` | No |

### Notifications

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `https://hooks.slack.com/...` | No |

---

## GitHub Actions Secrets

Configure in GitHub Repository Settings → Secrets and variables → Actions

### Deployment Secrets

#### Vercel (Frontend Deployment)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` after `vercel` command |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` after `vercel` command |
| `VITE_API_URL` | Backend API URL | Your backend URL |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key | Stripe dashboard |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | Google Analytics |
| `VITE_CLARITY_PROJECT_ID` | Clarity project ID | Microsoft Clarity |

#### Render (Backend Deployment)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL | Render → Settings → Deploy Hook |
| `BACKEND_URL` | Backend public URL | Your Render service URL |

#### Railway (Alternative Backend)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RAILWAY_TOKEN` | Railway API token | Railway → Account Settings → Tokens |

### Database & Backup Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `MONGO_URI` | MongoDB connection string | MongoDB Atlas dashboard |
| `TEST_MONGO_URI` | Test database URI (optional) | MongoDB Atlas test cluster |
| `AWS_ACCESS_KEY_ID` | AWS access key | AWS IAM console |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | AWS IAM console |
| `AWS_REGION` | AWS region | Your AWS region (e.g., `us-east-1`) |
| `S3_BACKUP_BUCKET` | S3 bucket name | Your S3 bucket name |
| `BACKUP_ENCRYPTION_KEY` | Backup encryption key | Generate: `openssl rand -base64 32` |

### Monitoring & Notifications

| Secret | Description | How to Get |
|--------|-------------|------------|
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry project settings |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | Slack → Apps → Incoming Webhooks |
| `FRONTEND_URL` | Frontend public URL | Your Vercel deployment URL |

---

## Configuration by Environment

### Local Development

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_test_key
VITE_GA_MEASUREMENT_ID=
VITE_CLARITY_PROJECT_ID=
```

**Backend (backend/.env):**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/gnb-transfer
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
STRIPE_SECRET_KEY=sk_test_your_test_key
OPENAI_API_KEY=sk-your-openai-key
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
SENTRY_DSN=
DEBUG=true
```

### Staging/Testing

**Frontend (Vercel Environment Variables):**
```env
VITE_API_URL=https://staging-api.gnb-transfer.com/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_test_key
VITE_GA_MEASUREMENT_ID=G-STAGING-ID
VITE_CLARITY_PROJECT_ID=staging_project_id
```

**Backend (Render Environment Variables):**
```env
NODE_ENV=staging
PORT=5000
MONGO_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/gnb-staging
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGINS=https://staging.gnb-transfer.com
STRIPE_SECRET_KEY=sk_test_your_test_key
OPENAI_API_KEY=sk-your-openai-key
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
SENTRY_DSN=https://staging@sentry.io/project
```

### Production

**Frontend (Vercel Environment Variables):**
```env
VITE_API_URL=https://api.gnb-transfer.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_key
VITE_GA_MEASUREMENT_ID=G-PRODUCTION-ID
VITE_CLARITY_PROJECT_ID=production_project_id
```

**Backend (Render Environment Variables):**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/gnb-production
JWT_SECRET=<very-strong-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGINS=https://gnb-transfer.com,https://www.gnb-transfer.com
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OPENAI_API_KEY=sk-your-openai-key
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
SENTRY_DSN=https://production@sentry.io/project
DEBUG=false
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=true
ENABLE_PAYMENT=true
BACKEND_URL=https://api.gnb-transfer.com
FRONTEND_URL=https://gnb-transfer.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Security Best Practices

### Secret Generation

Generate strong secrets:
```bash
# JWT Secret
openssl rand -base64 32

# Backup Encryption Key
openssl rand -base64 32

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Secret Management

**DO:**
- ✅ Use strong, randomly generated secrets
- ✅ Different secrets for each environment
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Store in environment variables or secret managers
- ✅ Use `.env` files locally (never commit them)

**DON'T:**
- ❌ Hardcode secrets in source code
- ❌ Commit `.env` files to git
- ❌ Share secrets in plain text
- ❌ Use weak or predictable secrets
- ❌ Reuse secrets across environments

### MongoDB URI Security

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?options
```

**Important:**
- URL-encode special characters in password
- Use strong passwords (20+ characters)
- Enable MongoDB authentication
- Whitelist only necessary IPs (or 0.0.0.0/0 for serverless)
- Use TLS/SSL connections (automatic with `mongodb+srv://`)

### Stripe Keys

**Test Mode (Development/Staging):**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

**Live Mode (Production Only):**
- Publishable: `pk_live_...`
- Secret: `sk_live_...`

**Never:**
- Mix test and live keys
- Expose secret keys in frontend code
- Commit keys to version control

---

## Troubleshooting

### Common Issues

**"Environment variable not defined"**
```bash
# Solution: Check variable is set in correct location
# Frontend: root .env file
# Backend: backend/.env file
# CI/CD: GitHub secrets
# Vercel: Vercel environment variables
# Render: Render environment variables
```

**"CORS error"**
```bash
# Solution: Add frontend URL to CORS_ORIGINS
CORS_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
```

**"MongoDB connection failed"**
```bash
# Solution: Check:
# 1. Connection string is correct
# 2. Password is URL-encoded
# 3. IP is whitelisted (0.0.0.0/0 for serverless)
# 4. Database user has correct permissions
```

**"JWT token invalid"**
```bash
# Solution: Ensure JWT_SECRET is:
# 1. Same across all backend instances
# 2. Strong and random
# 3. Not changed (invalidates existing tokens)
```

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All required environment variables are set
- [ ] Secrets are strong and randomly generated
- [ ] Test keys are not used in production
- [ ] CORS origins include production URLs
- [ ] MongoDB connection string is correct
- [ ] JWT secret is strong (32+ characters)
- [ ] Stripe live keys are configured
- [ ] Sentry DSN is set (for error tracking)
- [ ] Analytics IDs are configured
- [ ] Backup configuration is complete
- [ ] Frontend points to production backend
- [ ] Backend allows frontend origin in CORS
- [ ] No `.env` files are committed to git

---

## Quick Reference

### Generate Secrets
```bash
# Strong random secret (32 bytes)
openssl rand -base64 32

# UUID
node -e "console.log(require('crypto').randomUUID())"

# Random hex (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Configuration
```bash
# Frontend
npm run build  # Should complete without errors

# Backend
cd backend
npm start     # Should connect to database successfully
```

### Verify Variables
```bash
# Check if variable is set
echo $VARIABLE_NAME

# List all environment variables
env | grep VITE_
env | grep NODE_
```

---

**Last Updated:** 2024
**Version:** 1.0
