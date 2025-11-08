# Deployment Guide for Admin Panel Features

This guide provides step-by-step instructions for deploying the new admin panel features on free-tier hosting services.

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier)
- Gmail account OR Mailtrap account (for email notifications)

## 1. Database Setup (MongoDB Atlas)

### Step 1: Create Free Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Build a Database"
4. Select "FREE" tier (M0 Sandbox)
5. Choose your preferred cloud provider and region
6. Click "Create Cluster"

### Step 2: Configure Network Access
1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 3: Create Database User
1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Set "Built-in Role" to "Atlas admin"
6. Click "Add User"

### Step 4: Get Connection String
1. Click "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<database>` with `gnb-transfer`

Example: `mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/gnb-transfer?retryWrites=true&w=majority`

## 2. Backend Deployment (Render)

### Step 1: Create Web Service
1. Go to [Render](https://render.com)
2. Sign up or log in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select the `gnb-transfer` repository

### Step 2: Configure Service
- **Name:** `gnb-transfer-backend`
- **Region:** Choose closest to you
- **Branch:** `main` or your working branch
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free

### Step 3: Add Environment Variables
Click "Environment" and add these variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-random-string-32-chars>
CORS_ORIGINS=https://your-frontend-url.vercel.app
STRIPE_SECRET_KEY=<your-stripe-secret-key>
OPENAI_API_KEY=<your-openai-api-key>
```

#### Optional Email Configuration (Gmail):
```env
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<your-gmail-app-password>
```

**To create Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to "App Passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy the service URL: `https://gnb-transfer-backend.onrender.com`

**Note:** Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

## 3. Frontend Deployment (Vercel)

### Step 1: Create Project
1. Go to [Vercel](https://vercel.com)
2. Sign up or log in with GitHub
3. Click "Add New" → "Project"
4. Import your `gnb-transfer` repository

### Step 2: Configure Project
- **Framework Preset:** Vite
- **Root Directory:** `./` (project root)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Add Environment Variables
Click "Environment Variables" and add:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
VITE_GA_MEASUREMENT_ID=<optional>
VITE_CLARITY_PROJECT_ID=<optional>
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Copy the production URL: `https://your-project.vercel.app`

### Step 5: Update Backend CORS
Go back to Render and update the `CORS_ORIGINS` environment variable:
```env
CORS_ORIGINS=https://your-project.vercel.app
```

Then click "Manual Deploy" → "Deploy latest commit"

## 4. Email Setup (Optional but Recommended)

### Option A: Gmail (Free, Production-Ready)

1. **Enable 2FA:**
   - Go to Google Account → Security
   - Enable 2-Factor Authentication

2. **Create App Password:**
   - Go to Security → App Passwords
   - Select "Mail" and generate
   - Copy 16-character password

3. **Update Backend Environment:**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

### Option B: Mailtrap (Free, Testing Only)

1. **Sign up:**
   - Go to [Mailtrap](https://mailtrap.io)
   - Create free account

2. **Get Credentials:**
   - Go to "Email Testing" → "Inboxes"
   - Click your inbox
   - Copy SMTP credentials

3. **Update Backend Environment:**
   ```env
   EMAIL_PROVIDER=mailtrap
   MAILTRAP_HOST=smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=<your-username>
   MAILTRAP_PASSWORD=<your-password>
   ```

## 5. Verify Deployment

### Backend Health Check
Visit: `https://your-backend.onrender.com/api/health`

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": { "connected": true }
  }
}
```

### Frontend Access
1. Visit: `https://your-project.vercel.app`
2. Register a new admin user
3. Login with admin credentials
4. Navigate to `/admin/dashboard`

### Test Admin Features

#### 1. Module Management
- Go to `/admin/modules`
- Toggle a module off (e.g., Tours)
- Try accessing tours → should see disabled message
- Re-enable module

#### 2. Campaign Rules
- Go to `/admin/campaigns`
- Create new campaign:
  - Name: "Istanbul Summer Sale"
  - Condition: City
  - Target: Istanbul
  - Discount: 20%
  - Dates: Today to next week
- Click "Apply Campaigns Now"
- Check tours with Istanbul location → prices reduced

#### 3. AI Insights
- Go to `/admin/insights`
- View metrics dashboard
- Check charts and suggestions
- Test date filter

#### 4. Calendar View
- Go to `/admin/calendar`
- View bookings on calendar
- Click date with bookings
- Verify modal shows details

#### 5. Activity Logs
- Go to `/admin/logs`
- See logged actions
- Test filters
- Export CSV

#### 6. Notification Settings
- Go to `/admin/notifications`
- Configure email settings
- Toggle notification types
- Create test booking to trigger email

## 6. Post-Deployment Setup

### Create Initial Admin User
If you need to create an admin user manually:

1. **Via MongoDB Compass:**
   - Connect to your MongoDB Atlas cluster
   - Open `users` collection
   - Insert document:
   ```json
   {
     "name": "Admin User",
     "email": "admin@gnbtransfer.com",
     "password": "$2b$10$... (use bcrypt to hash)",
     "role": "admin",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **Via API (recommended):**
   - Use the register endpoint
   - Then manually update role in database

### Initialize Admin Settings
The system will auto-create default settings on first access. Or manually create:

```json
{
  "activeModules": {
    "tours": true,
    "users": true,
    "bookings": true,
    "payments": true
  },
  "notificationSettings": {
    "bookingConfirmation": true,
    "paymentReceived": true,
    "campaignStarted": true,
    "systemAlerts": true
  },
  "emailConfig": {
    "fromEmail": "noreply@gnbtransfer.com",
    "fromName": "GNB Transfer"
  }
}
```

## 7. Monitoring and Maintenance

### Render Free Tier Limitations
- **Sleep after 15 min inactivity:** First request takes ~30 seconds
- **750 hours/month:** Enough for small projects
- **Solution:** Use a cron job to ping every 14 minutes (UptimeRobot free tier)

### MongoDB Atlas Free Tier Limitations
- **512 MB storage:** Sufficient for ~100k documents
- **Monitor usage:** Database Access → Metrics
- **Cleanup old logs:** Run monthly cleanup script

### Campaign Scheduler
- Runs every hour automatically
- No external cron service needed
- Check logs for execution: `Campaign scheduler initialized`

### Vercel Limitations
- **100 GB bandwidth/month:** Plenty for small sites
- **Serverless functions:** Frontend only, no backend limits

## 8. Troubleshooting

### Backend Won't Start
1. Check environment variables are set
2. Verify MongoDB connection string
3. Check Render logs for errors
4. Ensure JWT_SECRET is set

### Frontend Can't Connect to Backend
1. Verify VITE_API_URL is correct
2. Check CORS_ORIGINS includes frontend URL
3. Open browser console for errors
4. Test backend health endpoint directly

### Emails Not Sending
1. Verify EMAIL_PROVIDER is set
2. Check SMTP credentials are correct
3. For Gmail, ensure App Password is used (not regular password)
4. Check backend logs for email errors
5. Test with Mailtrap first

### Campaign Not Applying
1. Check campaign is active
2. Verify start/end dates are correct
3. Ensure tours match campaign conditions
4. Manually trigger: Click "Apply Campaigns Now"
5. Check backend logs for scheduler execution

### Module Toggle Not Working
1. Clear browser cache
2. Check backend health endpoint
3. Verify moduleGuard middleware is active
4. Check AdminSettings exists in database

## 9. Cost Breakdown (All Free!)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Render | Free | $0 | 750 hrs/month, sleeps after 15 min |
| Vercel | Hobby | $0 | 100 GB bandwidth, unlimited projects |
| MongoDB Atlas | M0 | $0 | 512 MB storage, 100 connections |
| Gmail SMTP | Free | $0 | 500 emails/day |
| Mailtrap | Free | $0 | 500 emails/month (testing only) |
| **Total** | | **$0/month** | |

## 10. Optional Upgrades (Still Free)

### UptimeRobot (Keep Backend Awake)
1. Sign up at [UptimeRobot](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/api/health`
   - Interval: 5 minutes
3. Prevents Render from sleeping

### Cloudflare (CDN & SSL)
1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add your domain
3. Point DNS to Vercel
4. Enable proxy (orange cloud)
5. Free CDN and DDoS protection

## 11. Scaling Up (When Needed)

When you outgrow free tier:

- **Render:** $7/month for always-on, faster performance
- **MongoDB Atlas:** $9/month for 2 GB storage
- **Email:** SendGrid $15/month for 40k emails
- **Vercel:** Free tier is usually sufficient

## Summary

✅ **Zero-Cost Deployment Complete!**

You now have:
- ✅ Full-stack application deployed
- ✅ 7 advanced admin features running
- ✅ MongoDB database with 512 MB storage
- ✅ Email notifications configured
- ✅ Automated campaign scheduler
- ✅ All on 100% free infrastructure

**Next Steps:**
1. Test all features thoroughly
2. Configure email notifications
3. Create initial admin user
4. Add your first campaign
5. Monitor usage and logs

**Need Help?**
- Check ADMIN_FEATURES.md for feature documentation
- Review backend logs in Render dashboard
- Check browser console for frontend errors
- Test API endpoints with Postman/curl
