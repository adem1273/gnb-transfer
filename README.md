# GNB Transfer

**GNB Transfer** is a comprehensive, production-ready MERN stack web application for tourism and transfer services. The platform includes a customer-facing website, advanced admin panel, payment integration, AI-powered features, multi-language support, and a **React Native mobile app**.

Built with modern web technologies and best practices, GNB Transfer provides a complete solution for managing bookings, tours, fleet operations, customer loyalty, and business analytics.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green.svg)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-9-red.svg)](https://mongoosejs.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Queue-red.svg)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Background%20Jobs-orange.svg)](https://bullmq.io/)
[![Expo](https://img.shields.io/badge/Expo-52-000020.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB.svg)](https://reactnative.dev/)

---

## ✨ Key Features

### Customer-Facing Features
- **Multi-Language Support**: 9 languages (TR, EN, AR, RU, DE, FR, ES, ZH, FA) with RTL support
- **Smart Booking System**: Multi-step booking with passenger details, flight info, extras
- **Stripe Payments**: Secure payment processing with webhooks
- **AI-Powered Recommendations**: Personalized tour suggestions using OpenAI
- **SEO-Optimized Blog**: 40+ articles in 9 languages with structured data
- **Live Chat**: Real-time customer support
- **Reviews & Ratings**: Customer feedback with admin responses
- **Loyalty Program**: Points-based rewards with bronze/silver/gold/platinum tiers
- **Social Login**: Google and Apple Sign-In integration

### Admin Panel Features
- **Dashboard Analytics**: Revenue, bookings, KPIs, performance metrics
- **Dynamic Pricing**: Route-based pricing, seasonal multipliers, currency switching
- **Fleet Management**: Drivers, vehicles, assignments, live tracking
- **Booking Management**: Status tracking, bulk WhatsApp/Email, invoice generation (PDF)
- **CMS Suite**: Blog posts, pages, menus, homepage builder, media manager
- **Corporate Clients**: Company profiles, volume discounts, monthly invoicing
- **Ad Tracking Dashboard**: Google/Meta pixel integration, conversion tracking
- **Global Settings**: Site-wide configuration, feature toggles, SEO settings
- **User Management**: Roles (Super Admin, Admin, Manager, Driver, Customer)
- **Delay Compensation**: Automatic compensation for flight delays

### Technical Features
- **Production Security**: JWT auth with refresh tokens, rate limiting, CORS, Helmet, DDoS protection
- **Background Job Queues**: BullMQ with Redis for async processing (exports, emails, AI tasks)
- **Redis Cache Layer**: Tag-based cache invalidation with automatic fallback
- **Distributed Rate Limiting**: Token bucket algorithm with abuse detection and gradual penalties
- **Real-Time Monitoring**: Socket.IO dashboard for performance metrics, system resources, queue stats
- **Database Optimization**: 61+ strategic indexes achieving 90%+ query performance improvement
- **Automated Backups**: MongoDB backups with S3/GCS storage, point-in-time recovery, <15min RTO
- **Error Tracking**: Sentry integration for both frontend and backend
- **Monitoring**: Health checks, Winston logging, Prometheus metrics, Grafana dashboards
- **Cloud Ready**: Optimized for Google Cloud Run, App Engine, Docker
- **Database Seeding**: Sample data scripts for quick development setup
- **Automated Testing**: Unit tests (Vitest/Jest), E2E tests (Playwright), 90+ test cases
- **CI/CD**: GitHub Actions workflows for deployment, testing, security scanning, bundle analysis
- **Staging Environment**: Complete staging setup with K6 load testing and monitoring
- **Performance Budget**: Bundle size monitoring with automated enforcement

### Performance Metrics

**Production-Grade Performance:**
- ⚡ **Query Response**: Sub-50ms average (90%+ improvement with strategic indexing)
- ⚡ **Cache Hit Rate**: 60-95% across endpoints (5-10ms cached responses)
- ⚡ **Index Coverage**: 85%+ queries use indexes
- ⚡ **API Response**: p95 <200ms, p99 <500ms
- ⚡ **Error Rate**: <1% target
- ⚡ **Uptime**: 99.9% availability with health monitoring

**Infrastructure:**
- 📊 Real-time monitoring dashboard with Socket.IO
- 🔄 Background job processing (4 queues, automatic retry)
- 💾 Redis-backed caching with tag-based invalidation
- 🛡️ Multi-tier rate limiting (DDoS protection)
- 💿 Automated backups (RTO <15min, RPO <1h)
- 🧪 Comprehensive test coverage (90+ test cases)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI framework with latest features |
| **Vite** | 6.x | Fast build tool and dev server |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **React Router** | v7 | Client-side routing |
| **TanStack Query** | Latest | Server state management |
| **i18next** | Latest | Internationalization (9 languages) |
| **Stripe React** | Latest | Payment components |
| **Leaflet** | Latest | Maps and live tracking |
| **Framer Motion** | Latest | Animations |
| **Socket.IO Client** | 4.8.1 | Real-time WebSocket connections |
| **Recharts** | Latest | Interactive data visualizations |
| **Sentry** | Latest | Error tracking |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime (ES Modules) |
| **Express.js** | Latest | Web framework |
| **MongoDB** | 7.0.0 | NoSQL database driver |
| **Mongoose** | 9.1.1 | ODM with validation and indexing |
| **JWT** | Latest | Authentication with refresh tokens |
| **Stripe** | Latest | Payment processing |
| **OpenAI** | Latest | AI recommendations |
| **Nodemailer** | Latest | Email sending |
| **Winston** | Latest | Logging with rotation |
| **Cloudinary** | Latest | Image upload and storage |
| **PDFKit** | Latest | Invoice generation |
| **BullMQ** | Latest | Background job queues |
| **Redis (ioredis)** | Latest | Queue, cache, and rate limiting |
| **Prometheus** | Latest | Metrics and monitoring |
| **Socket.IO** | Latest | Real-time server communication |

### DevOps & Deployment
- **Docker**: Multi-stage builds for production
- **Google Cloud Run**: Serverless container deployment
- **Google App Engine**: Managed platform (alternative)
- **GitHub Actions**: CI/CD pipelines
- **Playwright**: End-to-end testing
- **Vitest/Jest**: Unit testing

---

## 🌍 Multi-Language Support

GNB Transfer supports 9 languages with complete translations:

| Flag | Language | Code | Direction | Status |
|------|----------|------|-----------|--------|
| 🇹🇷 | Türkçe | tr | LTR | ✅ 447 keys |
| 🇬🇧 | English | en | LTR | ✅ 447 keys |
| 🇸🇦 | العربية | ar | RTL | ✅ 447 keys |
| 🇷🇺 | Русский | ru | LTR | ✅ 447 keys |
| 🇩🇪 | Deutsch | de | LTR | ✅ 447 keys |
| 🇫🇷 | Français | fr | LTR | ✅ 447 keys |
| 🇪🇸 | Español | es | LTR | ✅ 447 keys |
| 🇨🇳 | 简体中文 | zh | LTR | ✅ 447 keys |
| 🇮🇷 | فارسی | fa | RTL | ✅ 447 keys |

### Language Features
- **Auto-detection**: Browser language detection
- **Persistent selection**: LocalStorage-based preference
- **RTL Support**: Full right-to-left layout for Arabic and Persian
- **Dynamic switching**: Real-time language change without reload
- **Fallback**: Turkish as default fallback language

### Translation Coverage
- ✅ Header & Navigation
- ✅ Authentication (login, register, social auth)
- ✅ Booking System (multi-step form, validation)
- ✅ Tours & Packages
- ✅ Admin Panel
- ✅ Blog System
- ✅ Reviews & Testimonials
- ✅ Live Chat & AI Assistant
- ✅ Error Messages & Notifications
- ✅ Legal Pages (Privacy, Terms, KVKK)

---

## 🔄 Background Job Queue System

GNB Transfer uses **BullMQ** with **Redis** for robust background job processing:

### Queues
- **Export Queue**: CSV/PDF generation for large datasets
- **Email Queue**: Asynchronous email sending with retry logic
- **AI Queue**: OpenAI API calls and ML processing
- **Scheduled Queue**: Recurring tasks (campaigns, sitemap updates)

### Features
- ✅ **Automatic Retry**: Exponential backoff for failed jobs
- ✅ **Job Progress Tracking**: Real-time progress updates
- ✅ **Admin Dashboard**: Monitor queues, view jobs, retry/cancel operations
- ✅ **Prometheus Metrics**: Queue depth, processing rate, failure rate
- ✅ **Graceful Degradation**: Automatic fallback to synchronous execution
- ✅ **Rate Limiting**: Prevent queue flooding and API throttling
- ✅ **Priority Queues**: Critical jobs processed first

### Admin Interface
Access at `/admin/jobs` to:
- View real-time queue statistics
- Monitor job status (waiting, active, completed, failed)
- Retry failed jobs
- Pause/resume queues
- Clean old completed jobs
- View detailed job logs and errors

See [docs/JOB_QUEUE.md](docs/JOB_QUEUE.md) for complete documentation.

---

## 📊 Performance & Monitoring

### Real-Time Performance Dashboard

Access comprehensive metrics at `/admin/metrics`:

- **Performance Metrics**: Response times, request rates, error rates, active connections
- **Cache Analytics**: Hit/miss ratios, key counts, Redis statistics
- **Database Performance**: Query counts, slow query detection (>100ms), average query times
- **System Resources**: CPU usage, memory consumption with visual indicators
- **Queue Statistics**: Waiting/active/failed jobs across all BullMQ queues

**Features:**
- WebSocket-based live updates (5-second interval)
- Automatic HTTP polling fallback
- Time range filtering (5min, 30min, 1h)
- Interactive charts (Recharts)
- Auto-refresh toggle

### Redis Cache System

Intelligent caching with tag-based invalidation:

- **Cached Endpoints**: Tours (5min), Blog posts (1h), Settings (1h), Bookings (5min)
- **Cache Hit Rates**: 60-95% depending on endpoint mutation frequency
- **Response Time**: 5-10ms cached vs 150-200ms database queries
- **Automatic Fallback**: In-memory cache when Redis unavailable
- **Admin Controls**: Cache stats and manual flush at `/api/admin/cache`

### Database Optimization

Strategic indexing for optimal performance:

- **61+ Indexes**: Single, compound, text, sparse indexes across all models
- **Query Performance**: 90-95% improvement on common queries
- **Index Usage**: 85%+ of queries use indexes (covered queries)
- **Slow Query Detection**: Automatic identification of queries >100ms

**Example improvements:**
- Booking status queries: 156ms → 12ms (92% faster)
- Active tours by category: 78ms → 8ms (90% faster)
- Published posts: 124ms → 15ms (88% faster)

### Rate Limiting & DDoS Protection

Multi-tier protection with Redis-backed token buckets:

| User Type | Limit | Endpoints |
|-----------|-------|-----------|
| Anonymous | 100 req/15min | All routes |
| Authenticated | 500 req/15min | All routes |
| Auth endpoints | 5 req/15min | `/api/auth/*` |
| Bookings | 20 req/15min | `/api/bookings` |
| Exports | 3 req/hour | `/api/export/*` |

**Protection Features:**
- Gradual penalties: Warning → 5min ban → 1hr ban
- Pattern detection: Rapid requests, large payloads, suspicious bots
- Admin dashboard: View violations, manual unblock
- Automatic ban expiration

### Background Job Processing

BullMQ queues for async operations:

- **Export Queue**: CSV/PDF generation (2 concurrent workers)
- **Email Queue**: Notifications with 50/min rate limiting (5 workers)
- **AI Queue**: OpenAI calls with 60s timeout (3 workers)
- **Scheduled Queue**: Recurring jobs via cron (2 workers)

**Features:**
- Automatic retry with exponential backoff
- Job progress tracking (0-100%)
- Admin interface at `/admin/jobs`
- Prometheus metrics integration
- Graceful degradation to sync execution

### Automated Backups

Production-grade disaster recovery:

- **Backup Types**: Full (daily 3AM UTC), Incremental (hourly)
- **Storage**: Multi-cloud (S3, GCS) + GitHub Artifacts
- **Retention**: Hourly (7d), Daily (30d), Pre-deployment (90d)
- **Encryption**: AES-256-CBC for all backups
- **Recovery**: Point-in-time restore, RTO <15min, RPO <1h
- **Automation**: GitHub Actions workflows with validation

---

## 📁 Repository Structure

```
gnb-transfer/
├── backend/                  # Backend Express.js API
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middlewares/         # Auth, validation, rate limiting
│   ├── models/              # Mongoose schemas (40+ models)
│   ├── routes/              # API route definitions (30+ routes)
│   ├── scripts/             # Utility scripts (seed, migration, test)
│   ├── services/            # Business logic services
│   ├── tests/               # Unit and integration tests
│   ├── utils/               # Helper functions
│   ├── validators/          # Input validation schemas
│   ├── .env.example         # Backend environment variables template
│   ├── Dockerfile           # Backend Docker image
│   ├── package.json         # Backend dependencies
│   └── server.mjs           # Main backend entry point (ES Module)
│
├── src/                     # Frontend React application
│   ├── components/          # Reusable React components (100+)
│   ├── context/             # React Context providers (Auth, Theme)
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Layout components (Public, Admin)
│   ├── locales/             # i18n translation files (9 languages)
│   ├── pages/               # Page components (60+ pages)
│   │   ├── Booking.jsx      # Multi-step booking form
│   │   ├── Dashboard.jsx    # Admin dashboard
│   │   ├── BlogManagement.jsx
│   │   ├── CampaignManagement.jsx
│   │   └── ...
│   ├── styles/              # Global CSS and Tailwind config
│   ├── utils/               # Frontend utility functions
│   ├── App.jsx              # Main App component
│   └── index.jsx            # Frontend entry point
│
├── admin/                   # Standalone admin panel (legacy/alternative)
│   └── src/                 # Admin panel components
│
├── mobile/                  # React Native mobile app (Expo)
│   ├── app/                 # Expo Router pages
│   ├── assets/              # App icons and splash screens
│   ├── components/          # Reusable mobile components
│   ├── contexts/            # React Context providers
│   ├── scripts/             # Utility scripts
│   ├── app.json             # Expo configuration
│   ├── eas.json             # EAS Build configuration
│   └── package.json         # Mobile dependencies
│
├── packages/                # Shared packages (npm workspaces)
│   └── shared/              # Shared utilities, types, validators
│
├── public/                  # Static assets
│   ├── images/              # Images, logos, icons
│   └── locales/             # Public translation files
│
├── e2e/                     # End-to-end tests
│   └── tests/               # Playwright test scenarios
│
├── docs/                    # Documentation
│   ├── DEPLOY_GOOGLE_CLOUD.md    # Cloud deployment guide
│   ├── QUICKSTART_GOOGLE_CLOUD.md
│   ├── PRODUCTION_READY.md
│   ├── SECURITY.md
│   └── RUNBOOK.md
│
├── scripts/                 # Root-level utility scripts
│   └── validation/          # Validation scripts
│
├── .github/                 # GitHub configuration
│   ├── workflows/           # CI/CD workflows
│   │   ├── ci.yml           # Continuous Integration
│   │   ├── deploy-backend.yml
│   │   ├── production-deploy.yml
│   │   ├── security.yml
│   │   └── ...
│   └── copilot-instructions.md
│
├── .env.example             # Frontend environment variables template
├── backend/.env.example     # Backend environment variables template
├── Dockerfile               # Multi-stage production Docker build
├── docker-compose.yml       # Local development with Docker
├── cloudbuild.yaml          # Google Cloud Build configuration
├── app.yaml                 # Google App Engine configuration
├── deploy-gcloud.sh         # Deployment script for Cloud Run
├── package.json             # Frontend dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── playwright.config.js     # Playwright E2E test configuration
└── README.md                # This file
```

---

## 📱 Mobile App

GNB Transfer includes a **React Native mobile app** built with Expo, providing customers with a seamless booking experience on iOS and Android.

### Key Features

- **🌐 Multi-Language**: Same 9 languages as web app (TR, EN, AR, RU, DE, FR, ES, ZH, FA)
- **📱 Easy Booking**: Streamlined multi-step booking flow
- **🔄 Offline Support**: View cached data without internet connection
- **🔒 Secure Auth**: JWT authentication synced with backend
- **🎨 Native UI**: NativeWind (Tailwind CSS) for consistent styling

### Quick Start

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Then:
# - Scan QR code with Expo Go app on your phone
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
```

### Build Commands

```bash
# Development build (with debugging)
npm run build:dev

# Preview build (internal testing)
npm run build:preview

# Production build (App Store / Google Play)
npm run build:prod
```

### Screenshots

*Mobile app screenshots showcasing the booking flow:*

| Home | Tours | Booking | Profile |
|------|-------|---------|---------|
| 📱 | 🗺️ | ✈️ | 👤 |
| *Browse destinations* | *View available tours* | *Book transfers* | *Manage account* |

### Documentation

See [mobile/README.md](mobile/README.md) for detailed mobile app documentation including:
- Complete setup instructions
- Development workflow
- Build process
- Troubleshooting guide

---

## 🚀 Installation & Local Setup

### Prerequisites

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm**: Version 8 or higher (comes with Node.js)
- **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier) or local MongoDB
- **Git**: For cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/adem1273/gnb-transfer.git
cd gnb-transfer
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env file with your credentials
# Required: MONGO_URI, JWT_SECRET, CORS_ORIGINS
nano .env  # or use your preferred editor (vim, code, etc.)
```

**Minimum required variables in `backend/.env`:**
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer
JWT_SECRET=generate-with-openssl-rand-base64-64
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

```bash
# Start the backend server (development mode with auto-reload)
npm run dev
```

The backend server will start on **http://localhost:5000**

Health check: http://localhost:5000/api/health

### 3. Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to project root
cd gnb-transfer

# Install frontend dependencies
npm install

# Copy frontend environment variables
cp .env.example .env

# Edit frontend .env file
nano .env
```

**Required variable in `.env`:**
```bash
VITE_API_URL=http://localhost:5000/api
```

```bash
# Start the frontend development server
npm run dev
```

The frontend will start on **http://localhost:5173**

### 4. Create Test Admin User

In a **new terminal**:

```bash
# Navigate to backend directory
cd backend

# Option 1: Create a test admin user only
node scripts/create-test-admin.mjs

# Option 2: Seed the database with sample data (recommended)
npm run seed
```

**Default admin credentials after seeding:**
- Email: `admin@gnbtransfer.com`
- Password: `Admin123!`

Other test users:
- Manager: `manager@gnbtransfer.com` / `Manager123!`
- Driver: `driver1@gnbtransfer.com` / `Driver123!`
- Customer: `user@gnbtransfer.com` / `User1234!`

### 5. Seed Blog Posts (Optional)

```bash
# In backend directory
node scripts/seedBlogPosts.mjs
```

This will create 40 SEO-optimized blog posts in all 9 languages.

### 6. Verify Installation

- **Frontend**: http://localhost:5173
- **Backend API Health**: http://localhost:5000/api/health
- **Admin Panel**: http://localhost:5173/admin/dashboard
- **API Docs**: http://localhost:5000/api/docs (Swagger UI)

---

## 🔐 Environment Variables

### Backend Environment Variables (`backend/.env`)

#### Required Variables (Server will fail without these in production)

```bash
# MongoDB Connection String
# Get from: https://cloud.mongodb.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer

# JWT Secret for authentication tokens
# Generate with: openssl rand -base64 64 | tr -d '\n'
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-recommended

# CORS Allowed Origins (comma-separated)
# Development: http://localhost:5173,http://localhost:3000
# Production: https://your-domain.com,https://www.your-domain.com
CORS_ORIGINS=http://localhost:5173
```

#### Optional Variables (Features disabled if not set)

| Variable | Description | Required For |
|----------|-------------|--------------|
| `NODE_ENV` | Environment mode (`development`, `production`) | Production deployment |
| `PORT` | Backend server port | Default: 5000 |
| `STRIPE_SECRET_KEY` | Stripe secret key | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature | Payment webhooks |
| `OPENAI_API_KEY` | OpenAI API key | AI-powered features |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Sign-In |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google Sign-In |
| `APPLE_CLIENT_ID` | Apple Sign-In client ID | Apple Sign-In |
| `SENTRY_DSN` | Sentry error tracking DSN | Error monitoring |
| `EMAIL_PROVIDER` | Email provider (`gmail`, `smtp`, `mailtrap`) | Email sending |
| `EMAIL_USER` | Email account username | Email sending |
| `EMAIL_PASSWORD` | Email account password/app password | Email sending |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Image uploads |
| `AWS_ACCESS_KEY_ID` | AWS access key | S3 backups |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | S3 backups |
| `S3_BACKUP_BUCKET` | S3 bucket name | Automated backups |
| `BACKUP_ENCRYPTION_KEY` | Encryption key for backups | Backup encryption |

See `backend/.env.example` for the complete list with detailed descriptions.

### Frontend Environment Variables (`.env`)

#### Required Variables

```bash
# Backend API URL
# Development: http://localhost:5000/api
# Production: https://api.your-domain.com/api
VITE_API_URL=http://localhost:5000/api
```

#### Optional Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | Payment processing |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Sign-In |
| `VITE_APPLE_CLIENT_ID` | Apple Sign-In client ID | Apple Sign-In |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID (G-XXXXXXXXXX) | Analytics |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity project ID | Heatmaps |
| `VITE_SENTRY_DSN` | Sentry DSN | Frontend error tracking |
| `VITE_APP_VERSION` | Application version | Release tracking |

See `.env.example` for the complete list.

### Generating Secure Secrets

```bash
# Generate JWT_SECRET (64 characters recommended)
openssl rand -base64 64 | tr -d '\n'

# Generate SESSION_SECRET (32 characters)
openssl rand -base64 32

# Generate BACKUP_ENCRYPTION_KEY (hex format)
openssl rand -hex 32
```

---

## 🌱 Database Seeding

Populate the database with sample data for development and testing:

```bash
cd backend

# Seed all data (users, tours, bookings, settings)
npm run seed

# Seed only users (admin, manager, driver, customer)
npm run seed:users

# Seed only tours
npm run seed:tours

# Clear database and re-seed all data (fresh start)
npm run seed:reset

# Seed blog posts (40 posts in 9 languages)
node scripts/seedBlogPosts.mjs
```

**Sample credentials after seeding:**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gnbtransfer.com | Admin123! |
| **Manager** | manager@gnbtransfer.com | Manager123! |
| **Driver** | driver1@gnbtransfer.com | Driver123! |
| **Customer** | user@gnbtransfer.com | User1234! |

---

## 🐳 Docker Setup

### Using Docker Compose (Recommended for Local Development)

Docker Compose will start MongoDB, Backend, Frontend, and Redis (optional):

```bash
# Start all services in detached mode
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Start services with Redis cache (optional)
docker-compose --profile full up -d
```

**Services available:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379 (if using full profile)

### Environment Variables for Docker Compose

Create a `.env` file in the project root:

```bash
# MongoDB
MONGO_PASSWORD=changeme123

# Backend
JWT_SECRET=your-secure-jwt-secret-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...
```

### Build Production Docker Image Manually

```bash
# Build the production image
docker build -t gnb-transfer:latest .

# Run the container
docker run -p 8080:8080 \
  -e MONGO_URI=mongodb+srv://... \
  -e JWT_SECRET=your_jwt_secret \
  -e CORS_ORIGINS=http://localhost:8080 \
  --name gnb-app \
  gnb-transfer:latest

# Test the application
curl http://localhost:8080/api/health

# View logs
docker logs -f gnb-app

# Stop and remove container
docker stop gnb-app
docker rm gnb-app
```

### Docker Image Details

- **Base Image**: node:20-alpine
- **Size**: ~400MB (optimized with multi-stage build)
- **User**: Non-root user (nodejs:1001) for security
- **Health Check**: Built-in health check at `/api/health`
- **Port**: 8080 (Google Cloud default)

---

## ☁️ Deployment

### Deploy to Google Cloud Run (Recommended)

Google Cloud Run provides auto-scaling, pay-per-use serverless containers.

#### Quick Deploy with Script

```bash
# Install and authenticate gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Make deployment script executable
chmod +x deploy-gcloud.sh

# Deploy to production
./deploy-gcloud.sh production
```

#### Manual Deployment Steps

```bash
# 1. Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gnb-transfer

# 2. Deploy to Cloud Run
gcloud run deploy gnb-transfer \
  --image gcr.io/YOUR_PROJECT_ID/gnb-transfer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production"

# 3. Set required environment variables
gcloud run services update gnb-transfer \
  --region us-central1 \
  --set-env-vars "MONGO_URI=mongodb+srv://...,JWT_SECRET=...,CORS_ORIGINS=https://yourdomain.com"

# 4. Get service URL
gcloud run services describe gnb-transfer \
  --region us-central1 \
  --format 'value(status.url)'
```

#### View Logs and Metrics

```bash
# View logs
gcloud run logs read --service=gnb-transfer --region=us-central1 --limit=50

# View service details
gcloud run services describe gnb-transfer --region=us-central1

# View revisions
gcloud run revisions list --service=gnb-transfer --region=us-central1
```

### Deploy to Google App Engine

```bash
# Deploy using app.yaml configuration
gcloud app deploy

# Set environment variables
gcloud app deploy --set-env-vars "MONGO_URI=...,JWT_SECRET=..."

# View logs
gcloud app logs tail -s default

# Open in browser
gcloud app browse
```

### Deploy Using Docker to Other Platforms

The Docker image can be deployed to:

| Platform | Description | Pricing |
|----------|-------------|---------|
| **Google Cloud Run** | Serverless containers, auto-scaling | Free tier: 2M req/month |
| **Google App Engine** | Managed platform as a service | Pay-per-use |
| **AWS ECS/Fargate** | Container orchestration | Pay for resources |
| **Azure Container Instances** | Serverless containers | Per-second billing |
| **Render** | Simple deployment from GitHub | Free tier available |
| **Railway** | Git-based deployment | Free tier: $5/month |
| **Fly.io** | Edge deployment globally | Free tier: 3 VMs |

### Setting Environment Variables in Cloud Platforms

See the [Environment Variables](#-environment-variables) section for platform-specific instructions:
- Vercel (Frontend)
- Render (Backend)
- Railway
- GitHub Actions (CI/CD)

### Deployment Documentation

- 📖 **[Complete Deployment Guide](docs/DEPLOY_GOOGLE_CLOUD.md)** - Detailed Cloud Run/App Engine deployment
- ⚡ **[Quick Start Guide](docs/QUICKSTART_GOOGLE_CLOUD.md)** - Fast deployment steps
- 🐳 **[Docker Guide](DOCKER_README.md)** - Docker deployment and testing
- 📊 **[Production Readiness](docs/PRODUCTION_READY.md)** - Security, monitoring, best practices

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all backend tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test coverage includes:**
- Authentication and authorization
- API endpoints
- Database models
- Security features (rate limiting, input validation)
- NoSQL injection prevention
- Logger security (PII redaction)

### Frontend Testing

```bash
# Run frontend unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Testing (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests (headless)
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with interactive UI mode
npm run test:e2e:ui

# View HTML test report
npm run test:e2e:report
```

### Test Environment Setup

For testing, create `backend/.env.test`:

```bash
MONGO_URI=mongodb://localhost:27017/gnb-transfer-test
JWT_SECRET=test-jwt-secret-for-testing-only
NODE_ENV=test
```

### Verify Test Admin

```bash
cd backend
node scripts/verify-auth.mjs
```

---

## 📝 Blog System

GNB Transfer includes a fully multilingual, SEO-optimized blog system.

### Features

- **40 Ready-Made Posts**: Sales-oriented content in 9 languages (360 total articles)
- **Full Multilingual Support**: Every post available in TR, EN, AR, RU, DE, FR, ES, ZH, FA
- **SEO Optimization**:
  - JSON-LD Article structured data
  - OpenGraph meta tags
  - Twitter Cards
  - Canonical URLs
  - Automatic reading time calculation
- **Rich Admin Panel**: Create, edit, delete posts with WYSIWYG editor
- **Conversion Features**:
  - Strong CTAs to booking page
  - WhatsApp contact integration
  - Pricing tables with discount codes
  - Internal linking strategy
- **Modern UI**:
  - Share buttons (WhatsApp, Twitter, Facebook, LinkedIn)
  - Related posts suggestions
  - Category filtering
  - Pagination
  - View tracking

### Blog Post Categories

| Category | Description |
|----------|-------------|
| `transfer-prices` | VIP transfer pricing guides |
| `destinations` | Tourist destination guides |
| `services` | Service features and options |
| `tips` | Travel tips and advice |
| `news` | Company news and updates |
| `promotions` | Special offers and discounts |
| `seasonal` | Seasonal content (holidays, festivals) |

### Seeding Blog Posts

```bash
cd backend
node scripts/seedBlogPosts.mjs
```

### API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/blogs` | GET | List published posts with pagination | No |
| `/api/blogs/slug/:slug` | GET | Get post by slug | No |
| `/api/blogs/categories` | GET | List all categories | No |
| `/api/blogs/feed/rss` | GET | RSS feed | No |
| `/api/blogs/admin/all` | GET | Admin: all posts | Yes |
| `/api/blogs` | POST | Create post | Admin |
| `/api/blogs/:id` | PUT | Update post | Admin |
| `/api/blogs/:id` | DELETE | Delete post | Admin |

---

## 🎯 Admin Panel Features

Access the admin panel at: **http://localhost:5173/admin/dashboard**

### Core Features

#### 1. **Dashboard Analytics**
- Revenue overview (daily, weekly, monthly)
- Booking statistics and trends
- Key performance indicators (KPIs)
- Recent bookings and activities
- Performance charts with Recharts

#### 2. **Dynamic Pricing Management**
- **Base Pricing**: Route-based pricing (airport ↔ district)
- **Extra Services**: Child seat, baby seat, meet & greet, VIP lounge
- **Seasonal Multipliers**: Summer/winter pricing adjustments
- **Currency Switcher**: Multi-currency support with manual exchange rates
- **Night Surcharge**: Configurable night-time pricing
- **Tax Rate Management**: Regional tax configuration

#### 3. **Fleet Management**
- **Drivers**: Add/edit/delete driver profiles
  - License and document management
  - Performance tracking
  - Availability toggle
- **Vehicles**: Vehicle assignments
  - Maintenance schedules
  - Capacity and features
- **Live Tracking**: Real-time driver location on map

#### 4. **Booking Management**
- **Status Tracking**: Pending → Assigned → On Way → Picked Up → Completed/Cancelled
- **Manual Status Updates**: Admin can change booking status
- **Passenger Details**: View all passenger names and information
- **Bulk Actions**: Select multiple bookings for batch operations

#### 5. **Communication Tools**
- **Bulk WhatsApp Sender**: Send messages to multiple customers
- **Bulk Email Sender**: Template or custom email campaigns
- **WhatsApp Link Generation**: Direct customer contact
- **Email Templates**: Pre-built templates for common scenarios

#### 6. **Invoice & PDF Generation**
- **One-Click PDF Invoice**: Generate professional invoices
- **Company Logo**: Branded invoices
- **Turkish E-Fatura Fields**: Compliant with Turkish tax regulations
- **QR Code Support**: Payment and verification QR codes
- **Passenger Information**: All passenger details included

#### 7. **Revenue Analytics**
- **Income-Expense Tracking**: Monthly/yearly revenue and costs
- **Profit Margin Calculation**: Automatic profit analysis
- **Payment Method Breakdown**: Cash, card, online statistics
- **Export**: CSV/PDF export for accounting

#### 8. **Corporate Client Management**
- **Company Profiles**: Tax info, billing details
- **Volume Discounts**: Percentage-based discounts
- **Monthly Invoicing**: Automatic invoice generation
- **Booking Statistics**: Per-company analytics

#### 9. **Loyalty & Points System**
- **Automatic Points**: Points per transfer
- **Reward Tiers**: Bronze, Silver, Gold, Platinum
- **Configurable Rewards**:
  - 5th ride: 20% discount
  - 10th ride: free transfer
- **Points Management**: Manual point adjustment

#### 10. **Review & Rating System**
- **Post-Transfer Email**: Automatic review requests
- **Star Ratings**: 1-5 star reviews
- **Comments**: Customer feedback
- **Admin Responses**: Reply to reviews
- **Featured Reviews**: Highlight best reviews on homepage

#### 11. **CMS Suite**
- **Blog Manager**: Create/edit/delete blog posts
  - Multi-language support
  - SEO meta fields
  - Featured images
  - Category and tag management
- **Page Builder**: Create custom pages
- **Menu Manager**: Navigation menu editor
- **Homepage Builder**: Drag-and-drop homepage sections
- **Media Manager**: Upload and organize images

#### 12. **Ad Tracking Dashboard**
- **Google Pixel Integration**: Track Google Ads conversions
- **Meta Pixel Integration**: Facebook/Instagram ad tracking
- **Campaign Performance**: ROI, conversions, revenue attribution
- **Conversion Tracking**: Track booking conversions from ads

#### 13. **Global Settings**
- **Site Configuration**: Site name, logo, contact info
- **Feature Toggles**: Enable/disable features
- **SEO Settings**: Meta tags, social media cards
- **Email Settings**: SMTP configuration
- **Payment Settings**: Stripe, currency, tax rates
- **Maintenance Mode**: Enable/disable site maintenance

#### 14. **User Management**
- **Roles**: Super Admin, Admin, Manager, Driver, Customer
- **Permissions**: Role-based access control
- **User CRUD**: Create, read, update, delete users
- **Activity Logs**: Track user actions

#### 15. **Performance Monitoring**
- **Real-Time Dashboard**: Live metrics via Socket.IO at `/admin/metrics`
- **Performance Metrics**: Response times, request rates, error rates
- **Cache Analytics**: Hit/miss ratios, Redis statistics
- **Database Performance**: Query counts, slow query detection
- **System Resources**: CPU usage, memory consumption
- **Queue Statistics**: Job monitoring across all BullMQ queues
- **Interactive Charts**: Recharts visualizations with time range filtering

#### 16. **Cache Management**
- **Cache Statistics**: Hit rates, key counts, memory usage
- **Manual Cache Control**: Clear cache by endpoint or globally
- **Redis Health**: Connection status and performance metrics

#### 17. **Rate Limit Management**
- **Violation Dashboard**: View blocked IPs and abuse patterns
- **Manual Unblock**: Remove bans for legitimate users
- **Real-Time Metrics**: Requests per minute, violations per hour

#### 18. **Background Job Dashboard**
- **Queue Overview**: Monitor all BullMQ queues at `/admin/jobs`
- **Job Management**: View, retry, pause, resume jobs
- **Progress Tracking**: Real-time job status updates
- **Failed Job Analysis**: Detailed error logs and retry controls

---

## 🏛️ Ministry-Compliant Passenger Collection

This application implements **Turkish Ministry of Transport** compliant passenger data collection for transfer services.

### Legal Requirement
> "Araca binecek TÜM yolcuların adı-soyadı" (Names of ALL passengers boarding the vehicle)

### Features
- **Dynamic Passenger Fields**: Based on adult + child count
- **Separate First/Last Name**: Individual inputs for each passenger
- **Minimum One Passenger**: Cannot proceed without at least one name
- **Beautiful UI**: Tailwind CSS with Add/Remove passenger buttons
- **Data Persistence**: Stored in MongoDB Booking document
- **Admin Visibility**: Expandable booking details in admin panel
- **Export Ready**: For confirmation emails, WhatsApp, PDF tickets

### Booking Form Enhancements
- **Phone Number**: Country code selector (+90, +966, +971, etc.)
- **Flight Number**: Required for airport transfers
- **Passenger Counters**: Adult / Child / Infant with modern UI
- **Extra Services**: Child seat, baby seat, meet & greet, VIP lounge
- **Real-Time Pricing**: Total price calculation with extras
- **WhatsApp Integration**: Direct contact link generation

---

## 🔒 Security & Best Practices

### Authentication & Authorization
✅ **JWT-based authentication** with short-lived access tokens (15 minutes)  
✅ **Refresh token rotation** for enhanced security  
✅ **httpOnly, secure, SameSite=strict** cookies  
✅ **Role-based access control** (RBAC): Admin, Manager, Driver, Customer  
✅ **bcrypt password hashing** with configurable salt rounds (default: 10)

### Security Headers
✅ **Strict Content Security Policy (CSP)**  
✅ **HTTP Strict Transport Security (HSTS)** with preload  
✅ **Referrer-Policy**: no-referrer  
✅ **Permissions-Policy**: Restrict camera, microphone, geolocation  
✅ **X-Content-Type-Options**: nosniff  
✅ **X-Frame-Options**: DENY

### Request Security
✅ **Rate Limiting**:
  - Global: 100 requests per 15 minutes
  - Strict: 5 requests per 15 minutes (auth endpoints)
✅ **CORS Whitelist**: Configured allowed origins  
✅ **Input Validation**: express-validator and Zod schemas  
✅ **NoSQL Injection Prevention**: mongo-sanitize middleware  
✅ **Request ID Correlation**: Distributed tracing support

### Data Protection
✅ **Automatic PII Redaction** in logs:
  - Passwords
  - JWT tokens
  - Cookies
  - Email addresses (partially redacted)
✅ **Log Rotation**: Daily rotation with 14-day retention  
✅ **Log Compression**: Automatic gzip compression  
✅ **Secure Token Storage**: Hashed refresh tokens in database

### Container Security
✅ **Non-root User**: Container runs as nodejs:1001  
✅ **Multi-stage Builds**: Minimal attack surface  
✅ **Health Checks**: Automatic container health monitoring  
✅ **Security Scanning**: Automated vulnerability scanning in CI/CD

### Best Practices Implemented
✅ No secrets in code or version control  
✅ All API inputs validated and sanitized  
✅ Parameterized database queries (no SQL/NoSQL injection)  
✅ HTTPS enforcement in production  
✅ Error messages don't leak sensitive information  
✅ Dependencies regularly updated and audited  
✅ Security headers on all responses  
✅ Session management with secure cookies  
✅ File upload size limits and type validation  
✅ Rate limiting on all endpoints  

---

## 📊 Database Collections

### Core Collections
- **users** - User accounts, authentication, roles
- **tours** - Tour/transfer packages and routes
- **bookings** - Customer bookings with passenger details
- **vehicles** - Fleet vehicles
- **drivers** - Driver profiles and assignments

### Feature Collections
- **basepricings** - Route-based pricing (airport ↔ district)
- **extraservices** - Extra service pricing (child seat, VIP lounge)
- **settings** / **globalsettings** - Global app settings
- **reviews** - Customer reviews and ratings
- **blogposts** - Blog content in multiple languages
- **loyaltypoints** - Customer loyalty points and rewards
- **adtrackings** - Ad pixel and conversion tracking
- **coupons** - Discount coupons and promotions
- **campaigns** - Marketing campaigns
- **campaignrules** - Campaign rule definitions
- **pages** - CMS pages
- **menus** - Navigation menus
- **media** - Media library
- **homepages** / **homelayouts** - Homepage layouts
- **faqs** - Frequently asked questions
- **corporateclients** - Corporate client profiles
- **delaycompensations** - Flight delay compensation records
- **delaymetrics** - Delay statistics
- **driverlocations** - Real-time driver GPS locations
- **adminlogs** - Admin activity logs
- **adminsettings** - Admin panel settings
- **featuretoggles** - Feature flag management

---

## 📋 API Documentation

### API Versioning

All endpoints available with `/api/v1` prefix. Legacy `/api` endpoints supported for backward compatibility.

### Core Public Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/health` | GET | Health check | No |
| `/api/v1/users/register` | POST | User registration | No |
| `/api/v1/users/login` | POST | User login | No |
| `/api/v1/users/refresh` | POST | Refresh access token | Refresh Token |
| `/api/v1/users/logout` | POST | Logout and revoke tokens | Yes |
| `/api/v1/tours` | GET | List tours/packages | No |
| `/api/v1/tours/:id` | GET | Get tour details | No |
| `/api/v1/bookings` | POST | Create booking | Yes |
| `/api/v1/bookings/:id` | GET | Get booking details | Yes |
| `/api/v1/blogs` | GET | List blog posts | No |
| `/api/v1/blogs/slug/:slug` | GET | Get blog post by slug | No |
| `/api/v1/reviews` | GET | List reviews | No |
| `/api/v1/reviews` | POST | Create review | Yes |

### Admin Endpoints (Authentication Required)

#### Pricing Management
- `GET /api/v1/admin/base-pricing` - List route pricing
- `POST /api/v1/admin/base-pricing` - Create route pricing
- `PATCH /api/v1/admin/base-pricing/:id` - Update route pricing
- `DELETE /api/v1/admin/base-pricing/:id` - Delete route pricing
- `GET /api/v1/admin/extra-services` - List extra services
- `POST /api/v1/admin/extra-services` - Create extra service
- `PATCH /api/v1/admin/extra-services/:id` - Update extra service
- `DELETE /api/v1/admin/extra-services/:id` - Delete extra service

#### Settings & Configuration
- `GET /api/v1/admin/settings` - Get global settings
- `PATCH /api/v1/admin/settings` - Update global settings
- `GET /api/v1/admin/feature-toggles` - Get feature flags
- `PATCH /api/v1/admin/feature-toggles/:id` - Update feature flag

#### User & Role Management
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/users` - Create user
- `PATCH /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user

#### Booking Management
- `GET /api/v1/admin/bookings` - List all bookings
- `PATCH /api/v1/admin/bookings/:id` - Update booking status
- `DELETE /api/v1/admin/bookings/:id` - Delete booking

#### Fleet Management
- `GET /api/v1/admin/drivers` - List drivers
- `POST /api/v1/admin/drivers` - Create driver
- `PATCH /api/v1/admin/drivers/:id` - Update driver
- `DELETE /api/v1/admin/drivers/:id` - Delete driver
- `GET /api/v1/admin/vehicles` - List vehicles
- `POST /api/v1/admin/vehicles` - Create vehicle

#### Communication
- `POST /api/v1/admin/messaging` - Send bulk WhatsApp/Email

#### Analytics & Reporting
- `GET /api/v1/admin/analytics` - Revenue and profit analytics
- `GET /api/v1/admin/tracking/dashboard` - Ad tracking dashboard
- `GET /api/v1/invoices/:bookingId` - Generate PDF invoice

#### CMS
- `GET /api/v1/admin/blogs` - List all blog posts (including drafts)
- `POST /api/v1/admin/blogs` - Create blog post
- `PATCH /api/v1/admin/blogs/:id` - Update blog post
- `DELETE /api/v1/admin/blogs/:id` - Delete blog post
- `GET /api/v1/admin/pages` - List CMS pages
- `POST /api/v1/admin/pages` - Create CMS page

### API Documentation Tools

- **Swagger UI**: http://localhost:5000/api/docs (when running locally)
- **Postman Collection**: See `postman/` directory
- **OpenAPI Spec**: Auto-generated from Swagger JSDoc

For detailed API security documentation, see `backend/SECURITY_API_DOCS.md`

---

## 🛠️ Development

### Project Scripts

#### Root Package Scripts (Frontend)

```bash
# Development
npm run dev              # Run frontend and backend concurrently
npm start                # Alias for dev

# Build & Preview
npm run build            # Build frontend for production (Vite)
npm run preview          # Preview production build locally

# Testing
npm test                 # Run frontend unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with interactive UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:report  # View E2E test report

# Code Quality
npm run lint             # Lint frontend code with ESLint
npm run lint:fix         # Fix linting issues automatically
npm run format           # Format code with Prettier
```

#### Backend Scripts

```bash
cd backend

# Development
npm run dev              # Run with nodemon (auto-reload on changes)
npm start                # Run in production mode

# Testing
npm test                 # Run all backend tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run seed             # Seed all data (users, tours, etc.)
npm run seed:users       # Seed only users
npm run seed:tours       # Seed only tours
npm run seed:reset       # Clear DB and re-seed

# Code Quality
npm run lint             # Lint backend code
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript type checking
```

### Code Style & Formatting

- **ESLint**: Airbnb config with Prettier integration
- **Prettier**: Consistent code formatting
  - Single quotes
  - 2-space indentation
  - Trailing commas (ES5)
- **EditorConfig**: Consistent editor settings across IDEs

### Git Hooks

Pre-commit hooks (if configured):
- ESLint checking
- Prettier formatting
- Test execution

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Failed

```bash
Error: MongoNetworkError: failed to connect to server
```

**Solutions:**
1. Verify `MONGO_URI` in `backend/.env`
2. Check MongoDB Atlas:
   - IP whitelist: Add `0.0.0.0/0` (allow all) for development
   - Database user has correct permissions
   - Cluster is running (not paused)
3. Test connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   ```
4. Replace `<password>` with actual password (URL-encode special characters)

#### 2. Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

**Linux/Mac:**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
lsof -ti:5000 | xargs kill -9
```

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Or change port:**
```bash
# In backend/.env
PORT=5001
```

#### 3. Frontend Can't Connect to Backend

```bash
Error: Network Error / CORS Error
```

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status":"OK","timestamp":"..."}
   ```
2. Check `VITE_API_URL` in frontend `.env`:
   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```
3. Verify `CORS_ORIGINS` in `backend/.env` includes frontend URL:
   ```bash
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
4. Clear browser cache and cookies
5. Restart both frontend and backend

#### 4. JWT Secret Not Set Warning

```bash
Warning: JWT_SECRET not set in production. Using generated secret.
```

**Solutions:**
1. Generate a secure secret:
   ```bash
   openssl rand -base64 64 | tr -d '\n'
   ```
2. Add to `backend/.env`:
   ```bash
   JWT_SECRET=<generated_secret>
   ```
3. Restart backend server

#### 5. Docker Build Fails

```bash
Error: npm install failed / Module not found
```

**Solutions:**
1. Clear Docker cache:
   ```bash
   docker system prune -a
   ```
2. Rebuild without cache:
   ```bash
   docker build --no-cache -t gnb-transfer .
   ```
3. Check Node version in Dockerfile (should be 18+):
   ```dockerfile
   FROM node:20-alpine
   ```
4. Verify `.dockerignore` doesn't exclude required files

#### 6. Environment Variables Not Loading

**Solutions:**
1. Ensure `.env` file exists (copy from `.env.example`)
2. Restart development server after changing `.env`
3. Check file location:
   - Frontend: Project root (`.env`)
   - Backend: `backend/.env`
4. Verify variable names:
   - Frontend: Must start with `VITE_`
   - Backend: No prefix required

#### 7. Google Cloud Deployment Issues

**Solutions:**
1. Verify gcloud CLI is authenticated:
   ```bash
   gcloud auth list
   # Should show active account
   ```
2. Check project ID:
   ```bash
   gcloud config get-value project
   ```
3. Enable required APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```
4. Check service logs:
   ```bash
   gcloud run logs read --service=gnb-transfer --limit=50
   ```
5. Verify environment variables are set:
   ```bash
   gcloud run services describe gnb-transfer --region=us-central1
   ```

#### 8. Stripe Webhook Verification Failed

**Solutions:**
1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
2. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`
3. In production, configure webhook in Stripe Dashboard

#### 9. Image Upload Not Working

**Solutions:**
1. Verify Cloudinary credentials in `backend/.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
2. Check file size limit (default: 5MB)
3. Ensure `uploads/` directory exists and is writable

#### 10. Tests Failing

**Solutions:**
1. Ensure test database is separate:
   ```bash
   # backend/.env.test
   MONGO_URI=mongodb://localhost:27017/gnb-transfer-test
   ```
2. Install all dev dependencies:
   ```bash
   npm install --include=dev
   ```
3. Clear test cache:
   ```bash
   npm test -- --clearCache
   ```

### Getting Help

- **Documentation**: Check `docs/` directory for detailed guides
- **API Docs**: Visit http://localhost:5000/api/docs when running
- **GitHub Issues**: [Open an issue](https://github.com/adem1273/gnb-transfer/issues)
- **Logs**: Check `backend/logs/` directory for application logs
- **Health Check**: http://localhost:5000/api/health
- **Community**: Check existing issues for similar problems

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gnb-transfer.git
   cd gnb-transfer
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow existing code style (ESLint + Prettier)
   - Add tests for new features
   - Update documentation as needed

5. **Run tests and linting**
   ```bash
   # Frontend
   npm run lint
   npm test

   # Backend
   cd backend
   npm run lint
   npm test
   ```

6. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring (no feature/bug change)
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (dependencies, build)
- `perf:` Performance improvements
- `ci:` CI/CD changes

**Examples:**
```bash
feat(booking): add multi-currency support
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
test(api): add tests for pricing endpoints
```

### Code Review Process

1. All PRs require at least one approval
2. All tests must pass (CI checks)
3. Code must follow ESLint rules
4. Security scan must pass
5. No merge conflicts
6. PR description clearly explains changes

### Development Setup for Contributors

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/gnb-transfer.git

# 2. Add upstream remote
git remote add upstream https://github.com/adem1273/gnb-transfer.git

# 3. Create .env files
cp .env.example .env
cp backend/.env.example backend/.env

# 4. Install dependencies
npm install
cd backend && npm install

# 5. Start development servers
npm run dev  # From root directory
```

### Areas for Contribution

- 🐛 **Bug fixes**: Check [Issues](https://github.com/adem1273/gnb-transfer/issues)
- ✨ **New features**: See [Roadmap](#-roadmap)
- 📝 **Documentation**: Improve README, API docs, guides
- 🌍 **Translations**: Improve language translations
- 🧪 **Test coverage**: Add unit/integration/E2E tests
- ♿ **Accessibility**: Improve WCAG compliance
- 🎨 **UI/UX**: Design improvements, responsive fixes
- 🔒 **Security**: Vulnerability fixes, security enhancements

### Code Style Guidelines

- **JavaScript**: ES6+ syntax, async/await preferred
- **React**: Functional components with hooks
- **Node.js**: ES Modules (`.mjs` for backend)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for functions, clear inline comments
- **Imports**: Organized (React → libraries → local)

See `CONTRIBUTING.md` for detailed guidelines.

---

## 📄 License

This project is licensed under the **ISC License**.

```
ISC License

Copyright (c) 2024 GNB Transfer

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 🙏 Acknowledgments

- **[React Team](https://reactjs.org/)** - Amazing UI framework
- **[Vite Team](https://vitejs.dev/)** - Blazing fast build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MongoDB](https://www.mongodb.com/)** - Flexible NoSQL database
- **[Express.js](https://expressjs.com/)** - Fast Node.js web framework
- **[Stripe](https://stripe.com/)** - Secure payment processing
- **[OpenAI](https://openai.com/)** - AI-powered features
- **[Google Cloud](https://cloud.google.com/)** - Reliable cloud infrastructure
- **[Sentry](https://sentry.io/)** - Error tracking and monitoring
- **[Playwright](https://playwright.dev/)** - Reliable E2E testing
- **Open Source Community** - All the amazing libraries and tools

---

## 📧 Contact & Support

- **Website**: https://gnbtransfer.com
- **Email**: support@gnbtransfer.com
- **GitHub**: https://github.com/adem1273/gnb-transfer
- **Issues**: [Report a bug](https://github.com/adem1273/gnb-transfer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/adem1273/gnb-transfer/discussions)
- **Documentation**: [Full docs](https://github.com/adem1273/gnb-transfer/tree/main/docs)

---

## 🗺️ Roadmap

### Recently Completed (Q4 2024 - Q1 2026)

- ✅ **Database Optimization** (#179) - 61+ strategic indexes, 90%+ query performance improvement
- ✅ **Real-Time Monitoring** (#178) - Socket.IO performance dashboard with live metrics
- ✅ **Background Job Queue** (#177) - BullMQ with Redis for async task processing
- ✅ **Redis Cache Layer** (#170) - Tag-based invalidation, 60-95% cache hit rates
- ✅ **DDoS Protection** (#171) - Distributed rate limiting with abuse detection
- ✅ **Automated Backups** (#175) - Multi-cloud backup system with disaster recovery
- ✅ **Staging Environment** (#173) - Production-like environment with K6 load testing
- ✅ **Major Upgrades** (#168) - React 19, Mongoose 9, MongoDB 7
- ✅ **Test Coverage**: 90+ additional test cases across backend and frontend
- ✅ **Code Cleanup** (#176) - Removed 53 duplicate files, consolidated legacy code
- ✅ **Mobile App** - React Native (Expo) iOS/Android app with offline support

### Planned Features (Q2-Q3 2026)

- [x] **Mobile App**: React Native iOS/Android app ✅ Completed
- [ ] **Real-time GPS Tracking**: Live driver location with Socket.IO (foundation complete)
- [ ] **Multi-Currency Auto**: Automatic exchange rate updates via API
- [ ] **Advanced Analytics**: Predictive analytics with ML models
- [ ] **SMS Notifications**: Twilio integration for booking updates
- [ ] **WhatsApp Business API**: Official WhatsApp integration
- [ ] **Multi-Tenant Support**: Multiple companies on one platform
- [ ] **Advanced SEO Tools**: Schema builder, sitemap automation
- [ ] **Booking Aggregators**: Integration with TripAdvisor, GetYourGuide
- [ ] **Fleet Maintenance**: Automated maintenance scheduling and tracking
- [ ] **Driver App**: Dedicated mobile app for drivers
- [ ] **API Marketplace**: Public API for third-party integrations
- [ ] **Voice Booking**: AI-powered voice booking assistant
- [ ] **A/B Testing**: Built-in feature flag testing framework

### Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Recent Updates (January 2026)

#### 🚀 Latest Performance & Scalability Improvements

- ✅ **Database Optimization** (#179) - Comprehensive indexing with 61+ strategic indexes across all models, achieving 90-95% query performance improvement
- ✅ **Real-Time Monitoring** (#178) - Live performance dashboard with Socket.IO, tracking response times, cache hits, system resources
- ✅ **Background Job Queue** (#177) - BullMQ-based async processing for exports, emails, AI tasks with Prometheus metrics
- ✅ **Code Cleanup** (#176) - Removed 53 duplicate files and consolidated legacy code for better maintainability
- ✅ **Automated Backups** (#175) - Production-grade disaster recovery with MongoDB backups, S3/GCS storage, point-in-time recovery
- ✅ **Staging Environment** (#173) - Complete staging setup with load testing (K6), Prometheus/Grafana monitoring
- ✅ **Query Optimization** (#172) - Strategic database indexing achieving sub-50ms queries with 80%+ index coverage
- ✅ **DDoS Protection** (#171) - Redis-backed distributed rate limiting with gradual penalties and abuse detection
- ✅ **Cache Layer** (#170) - Redis caching with tag-based invalidation reducing database load by 60-95%
- ✅ **Major Upgrades** (#168) - React 19, Mongoose 9, MongoDB 7, comprehensive test coverage (+90 test cases)
- ✅ **Mobile App** - React Native (Expo) app with offline support, multi-language, and shared code

#### 📊 Core Features

- ✅ Multi-language support (9 languages)
- ✅ Admin panel with 15+ advanced features
- ✅ Google Cloud deployment ready
- ✅ Comprehensive security hardening
- ✅ SEO-optimized blog system
- ✅ Loyalty program with tiers
- ✅ Ad tracking dashboard
- ✅ Corporate client management
- ✅ Bulk messaging system
- ✅ PDF invoice generation
- ✅ Mobile app (iOS/Android)

---

## 📚 Additional Documentation

### Deployment & Operations
- [Deployment Guide](docs/DEPLOY_GOOGLE_CLOUD.md) - Cloud Run and App Engine
- [Quick Start](docs/QUICKSTART_GOOGLE_CLOUD.md) - Fast deployment
- [Production Readiness](docs/PRODUCTION_READY.md) - Go-live checklist
- [Docker Guide](DOCKER_README.md) - Docker deployment
- [Runbook](docs/RUNBOOK.md) - Operational procedures
- [Disaster Recovery](docs/DISASTER_RECOVERY.md) - Backup and recovery procedures
- [Staging Deployment](docs/STAGING_DEPLOYMENT.md) - Staging environment setup

### Performance & Monitoring
- [Database Indexes](docs/DATABASE_INDEXES.md) - Indexing strategy and query patterns
- [Performance Monitoring](docs/PERFORMANCE_MONITORING.md) - Real-time dashboard usage
- [Cache Documentation](docs/CACHE.md) - Redis cache layer and invalidation
- [Rate Limiting](docs/RATE_LIMITING.md) - DDoS protection and abuse prevention
- [Performance Budget](PERFORMANCE_BUDGET.md) - Bundle size targets and enforcement

### Features & Development
- [Job Queue](docs/JOB_QUEUE.md) - Background job processing with BullMQ
- [Security Documentation](backend/SECURITY_API_DOCS.md) - Security features
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
- [Changelog](CHANGELOG.md) - Version history

### Mobile App
- [Mobile App Documentation](mobile/README.md) - Complete mobile app guide
- [Shared Package](packages/shared/README.md) - Shared utilities and types

---

**Built with ❤️ by the GNB Transfer Team**

*Making travel transfers simple, secure, and customer-friendly.*

---

## ⭐ Star this Repository

If you find this project useful, please consider giving it a star on GitHub! It helps us grow and improve.

[![GitHub stars](https://img.shields.io/github/stars/adem1273/gnb-transfer?style=social)](https://github.com/adem1273/gnb-transfer/stargazers)
