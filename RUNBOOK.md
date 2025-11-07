# GNB Transfer Operations Runbook

This runbook provides step-by-step procedures for common operational tasks and incident response scenarios.

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Service Health Monitoring](#service-health-monitoring)
3. [Incident Response Procedures](#incident-response-procedures)
4. [Deployment Procedures](#deployment-procedures)
5. [Database Operations](#database-operations)
6. [Security Operations](#security-operations)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Emergency Contacts

### Service Owners
- **Primary Contact**: [Name] - [Email] - [Phone]
- **Secondary Contact**: [Name] - [Email] - [Phone]
- **On-Call Engineer**: Check on-call schedule

### External Services
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel**: https://vercel.com
- **Render**: https://render.com
- **Stripe**: https://dashboard.stripe.com
- **Sentry**: https://sentry.io

---

## Service Health Monitoring

### Health Check Endpoints

#### Backend Health
```bash
curl https://your-backend.onrender.com/api/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 12345,
    "database": {
      "connected": true,
      "state": "connected"
    }
  }
}
```

#### Backend Readiness
```bash
curl https://your-backend.onrender.com/api/ready
```

#### Metrics
```bash
# JSON format
curl https://your-backend.onrender.com/api/metrics

# Prometheus format
curl https://your-backend.onrender.com/metrics
```

### Automated Monitoring

The application uses GitHub Actions for automated health monitoring:
- **Schedule**: Daily at 8 AM UTC
- **Workflow**: `.github/workflows/health-check.yml`
- **Alerts**: Slack notifications + GitHub Issues

---

## Incident Response Procedures

### Severity Levels

#### P0 - Critical (Complete Outage)
- Service completely unavailable
- Database is down
- Payment processing is broken
- **Response Time**: Immediate
- **Resolution Time**: 1 hour

#### P1 - High (Partial Outage)
- Significant feature degradation
- Performance severely impacted
- **Response Time**: 15 minutes
- **Resolution Time**: 4 hours

#### P2 - Medium (Minor Issues)
- Non-critical features affected
- Workarounds available
- **Response Time**: 1 hour
- **Resolution Time**: 24 hours

#### P3 - Low (Cosmetic Issues)
- UI issues, minor bugs
- No functionality impact
- **Response Time**: Next business day
- **Resolution Time**: 1 week

### Incident Response Steps

1. **Acknowledge**: Confirm the incident and alert team
2. **Assess**: Determine severity and impact
3. **Contain**: Prevent further damage if possible
4. **Investigate**: Identify root cause
5. **Resolve**: Implement fix
6. **Verify**: Confirm resolution
7. **Document**: Create incident report
8. **Follow-up**: Implement preventive measures

### Common Incidents

#### Database Connection Failure

**Symptoms**:
- Health check shows database disconnected
- 500 errors on API endpoints

**Quick Fix**:
```bash
# 1. Check MongoDB Atlas status
# Visit: https://status.mongodb.com

# 2. Verify connection string
# Check that MONGO_URI secret is correct in deployment platform

# 3. Check IP whitelist
# Ensure deployment platform IPs are whitelisted in MongoDB Atlas

# 4. Restart backend service
# Render: Dashboard > Service > Manual Deploy > Deploy Latest Commit
# Railway: Dashboard > Service > Redeploy
```

**Resolution Steps**:
1. Check MongoDB Atlas cluster status
2. Verify network access settings (IP whitelist)
3. Check connection string validity
4. Review MongoDB Atlas logs
5. Restart backend service
6. Monitor health endpoint

#### High Error Rate

**Symptoms**:
- Error metrics above 5%
- Sentry showing multiple errors
- Users reporting issues

**Quick Fix**:
```bash
# 1. Check error logs
curl https://your-backend.onrender.com/api/metrics | jq '.errors'

# 2. Check Sentry for error details
# Visit: https://sentry.io

# 3. Rollback if recent deployment
# See "Rollback Deployment" section below
```

**Resolution Steps**:
1. Check error metrics and recent errors
2. Review Sentry error reports
3. Identify error patterns
4. Check recent deployments (correlate with error spike)
5. Rollback if deployment caused issues
6. Fix underlying issue
7. Deploy hotfix

#### Payment Processing Issues

**Symptoms**:
- Stripe webhook failures
- Payment errors in logs
- Customer complaints

**Quick Fix**:
```bash
# 1. Check Stripe Dashboard
# Visit: https://dashboard.stripe.com

# 2. Verify webhook endpoint
# Dashboard > Webhooks > Check endpoint status

# 3. Check webhook secret
# Verify STRIPE_WEBHOOK_SECRET is correct
```

**Resolution Steps**:
1. Check Stripe Dashboard for issues
2. Verify webhook endpoint configuration
3. Check webhook secret in environment variables
4. Review webhook event logs
5. Test payment flow in development
6. Contact Stripe support if needed

---

## Deployment Procedures

### Normal Deployment

Deployments are automated via GitHub Actions on push to `main` branch.

**Process**:
1. Code merged to `main`
2. CI/CD pipeline runs automatically
3. Tests and linting execute
4. Build artifacts created
5. Deployment to production
6. Health checks run

**Manual Trigger**:
```bash
# Trigger deployment via GitHub Actions
# Go to: Actions > [Workflow] > Run workflow
```

### Rollback Deployment

#### Render Rollback
```bash
# Via Dashboard
1. Go to Render Dashboard
2. Select your service
3. Go to "Events" tab
4. Find last successful deployment
5. Click "Rollback to this version"

# Via API
curl -X POST https://api.render.com/v1/services/[SERVICE_ID]/deploys/[DEPLOY_ID]/rollback \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

#### Vercel Rollback
```bash
# Via Dashboard
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Find last good deployment
5. Click three dots > "Promote to Production"

# Via CLI
vercel rollback [DEPLOYMENT_URL]
```

### Emergency Hotfix

For critical issues that need immediate deployment:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix

# 2. Make minimal changes
# Edit files

# 3. Commit and push
git add .
git commit -m "hotfix: critical bug fix"
git push origin hotfix/critical-fix

# 4. Create PR and merge to main
# OR for emergencies, push directly to main:
git checkout main
git merge hotfix/critical-fix
git push origin main
```

---

## Database Operations

### Backup Database

**Automated Backups**:
- Daily backups run at 3 AM UTC via GitHub Actions
- Stored in S3 and GitHub Artifacts
- Retention: 30 days (S3), 7 days (Artifacts)

**Manual Backup**:
```bash
# Trigger backup workflow
# Go to: Actions > Database Backup > Run workflow

# Or use mongodump locally
mongodump --uri="$MONGO_URI" --out=./backup --gzip
```

### Restore Database

**From Backup**:
```bash
# 1. Download backup
# From GitHub Actions artifacts or S3

# 2. Decrypt if encrypted
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in backup.tar.gz.enc \
  -out backup.tar.gz \
  -pass pass:"$BACKUP_ENCRYPTION_KEY"

# 3. Extract backup
tar -xzf backup.tar.gz

# 4. Restore to database
mongorestore --uri="$MONGO_URI" \
  --dir=./backup/gnb-transfer-backup-TIMESTAMP \
  --gzip \
  --drop

# 5. Verify restoration
mongo "$MONGO_URI" --eval "db.stats()"
```

**From MongoDB Atlas Snapshot**:
```bash
# 1. Go to MongoDB Atlas Dashboard
# 2. Select Cluster > Backup
# 3. Find snapshot to restore
# 4. Click "..." > Restore
# 5. Choose restore option:
#    - Download (to restore locally)
#    - Restore to cluster
#    - Query snapshot
```

### Database Maintenance

**Check Database Size**:
```bash
mongo "$MONGO_URI" --eval "
  db.stats().dataSize / (1024 * 1024) + ' MB'
"
```

**Cleanup Old Data**:
```bash
# Remove old sessions (example)
mongo "$MONGO_URI" --eval "
  db.sessions.deleteMany({
    updatedAt: { \$lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  })
"
```

---

## Security Operations

### Rotate Secrets

#### JWT Secret Rotation

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update in deployment platform
# Render: Dashboard > Environment > JWT_SECRET > Edit
# Railway: Dashboard > Variables > JWT_SECRET > Edit

# 3. Keep old secret temporarily (for existing tokens)
# Add JWT_SECRET_OLD with current value

# 4. Deploy changes

# 5. After token expiry period (7 days), remove JWT_SECRET_OLD
```

#### Database Credentials Rotation

```bash
# 1. Create new MongoDB user in Atlas
# Dashboard > Database Access > Add New Database User

# 2. Update MONGO_URI with new credentials
# In deployment platform environment variables

# 3. Deploy changes

# 4. Verify connection
curl https://your-backend.onrender.com/api/health

# 5. Delete old MongoDB user
# Dashboard > Database Access > Delete User
```

#### Stripe API Keys Rotation

```bash
# 1. Generate new keys in Stripe Dashboard
# Dashboard > Developers > API Keys > Create secret key

# 2. Update STRIPE_SECRET_KEY in backend
# Update environment variable in deployment platform

# 3. Update VITE_STRIPE_PUBLIC_KEY in frontend
# Update in Vercel environment variables

# 4. Deploy both frontend and backend

# 5. Roll old keys in Stripe Dashboard
# Dashboard > Developers > API Keys > Roll key
```

### Revoke Stripe Keys (Emergency)

```bash
# 1. Log in to Stripe Dashboard
# https://dashboard.stripe.com

# 2. Go to Developers > API Keys

# 3. Click "..." next to the key

# 4. Select "Roll key" or "Delete"

# 5. Update environment variables immediately

# 6. Deploy changes

# 7. Notify team about revocation
```

### Security Incident Response

**If secrets are leaked**:

1. **Immediate Actions**:
   - Rotate all affected secrets immediately
   - Review access logs for unauthorized access
   - Check for unusual activity in payment systems

2. **Investigation**:
   - Identify how secrets were leaked
   - Review commit history
   - Check for other potential exposures

3. **Prevention**:
   - Enable secret scanning in repository
   - Add pre-commit hooks
   - Update .gitignore
   - Train team on security best practices

---

## Troubleshooting Guide

### Application Won't Start

**Symptoms**: Service fails to start or crashes immediately

**Checks**:
```bash
# 1. Check environment variables
# Verify all required variables are set

# 2. Check logs
# Render: Dashboard > Logs
# Railway: Dashboard > Deployments > View Logs

# 3. Check MongoDB connection
# Verify MONGO_URI is correct and cluster is accessible

# 4. Check for syntax errors
npm run lint
```

### Slow Performance

**Symptoms**: High response times, timeouts

**Checks**:
```bash
# 1. Check metrics
curl https://your-backend.onrender.com/api/metrics

# 2. Check database performance
# MongoDB Atlas > Metrics

# 3. Check memory usage
# Deployment platform dashboard

# 4. Check for long-running queries
# MongoDB Atlas > Performance Advisor
```

**Quick Fixes**:
- Restart service
- Scale up instance (if on paid tier)
- Add database indexes
- Optimize slow queries

### CORS Errors

**Symptoms**: Browser console shows CORS errors

**Fix**:
```bash
# 1. Check CORS_ORIGINS environment variable
# Should include frontend domain

# 2. Update CORS_ORIGINS
# Format: https://frontend-domain.vercel.app,https://www.yourdomain.com

# 3. Redeploy backend
```

### High Memory Usage

**Symptoms**: Memory warnings, out of memory errors

**Checks**:
```bash
# 1. Check metrics endpoint
curl https://your-backend.onrender.com/api/metrics | jq '.system.memory'

# 2. Check for memory leaks
# Review recent code changes

# 3. Check for infinite loops or unbounded growth
```

**Quick Fixes**:
- Restart service
- Review and fix memory leaks
- Implement pagination for large queries
- Add limits to cache sizes

---

## Additional Resources

### Documentation
- [README.md](./README.md) - Setup and development guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [API Documentation](./AI_FEATURES_API_DOCS.md) - API reference

### Monitoring Dashboards
- **Backend Metrics**: `https://your-backend.onrender.com/api/metrics`
- **Sentry Errors**: `https://sentry.io/organizations/[org]/issues/`
- **MongoDB Atlas**: `https://cloud.mongodb.com`

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Slack**: [Your team channel]
- **Email**: [support email]

---

## Changelog

- **2024-01-01**: Initial version created
- Add your changes here with dates

---

**Note**: Keep this runbook up-to-date as the system evolves. Review and update quarterly or after major incidents.
