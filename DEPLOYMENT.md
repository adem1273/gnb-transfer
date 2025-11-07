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
