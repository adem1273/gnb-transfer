# Production Deployment Guide for Render.com

## Overview
This guide provides step-by-step instructions for deploying the GNB Transfer application to Render.com in production mode.

## Prerequisites
- Active Render.com account
- MongoDB Atlas database (or other MongoDB instance)
- Stripe account with API keys
- GitHub repository connected to Render

## Required Environment Variables

Configure the following environment variables in your Render dashboard:

### Critical Variables (MUST be set)

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode and security features |
| `PORT` | `10000` | Port for the application (Render default) |
| `CORS_ORIGINS` | `https://gnb-transfer.onrender.com` | Comma-separated list of allowed origins |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | MongoDB connection string |
| `JWT_SECRET` | `[auto-generated or custom]` | Secret for JWT token signing (min 32 chars) |

### Payment Integration

| Variable | Value | Description |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret key (use live key for production) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook secret for payment verification |

### Optional but Recommended

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key for AI features (optional) |
| `SENTRY_DSN` | `https://...@sentry.io/...` | Sentry error tracking DSN (optional) |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `TRUST_PROXY` | `true` | Trust proxy headers (automatically enabled in production) |

### Email Configuration (Optional)

Choose one of the following:

**Gmail:**
```
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

**Generic SMTP:**
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Time window in ms (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window (global) |
| `STRICT_RATE_LIMIT_MAX` | `5` | Max requests for auth endpoints |

### Build Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `NPM_CONFIG_PRODUCTION` | `false` | Install devDependencies for build |
| `NODE_OPTIONS` | `--max-old-space-size=512` | Node.js memory and module options |

## Deployment Steps

### 1. Render Dashboard Setup

1. Log in to [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`adem1273/gnb-transfer`)
4. Configure the service:
   - **Name**: `gnb-transfer` (or your preferred name)
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main` (or your deployment branch)
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### 2. Environment Variables

1. In the Render dashboard, go to **Environment** tab
2. Add all required environment variables listed above
3. For `JWT_SECRET`, click **"Generate"** to auto-create a secure secret
4. Click **"Save Changes"**

### 3. Health Check Configuration

Render uses the `/api/health` endpoint to check if your service is running:
- **Health Check Path**: `/api/health`
- **Expected Status**: `200 OK`

The endpoint returns:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-12T19:46:09.550Z",
    "uptime": 123.45,
    "environment": "production",
    "database": {
      "connected": true,
      "state": "connected"
    },
    "cache": { ... },
    "memory": { ... }
  },
  "message": "Server is healthy"
}
```

### 4. Deploy

1. Click **"Create Web Service"** or **"Manual Deploy"** → **"Deploy latest commit"**
2. Monitor the deployment logs in real-time
3. Wait for the build and deployment to complete (usually 3-5 minutes)

### 5. Verify Deployment

Once deployed, verify the following endpoints:

1. **Health Check**: `https://gnb-transfer.onrender.com/api/health`
   - Should return `{"success": true, "data": {...}}`

2. **Legacy Health**: `https://gnb-transfer.onrender.com/health`
   - Should return server status with port and CORS info

3. **API Test**: `https://gnb-transfer.onrender.com/api/tours`
   - Should return tour data or authentication error

4. **Frontend**: `https://gnb-transfer.onrender.com/`
   - Should load the React application

## Post-Deployment Checklist

- [ ] Health check endpoint returns 200 OK
- [ ] Database connection is successful (check logs)
- [ ] CORS is properly configured (test from frontend)
- [ ] JWT authentication works (login/register)
- [ ] Stripe payments are functional (if enabled)
- [ ] Admin panel is accessible
- [ ] API rate limiting is active
- [ ] SSL/HTTPS is enabled (automatic on Render)
- [ ] Error tracking is configured (Sentry, if enabled)

## Monitoring

### View Logs
1. Go to Render dashboard → Your service → **Logs** tab
2. Look for startup messages:
   ```
   ✓ Server running on http://0.0.0.0:10000
   ✓ Health check ready at /health and /api/health
   ✓ Port 10000 detected and bound successfully
   MongoDB connected successfully
   ```

### Metrics Endpoints

- **JSON Metrics**: `https://gnb-transfer.onrender.com/api/metrics`
- **Prometheus Format**: `https://gnb-transfer.onrender.com/metrics`

## Troubleshooting

### Build Failures

**Error: "Cannot find module"**
- Ensure `NPM_CONFIG_PRODUCTION=false` is set
- Check that all dependencies are in `package.json`
- Clear Render build cache and redeploy

**Error: "Out of memory"**
- Increase `NODE_OPTIONS` memory limit
- Consider upgrading to a paid Render plan

### Runtime Errors

**Error: "CORS policy blocked"**
- Verify `CORS_ORIGINS` includes your frontend URL
- Check that the URL matches exactly (no trailing slash)

**Error: "MongoDB connection failed"**
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- Ensure database user has correct permissions

**Error: "JWT_SECRET not set"**
- Add `JWT_SECRET` in Render environment variables
- Use "Generate" button for a secure random secret

### Performance Issues

**Slow initial load (cold start)**
- Free tier services sleep after inactivity
- Consider upgrading to paid tier for always-on service
- Implement a keep-alive ping service

## Scaling

### Free Tier Limitations
- Single instance (no horizontal scaling)
- 750 hours/month of runtime
- Service sleeps after 15 minutes of inactivity
- 512 MB RAM
- Shared CPU

### Upgrading
To handle more traffic, upgrade to:
- **Starter Plan**: $7/month, always-on, 512 MB RAM
- **Standard Plan**: $25/month, always-on, 2 GB RAM, horizontal scaling

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Enable HSTS** (automatically enabled in production)
4. **Keep dependencies updated** (`npm audit fix`)
5. **Monitor error logs** regularly
6. **Set up alerts** for downtime (Sentry, UptimeRobot, etc.)
7. **Use strong JWT secrets** (min 32 characters, auto-generated recommended)
8. **Whitelist CORS origins** (never use '*' in production)

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update
npm audit fix

# Test locally
npm run build
npm start

# Commit and push to trigger Render deployment
git add .
git commit -m "Update dependencies"
git push origin main
```

### Rollback
If a deployment fails:
1. Go to Render dashboard → Your service → **Deploys** tab
2. Find the last successful deploy
3. Click **"Rollback to this deploy"**

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GNB Transfer Issues**: https://github.com/adem1273/gnb-transfer/issues

## Additional Resources

- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

Last Updated: 2025-11-12
Version: 1.0.0
