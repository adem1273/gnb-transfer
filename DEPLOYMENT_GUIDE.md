# GNB Transfer - Advanced Features Deployment Guide

## Overview

This guide covers the deployment and configuration of the advanced features added to the GNB Transfer platform, including AI-powered management, automated pricing, marketing tools, and operational enhancements.

## Architecture

### Backend Services
- **Recommendation Service**: Smart tour recommendations based on booking patterns
- **Dynamic Pricing Service**: Automated price adjustments using cron schedules
- **Predictive Analytics Service**: Booking forecasts using linear regression
- **Weekly Report Service**: Automated email reports to administrators
- **FAQ Bot Service**: Keyword-based customer support automation
- **Export Service**: CSV and PDF report generation
- **Sitemap Service**: Automated SEO sitemap generation

### Schedulers
All schedulers run automatically without manual intervention:

1. **Campaign Scheduler** (Hourly)
   - Checks and applies active campaigns
   - Updates tour prices based on campaign rules

2. **Dynamic Pricing** (Weekly - Monday 2:00 AM)
   - Analyzes booking trends
   - Adjusts prices ±10% based on demand

3. **Weekly Reports** (Weekly - Monday 9:00 AM)
   - Generates booking summary
   - Sends email to all admins

4. **Sitemap Generation** (Weekly - Monday 3:00 AM)
   - Updates sitemap.xml
   - Includes all tours and static pages

## Environment Configuration

### Backend (.env)
```bash
# Database
MONGO_URI=mongodb://...

# Authentication
JWT_SECRET=your_jwt_secret_here

# Email Service (Optional - for weekly reports)
EMAIL_PROVIDER=mailtrap  # or 'gmail'
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASSWORD=your_password

# Site Configuration
SITE_URL=https://yourdomain.com
NODE_ENV=production

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend (.env)
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

## API Endpoints

### Finance & Reporting
```
GET  /api/finance/overview              # Financial overview
GET  /api/finance/forecast              # Booking/revenue forecasts
GET  /api/finance/export/bookings       # Export bookings CSV
GET  /api/finance/export/revenue        # Export revenue CSV
GET  /api/finance/export/revenue-pdf    # Generate revenue PDF
GET  /api/finance/export/bookings-pdf   # Generate bookings PDF
```

### Coupons
```
GET    /api/coupons                     # List all coupons
POST   /api/coupons                     # Create coupon
GET    /api/coupons/:id                 # Get coupon details
PATCH  /api/coupons/:id                 # Update coupon
DELETE /api/coupons/:id                 # Delete coupon
POST   /api/coupons/validate            # Validate coupon code
```

### Referrals
```
GET   /api/referrals                    # List all referrals (admin)
GET   /api/referrals/my                 # Get user's referral data
POST  /api/referrals/register           # Register new referral
POST  /api/referrals/complete-booking   # Mark referral successful
POST  /api/referrals/claim-reward       # Claim referral reward
GET   /api/referrals/stats              # Get program statistics
```

### FAQ Bot
```
POST  /api/faq/ask                      # Ask a question
GET   /api/faq/suggestions              # Get FAQ suggestions
GET   /api/faq/categories               # Get FAQ categories
```

### Recommendations
```
GET  /api/recommendations               # Get smart tour recommendations
GET  /api/recommendations/trending      # Get trending destinations
GET  /api/recommendations/personalized  # Get personalized recommendations
```

### Drivers & Vehicles
```
GET    /api/drivers                     # List drivers
POST   /api/drivers                     # Create driver
GET    /api/drivers/:id                 # Get driver details
PATCH  /api/drivers/:id                 # Update driver
DELETE /api/drivers/:id                 # Delete driver
POST   /api/drivers/:id/assign-vehicle  # Assign vehicle

GET    /api/vehicles                    # List vehicles
POST   /api/vehicles                    # Create vehicle
GET    /api/vehicles/:id                # Get vehicle details
PATCH  /api/vehicles/:id                # Update vehicle
DELETE /api/vehicles/:id                # Delete vehicle
GET    /api/vehicles/stats/overview     # Vehicle statistics
```

### Support
```
GET    /api/support                     # List support tickets (admin)
POST   /api/support                     # Create support ticket
GET    /api/support/:id                 # Get ticket details
PATCH  /api/support/:id                 # Update ticket
DELETE /api/support/:id                 # Delete ticket
GET    /api/support/my/tickets          # Get user's tickets
GET    /api/support/stats/overview      # Support statistics
```

## Frontend Routes

### Public Routes
- `/` - Home page
- `/tours` - Tour listings
- `/booking` - Booking page
- `/faq` - FAQ Bot interface
- `/contact` - Contact page

### Admin Routes (Protected)
- `/admin/dashboard` - Admin dashboard
- `/admin/finance` - Finance panel with charts and exports
- `/admin/coupons` - Coupon management
- `/admin/referrals` - Referral program management
- `/admin/drivers` - Driver management (API ready)
- `/admin/vehicles` - Vehicle management (API ready)
- `/admin/insights` - AI insights
- `/admin/campaigns` - Campaign rules
- `/admin/bookings` - Booking management
- `/admin/users` - User management
- `/admin/logs` - Activity logs

## Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Deploy Frontend**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

2. **Configure Environment Variables**
   - Add `VITE_API_URL` in Vercel dashboard
   - Point to your backend API URL

### Option 2: Render (Recommended for Backend)

1. **Create New Web Service**
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   - Add all required variables from `.env`
   - Enable Auto-Deploy from Git

3. **Configure Database**
   - Use MongoDB Atlas (free tier)
   - Whitelist Render's IP addresses

### Option 3: Railway (Full Stack)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Deploy
railway up
```

### Option 4: Docker

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
CMD ["npm", "start"]

# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb

  frontend:
    build: .
    ports:
      - "80:80"

  mongodb:
    image: mongo:latest
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## Monitoring & Maintenance

### Health Checks
- Backend: `GET /api/health`
- Ready Check: `GET /api/ready`

### Logs
- Backend logs are stored in MongoDB (`SystemLog` collection)
- Set TTL to 90 days (automatically configured)

### Scheduled Tasks
All scheduled tasks run automatically. To manually trigger:

```bash
# Via API (admin only)
POST /api/admin/campaigns/apply    # Apply campaigns manually
```

## Security

### Authentication
All admin routes are protected with JWT authentication. Roles: `admin`, `manager`, `support`, `driver`, `user`.

### Input Validation
- All user inputs are validated and sanitized
- Enum values are whitelisted
- ObjectId formats are validated
- NoSQL injection prevention implemented

### Rate Limiting
- Global rate limit: 100 requests per 15 minutes
- Per-IP tracking
- Configurable limits

## Performance Optimization

### Frontend
- Lazy loading for all routes
- Code splitting by route
- Image optimization recommended
- CDN integration supported

### Backend
- MongoDB indexes on all query fields
- Caching with node-cache
- Compression middleware
- Connection pooling

## Troubleshooting

### Scheduler Not Running
- Check server logs for cron initialization
- Verify MongoDB connection is active
- Ensure server stays running (use PM2 or similar)

### Email Reports Not Sending
- Verify SMTP credentials in environment variables
- Check that admin users exist with valid emails
- Test with Mailtrap.io first

### PDF Export Failing
- Ensure pdfkit is installed
- Check write permissions if saving to disk
- Verify sufficient memory for large reports

### Frontend Not Connecting to API
- Verify VITE_API_URL is set correctly
- Check CORS configuration in backend
- Ensure backend is accessible from frontend domain

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=/backup

# Restore
mongorestore --uri="mongodb://..." /backup
```

### Configuration Backup
- Store `.env` files securely (use a password manager)
- Keep encrypted backups of JWT secrets
- Document any custom configuration changes

## Support

For issues or questions:
1. Check the logs in `/api/admin/logs`
2. Review system health at `/api/health`
3. Check MongoDB for error logs in `SystemLog` collection
4. Review this documentation

## License

This deployment guide is part of the GNB Transfer project.
