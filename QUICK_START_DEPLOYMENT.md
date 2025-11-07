# Quick Start Deployment Guide

Get your GNB Transfer application live in production in under 30 minutes.

## Prerequisites Checklist

Before you begin, sign up for these free services:

- [ ] GitHub account (you have this!)
- [ ] [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) - Free 512MB database
- [ ] [Vercel](https://vercel.com/signup) - Free frontend hosting
- [ ] [Render](https://render.com/register) - Free backend hosting (750 hrs/month)
- [ ] [Stripe](https://stripe.com) - Payment processing

Optional (but recommended):
- [ ] [Sentry](https://sentry.io) - Error tracking (5000 events/month free)
- [ ] [Google Analytics](https://analytics.google.com) - Free web analytics
- [ ] [Microsoft Clarity](https://clarity.microsoft.com) - Free user behavior analytics

## Step 1: Setup MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free cluster
2. Click **"Database Access"** → Add user with read/write permissions
3. Click **"Network Access"** → Add IP: `0.0.0.0/0` (allow from anywhere)
4. Click **"Connect"** → Get connection string
5. Copy the connection string (you'll need it later)

**Example connection string:**
```
mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer?retryWrites=true&w=majority
```

## Step 2: Deploy Backend to Render (10 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `gnb-transfer` repository
4. Configure:
   - **Name:** `gnb-transfer-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free
5. Add environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<generate-using-command-below>
   CORS_ORIGINS=<will-add-after-frontend-deployed>
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   ```
6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://gnb-transfer-backend.onrender.com`)

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

## Step 3: Deploy Frontend to Vercel (10 minutes)

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your `gnb-transfer` repository
4. Vercel auto-detects Vite configuration
5. Add environment variables:
   ```
   VITE_API_URL=<your-render-backend-url>/api
   VITE_STRIPE_PUBLIC_KEY=<your-stripe-public-key>
   ```
6. Click **"Deploy"**
7. Wait for deployment (3-5 minutes)
8. Copy your frontend URL (e.g., `https://gnb-transfer.vercel.app`)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd /path/to/gnb-transfer
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project name? gnb-transfer
# - In which directory is your code? ./
# - Want to override settings? No

# Deploy to production
vercel --prod

# Get ORG_ID and PROJECT_ID
cat .vercel/project.json
```

## Step 4: Update Backend CORS (2 minutes)

1. Go back to Render dashboard
2. Open your backend service
3. Click **"Environment"**
4. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
5. Click **"Save Changes"**
6. Backend will automatically redeploy

## Step 5: Setup GitHub Actions (5 minutes)

1. Go to your GitHub repository
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"** and add:

**For Vercel:**
```
VERCEL_TOKEN            = <from-vercel-account-tokens>
VERCEL_ORG_ID           = <from-.vercel/project.json>
VERCEL_PROJECT_ID       = <from-.vercel/project.json>
VITE_API_URL            = https://your-backend.onrender.com/api
VITE_STRIPE_PUBLIC_KEY  = pk_live_your_stripe_public_key
```

**For Render:**
```
RENDER_DEPLOY_HOOK_URL  = <from-render-settings-deploy-hook>
BACKEND_URL             = https://your-backend.onrender.com
```

**For MongoDB:**
```
MONGO_URI = <your-mongodb-connection-string>
```

**Get Vercel Token:**
- Go to https://vercel.com/account/tokens
- Click **"Create"**
- Name it "GitHub Actions"
- Copy the token

**Get Render Deploy Hook:**
- Render Dashboard → Your Service → Settings
- Scroll to **"Deploy Hook"**
- Click **"Create Deploy Hook"**
- Copy the URL

## Step 6: Test Your Deployment (5 minutes)

### Backend Health Check
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connected": true
  }
}
```

### Frontend Check
Open your Vercel URL in a browser. You should see the GNB Transfer homepage.

### End-to-End Test
1. Visit your frontend URL
2. Try browsing tours
3. Test search functionality
4. Try creating an account
5. Test booking flow

## Optional Enhancements (10 minutes)

### Enable Error Monitoring (Sentry)

1. Create account at [Sentry.io](https://sentry.io)
2. Create new Node.js project
3. Copy the DSN
4. Add to Render environment variables:
   ```
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```
5. Backend will automatically enable Sentry on restart

### Enable Analytics

**Google Analytics 4:**
1. Create GA4 property at [Google Analytics](https://analytics.google.com)
2. Copy Measurement ID (G-XXXXXXXXXX)
3. Add to Vercel environment variables:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Redeploy frontend

**Microsoft Clarity:**
1. Create project at [Microsoft Clarity](https://clarity.microsoft.com)
2. Copy Project ID
3. Add to Vercel environment variables:
   ```
   VITE_CLARITY_PROJECT_ID=your_project_id
   ```
4. Redeploy frontend

### Enable Automated Backups (AWS S3)

1. Create AWS account (free tier)
2. Create S3 bucket: `gnb-transfer-backups`
3. Create IAM user with S3 write permissions
4. Add to GitHub secrets:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   S3_BACKUP_BUCKET=gnb-transfer-backups
   BACKUP_ENCRYPTION_KEY=<openssl rand -base64 32>
   ```
5. Backups will run daily at 3 AM UTC automatically

## Continuous Deployment

Your app is now configured for continuous deployment!

**Automatic Deployment:**
- Push to `main` branch → Auto-deploys to production
- Changes detected automatically (frontend/backend)
- Health checks run after deployment
- Notifications sent (if Slack configured)

**Manual Deployment:**
```bash
# Go to GitHub → Actions → Production Deployment → Run workflow
# Select branch, target (frontend/backend/both), and environment
```

## Verify Everything Works

Use this checklist:

- [ ] Frontend loads at Vercel URL
- [ ] Backend health endpoint returns 200 OK
- [ ] Can create user account
- [ ] Can browse tours
- [ ] Can search tours
- [ ] Database connection working
- [ ] Stripe payment test works
- [ ] Analytics tracking (check GA4 real-time)
- [ ] Error tracking (trigger test error, check Sentry)
- [ ] Automated backups (check GitHub Actions)
- [ ] CI/CD pipeline (make a commit, watch deployment)

## Troubleshooting

### "Cannot connect to backend"
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend is running (check Render logs)
- Ensure `CORS_ORIGINS` includes your frontend URL

### "Database connection failed"
- Check MongoDB IP whitelist includes 0.0.0.0/0
- Verify `MONGO_URI` connection string
- Ensure password is URL-encoded

### "Render service keeps sleeping"
- Free tier spins down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- Consider upgrading to paid plan ($7/month) to keep always-on

### "Build failed"
- Check GitHub Actions logs for errors
- Verify all required environment variables are set
- Try building locally: `npm run build`

## Next Steps

1. **Custom Domain:** Add custom domain in Vercel settings
2. **SSL Certificate:** Automatic with Vercel (free)
3. **Performance:** Enable CDN caching (automatic with Vercel)
4. **Monitoring:** Set up UptimeRobot for health checks
5. **Scaling:** Monitor usage and upgrade when needed

## Cost Estimate

**Current Setup (Free Tier):**
- MongoDB Atlas: $0/month (512MB)
- Vercel: $0/month (100GB bandwidth)
- Render: $0/month (750 hours)
- GitHub Actions: $0/month (2000 minutes)
- Sentry: $0/month (5000 events)
- Google Analytics: $0/month
- Microsoft Clarity: $0/month

**Total: $0/month** 🎉

**When to Upgrade:**
- MongoDB: When you exceed 512MB storage (~10,000 bookings)
- Render: For always-on service ($7/month)
- Vercel: When you exceed 100GB bandwidth ($20/month)

## Support

- **Documentation:** See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed info
- **Environment Variables:** See ENVIRONMENT_VARIABLES.md for complete reference
- **Runbook:** See RUNBOOK.md for operational procedures
- **Issues:** Open GitHub issue for bugs or questions

---

**Congratulations!** 🎉 Your app is now live in production with automated deployment, monitoring, and backups!

**Your URLs:**
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.onrender.com
- Database: MongoDB Atlas Dashboard
- Monitoring: Sentry Dashboard (if enabled)
- Analytics: Google Analytics Dashboard (if enabled)

**Deployment Time:** ~30 minutes
**Monthly Cost:** $0
**Uptime:** 99.9% (with health checks and monitoring)
