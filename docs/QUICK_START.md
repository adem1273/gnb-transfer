# 🚀 Quick Start - Production Deployment

## Ready to Deploy in 5 Minutes!

This guide will get your GNB Transfer application live on Render.com quickly.

---

## Prerequisites

- [ ] Render.com account (free tier available)
- [ ] MongoDB Atlas database URL
- [ ] Stripe API keys (optional, for payments)

---

## Step 1: Configure Environment Variables (2 minutes)

Go to your Render dashboard → Environment tab and add these:

### Required:
```
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://gnb-transfer.onrender.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=[click "Generate" button]
```

### Optional (for payments):
```
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Tip**: Copy from `.env.render` file for complete list.

---

## Step 2: Verify Build Configuration (1 minute)

In Render dashboard, verify these settings:

- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

These should already be set from `render.yaml`.

---

## Step 3: Deploy (2 minutes)

Click **"Manual Deploy"** → **"Deploy latest commit"**

Wait 2-3 minutes for build and deployment to complete.

---

## Step 4: Verify (1 minute)

Once deployed, check:

1. **Health Check**: `https://gnb-transfer.onrender.com/api/health`
   - Should return: `{"success": true, ...}`

2. **Frontend**: `https://gnb-transfer.onrender.com/`
   - Should load the React application

3. **Check Logs** in Render dashboard for:
   ```
   ✓ Server running on http://0.0.0.0:10000
   ✓ Health check ready at /health and /api/health
   MongoDB connected successfully
   ```

---

## 🎉 Done!

Your application is now live on Render!

---

## Need More Details?

- **Full Guide**: See `DEPLOYMENT.md`
- **Environment Variables**: See `.env.render`
- **Troubleshooting**: See `DEPLOYMENT.md` → Troubleshooting section

---

## Common Issues

### Issue: "MongoDB connection failed"
**Fix**: 
1. Check `MONGO_URI` is correct
2. Add `0.0.0.0/0` to MongoDB Atlas IP whitelist

### Issue: "CORS policy blocked"
**Fix**: 
1. Verify `CORS_ORIGINS=https://gnb-transfer.onrender.com`
2. Make sure there's no trailing slash

### Issue: "JWT_SECRET not set"
**Fix**: 
1. Add `JWT_SECRET` in Render environment variables
2. Use "Generate" button for secure random string

---

## Support

- Documentation: `DEPLOYMENT.md`
- Issues: https://github.com/adem1273/gnb-transfer/issues

---

**Total Time**: ~5 minutes
**Status**: Production Ready ✅
