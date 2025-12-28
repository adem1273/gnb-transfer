# GNB Transfer

**GNB Transfer** is a comprehensive, production-ready MERN stack web application for tourism and transfer services. The platform includes a customer-facing website, advanced admin panel, payment integration, AI-powered features, and multi-language support.

Built with modern web technologies and best practices, GNB Transfer provides a complete solution for managing bookings, tours, fleet operations, customer loyalty, and business analytics.

## ✨ Key Features

### Customer-Facing Features
- **Multi-Language Support**: 9 languages with RTL support for Arabic and Persian
- **Booking System**: Multi-step booking with passenger details, flight info, extras
- **Stripe Payments**: Secure payment processing with webhooks
- **AI-Powered Recommendations**: Personalized tour suggestions
- **Blog System**: 40+ SEO-optimized articles in 9 languages
- **Live Chat**: Real-time customer support
- **Reviews & Ratings**: Customer feedback system
- **Loyalty Program**: Points-based rewards with tier system
- **Social Login**: Google and Apple Sign-In integration

### Admin Panel Features
- **Dashboard Analytics**: Revenue, bookings, performance metrics
- **Dynamic Pricing**: Route-based pricing, seasonal multipliers, currency switching
- **Fleet Management**: Drivers, vehicles, assignments, tracking
- **Booking Management**: Status tracking, bulk messaging, invoice generation
- **CMS**: Blog posts, pages, menus, media manager
- **Corporate Clients**: Company profiles, discounts, monthly invoicing
- **Ad Tracking**: Google/Meta pixel integration, conversion tracking
- **Global Settings**: Site-wide configuration, feature toggles
- **User Management**: Roles (Admin, Manager, Driver, Customer)
- **Delay Compensation**: Automatic compensation for delays

### Technical Features
- **Production Security**: JWT auth, rate limiting, CORS, helmet, input validation
- **Error Tracking**: Sentry integration
- **Monitoring**: Health checks, logging with Winston
- **Cloud Deployment**: Google Cloud Run, App Engine, Docker support
- **Database Seeding**: Sample data for development
- **Automated Testing**: Unit tests (Vitest), E2E tests (Playwright)
- **CI/CD**: GitHub Actions workflows

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Custom responsive components
- **Routing**: React Router v7
- **State Management**: React Context API + TanStack Query
- **Internationalization**: i18next with 9 languages
- **Payment**: Stripe React Components
- **Maps**: Leaflet for live tracking
- **Analytics**: Google Analytics 4, Microsoft Clarity
- **Error Tracking**: Sentry

### Backend
- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js 4.x/5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Payment**: Stripe webhooks
- **AI**: OpenAI API integration
- **Email**: Nodemailer (Gmail, SMTP, Mailtrap)
- **File Upload**: Multer with Cloudinary
- **Logging**: Winston with daily rotation
- **Caching**: Node-cache, Redis support
- **PDF Generation**: PDFKit
- **Scheduled Tasks**: node-cron

### DevOps & Deployment
- **Containerization**: Docker, Docker Compose
- **Cloud Platforms**: Google Cloud Run, App Engine
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, health checks
- **Testing**: Vitest (unit), Playwright (E2E)

---

## 🌍 Multi-Language Support

GNB Transfer supports 9 languages with complete translations:

| Flag | Language | Code | Direction |
|------|----------|------|-----------|
| 🇹🇷 | Türkçe (Default) | tr | LTR |
| 🇬🇧 | English | en | LTR |
| 🇸🇦 | العربية (Arabic) | ar | RTL |
| 🇷🇺 | Русский (Russian) | ru | LTR |
| 🇩🇪 | Deutsch (German) | de | LTR |
| 🇫🇷 | Français (French) | fr | LTR |
| 🇪🇸 | Español (Spanish) | es | LTR |
| 🇨🇳 | 简体中文 (Chinese) | zh | LTR |
| 🇮🇷 | فارسی (Persian) | fa | RTL |

### Language Features

- **Auto-detection**: Automatically detects user's browser language
- **Fallback to Turkish**: If language is not supported, defaults to Turkish
- **RTL Support**: Full right-to-left support for Arabic and Persian
- **Language Switcher**: Beautiful dropdown in header with flags
- **Mobile Globe Button**: Floating language button on mobile devices
- **Persistent Selection**: Language choice is saved in localStorage

### Translation Files Structure

```
src/locales/
├── tr/translation.json   # Turkish (default)
├── en/translation.json   # English
├── ar/translation.json   # Arabic (RTL)
├── ru/translation.json   # Russian
├── de/translation.json   # German
├── fr/translation.json   # French
├── es/translation.json   # Spanish
├── zh/translation.json   # Chinese
└── fa/translation.json   # Persian (RTL)
```

### Using Translations in Code

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('home.welcome')}</h1>;
}
```

### Language Support Status

**All 9 languages are 100% complete with 395+ translation keys each!** ✅

| Language | Code | Status | Keys | Completion | Notes |
|----------|------|--------|------|------------|-------|
| 🇹🇷 Turkish | tr | ✅ Complete | 447 | 100% | Default/Fallback |
| 🇬🇧 English | en | ✅ Complete | 395 | 100% | Base language |
| 🇸🇦 Arabic | ar | ✅ Complete | 447 | 100% | RTL supported |
| 🇷🇺 Russian | ru | ✅ Complete | 447 | 100% | Full support |
| 🇩🇪 German | de | ✅ Complete | 447 | 100% | Full support |
| 🇫🇷 French | fr | ✅ Complete | 447 | 100% | Full support |
| 🇪🇸 Spanish | es | ✅ Complete | 447 | 100% | Full support |
| 🇨🇳 Chinese | zh | ✅ Complete | 447 | 100% | Simplified |
| 🇮🇷 Persian | fa | ✅ Complete | 447 | 100% | RTL supported |

**Coverage Areas:**
- ✅ Header & Navigation (11 keys)
- ✅ Authentication (15 keys - login, register, password reset, social auth)
- ✅ Home Page (28 keys - welcome, services, trust badges, campaigns)
- ✅ Booking System (67 keys - multi-step form, passenger details, payment, validation)
- ✅ Tours & Packages (35+ keys - listings, filtering, AI recommendations)
- ✅ Admin Panel (50+ keys - dashboard, users, bookings, analytics)
- ✅ Blog System (25 keys - posts, categories, sharing)
- ✅ Reviews & Testimonials (16 keys)
- ✅ Live Chat & AI Assistant (26 keys)
- ✅ Footer & Legal Pages (12 keys)
- ✅ Forms & Validation Messages (25+ keys)
- ✅ Error Messages & Notifications (20+ keys)
- ✅ About & Contact Pages (37 keys)
- ✅ Services & Fleet (30 keys)
- ✅ Driver Management (11 keys)
- ✅ Delay Guarantee (10 keys)
- ✅ Image Descriptions (50+ keys - accessibility)
- ✅ Bookings Management (17 keys)
- ✅ Common UI Elements (20+ keys - buttons, states, actions)

**Note:** Non-Turkish languages currently use English as fallback. Professional translation services recommended for production deployment.

**RTL (Right-to-Left) Support:**
- ✅ Arabic and Persian languages fully supported
- ✅ Automatic `dir="rtl"` attribute on `<html>` element
- ✅ RTL-aware CSS classes in Tailwind
- ✅ Logical properties (start/end instead of left/right)
- ✅ Proper text alignment and spacing in RTL mode

**i18n Configuration:**
- ✅ All 9 languages in `supportedLngs` array
- ✅ Turkish (`tr`) set as fallback language
- ✅ Language detector with multiple strategies (URL, cookie, localStorage, browser)
- ✅ Automatic language switching updates `dir` and `lang` attributes
- ✅ No suspense mode for better UX

---

## 📁 Repository Structure

```
gnb-transfer/
├── backend/                  # Backend Express.js API
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middlewares/         # Express middlewares (auth, validation, rate limiting)
│   ├── models/              # Mongoose schemas (User, Booking, Tour, etc.)
│   ├── routes/              # API route definitions
│   ├── scripts/             # Utility scripts (seed, migration, test)
│   ├── services/            # Business logic services
│   ├── tests/               # Backend unit and integration tests
│   ├── utils/               # Helper functions
│   ├── validators/          # Input validation schemas
│   ├── .env.example         # Backend environment variables template
│   ├── Dockerfile           # Backend Docker image
│   ├── package.json         # Backend dependencies
│   └── server.mjs           # Main backend entry point
│
├── src/                     # Frontend React application
│   ├── components/          # Reusable React components
│   ├── context/             # React Context providers (Auth, Theme)
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Layout components
│   ├── locales/             # i18n translation files (9 languages)
│   ├── pages/               # Page components (Home, Booking, Admin, etc.)
│   ├── styles/              # Global CSS and Tailwind config
│   ├── utils/               # Frontend utility functions
│   ├── App.jsx              # Main App component
│   └── index.jsx            # Frontend entry point
│
├── admin/                   # Standalone admin panel (legacy/alternative)
│   └── src/                 # Admin panel components
│
├── public/                  # Static assets (images, icons)
│   └── locales/             # Public translation files
│
├── e2e/                     # End-to-end tests (Playwright)
│   └── tests/               # E2E test scenarios
│
├── docs/                    # Documentation
│   ├── DEPLOY_GOOGLE_CLOUD.md
│   ├── QUICKSTART_GOOGLE_CLOUD.md
│   ├── PRODUCTION_READY.md
│   └── ...
│
├── scripts/                 # Root-level utility scripts
│   └── validation/          # Validation scripts
│
├── .github/                 # GitHub configuration
│   └── workflows/           # CI/CD workflows (deploy, test, security)
│
├── .env.example             # Frontend environment variables template
├── Dockerfile               # Multi-stage Docker build
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

## 🚀 Installation & Local Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **MongoDB**: MongoDB Atlas account or local MongoDB instance
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
nano .env  # or use your preferred editor

# Start the backend server (development mode)
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to project root
cd gnb-transfer

# Install frontend dependencies
npm install

# Copy frontend environment variables
cp .env.example .env

# Edit frontend .env file
# Required: VITE_API_URL=http://localhost:5000/api
nano .env

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Create Test Admin User

```bash
# In the backend directory
cd backend

# Create a test admin user
node scripts/create-test-admin.mjs

# Or seed the database with sample data (includes admin users)
npm run seed
```

**Default admin credentials after seeding:**
- Email: `admin@gnbtransfer.com`
- Password: `Admin123!`

### 5. Verify Installation

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health
- Admin Panel: http://localhost:5173/admin/dashboard

---

## 🔐 Environment Variables

### Backend Environment Variables (`backend/.env`)

#### Required Variables

```bash
# MongoDB Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gnb-transfer

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters

# CORS Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5000` |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `SENTRY_DSN` | Sentry error tracking DSN | - |
| `EMAIL_PROVIDER` | Email provider (`gmail`, `smtp`, `mailtrap`) | - |
| `EMAIL_USER` | Email account username | - |
| `EMAIL_PASSWORD` | Email account password | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `AWS_ACCESS_KEY_ID` | AWS access key for backups | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `S3_BACKUP_BUCKET` | S3 bucket for backups | - |

See `backend/.env.example` for complete list with descriptions.

### Frontend Environment Variables (`.env`)

#### Required Variables

```bash
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_APPLE_CLIENT_ID` | Apple Sign-In client ID |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity project ID |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend error tracking |

See `.env.example` for complete list.

---

## 🌱 Database Seeding

Populate the database with sample data for development and testing:

```bash
cd backend

# Seed all data (users, tours, bookings, blog posts)
npm run seed

# Seed only users
npm run seed:users

# Seed only tours
npm run seed:tours

# Clear and re-seed all data
npm run seed:reset

# Seed blog posts (40 posts in 9 languages)
node scripts/seedBlogPosts.mjs
```

**Sample credentials after seeding:**
- **Admin**: `admin@gnbtransfer.com` / `Admin123!`
- **Manager**: `manager@gnbtransfer.com` / `Manager123!`
- **Driver**: `driver1@gnbtransfer.com` / `Driver123!`
- **Customer**: `user@gnbtransfer.com` / `User1234!`

---

## 🐳 Docker Setup

### Using Docker Compose (Recommended for Local Development)

```bash
# Start all services (MongoDB, Backend, Frontend, Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### Build Docker Image Manually

```bash
# Build the production image
docker build -t gnb-transfer .

# Run the container
docker run -p 8080:8080 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e CORS_ORIGINS=http://localhost:8080 \
  gnb-transfer

# Test the application
curl http://localhost:8080/api/health
```

---

## ☁️ Deployment

### Deploy to Google Cloud Run (Recommended)

#### Quick Deploy

```bash
# Install and authenticate gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Run the deployment script
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh production
```

#### Manual Deploy

```bash
# Build and deploy using Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gnb-transfer

# Deploy to Cloud Run
gcloud run deploy gnb-transfer \
  --image gcr.io/YOUR_PROJECT_ID/gnb-transfer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --set-env-vars "NODE_ENV=production,MONGO_URI=your_uri,JWT_SECRET=your_secret"
```

#### Set Environment Variables

```bash
gcloud run services update gnb-transfer \
  --region us-central1 \
  --set-env-vars "MONGO_URI=mongodb+srv://...,JWT_SECRET=...,CORS_ORIGINS=https://yourdomain.com"
```

### Deploy to Google App Engine

```bash
# Deploy using app.yaml configuration
gcloud app deploy

# View logs
gcloud app logs tail -s default

# Open in browser
gcloud app browse
```

### Deploy Using Docker to Any Platform

The application can be deployed to:
- **Google Cloud Run**: Auto-scaling, pay-per-use
- **Google App Engine**: Managed platform
- **AWS ECS/Fargate**: Container orchestration
- **Azure Container Instances**: Serverless containers
- **Render**: Simple deployment
- **Railway**: Git-based deployment
- **Fly.io**: Edge deployment

See `docs/DEPLOY_GOOGLE_CLOUD.md` for detailed deployment instructions.

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Testing (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

### Verify Test Admin

```bash
cd backend
node scripts/verify-auth.mjs
```

---

## 📝 Blog System

GNB Transfer includes a fully multilingual, high-conversion, sales-oriented blog system with **40 ready-made posts** translated into all 9 supported languages (360 total articles).

### Blog Features

- **Full 9-Language Support**: Every post is available in TR, EN, AR (RTL), RU, DE, FR, ES, ZH, and FA (RTL)
- **Rich Admin Panel**: Create, edit, and delete posts with multilingual editor
- **SEO Optimized**: 
  - JSON-LD Article structured data
  - OpenGraph meta tags
  - Twitter Cards
  - Canonical URLs for each language
  - Automatic reading time calculation
- **Conversion-Focused**:
  - Every post includes strong CTAs to booking page
  - WhatsApp contact integration
  - Pricing tables with discount codes
  - 3+ internal links per post
- **Modern Features**:
  - Share buttons (WhatsApp, Twitter, Facebook, LinkedIn)
  - Related posts suggestions
  - Category filtering
  - Pagination
  - View tracking

### Blog Post Categories

| Category | Description |
|----------|-------------|
| transfer-prices | VIP transfer pricing guides |
| destinations | Tourist destination guides |
| services | Service features and options |
| tips | Travel tips and advice |
| news | Company news and updates |
| promotions | Special offers and discounts |
| seasonal | Seasonal content (holidays, festivals) |

### Seeding Blog Posts

To populate the database with 40 sample blog posts:

```bash
cd backend
node scripts/seedBlogPosts.mjs
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blogs` | GET | List published posts with pagination |
| `/api/blogs/slug/:slug` | GET | Get post by slug |
| `/api/blogs/categories` | GET | List all categories |
| `/api/blogs/feed/rss` | GET | RSS feed |
| `/api/blogs/admin/all` | GET | Admin: all posts (auth required) |
| `/api/blogs` | POST | Create post (auth required) |
| `/api/blogs/:id` | PUT | Update post (auth required) |
| `/api/blogs/:id` | DELETE | Delete post (auth required) |

---

## 🎯 Admin Panel Features

### 1. 💵 Dynamic Pricing & Services
- **Full base price table** for airport ↔ district routes
- **Extra services pricing** (child seat, meet & greet, VIP lounge, etc.)
- **Seasonal multipliers** (e.g., summer ×1.2)
- **Currency switcher** with manual exchange rates
- **Night surcharge** configuration
- **Tax rate** management

### 2. 🚗 Drivers & Vehicles Management
- Add/edit/delete drivers with full profiles
- Vehicle assignment and availability toggle
- Driver performance tracking
- License and document management

### 3. 📍 Live Booking Status Tracking
- Statuses: Pending → Assigned → On Way → Picked Up → Completed / Cancelled
- Admin manual status change
- Real-time fleet tracking

### 4. 📨 Bulk WhatsApp & Email Sender
- Select multiple bookings
- Template or custom message
- WhatsApp link generation
- Email bulk sending

### 5. 📄 Invoice & PDF Generation
- One-click PDF invoice
- Company logo and passenger names
- Turkish e-fatura fields
- QR code support

### 6. 📊 Income-Expense & Profit Dashboard
- Monthly/yearly revenue tracking
- Profit margin calculation
- Payment method breakdown
- Export to CSV/PDF

### 7. 🏢 Corporate Client Panel
- Company profiles with tax info
- Discount percentages
- Monthly invoicing
- Booking statistics

### 8. 🎁 Loyalty / Points System
- Automatic points per transfer
- 5th ride: 20% off
- 10th ride: free (configurable)
- Tier system (Bronze, Silver, Gold, Platinum)

### 9. ⭐ Review & Rating System
- Post-transfer auto email
- Stars + comments
- Homepage featured reviews
- Admin response capability

### 10. 🗺️ Live Vehicle Map Tracking
- Real-time driver locations
- Google Maps integration
- Fleet overview dashboard

### 11. 📝 Blog & SEO Content Manager
- Add/edit/delete blog posts
- Title, slug, content, featured image
- SEO meta fields
- Multi-language support
- Category and tag management

### 12. 📈 Ad Pixel & Conversion Tracking Dashboard
- Google/Meta pixel integration
- Campaign performance
- Conversion tracking
- Revenue attribution

---

## 🏛️ Ministry-Compliant Passenger Collection

This application implements **Turkish Ministry of Transport** compliant passenger name collection for transfer services.

### Legal Requirement
> "Araca binecek TÜM yolcuların adı-soyadı" (Names of ALL passengers boarding the vehicle)

### Features
- **Dynamic passenger name fields** based on adult + child count
- **Separate first name and last name inputs** for each passenger
- **Minimum one passenger required** - cannot proceed without at least one name
- **Beautiful Tailwind UI** with Add/Remove passenger buttons
- **Data persisted to MongoDB** in the Booking document
- **Visible in Admin Panel** with expandable booking details
- **Ready for confirmation emails, WhatsApp messages, and PDF tickets**

### Booking Form Enhancements
- **Phone number with country code selector** (+90, +966, +971, etc.)
- **Flight number field** (required for transfers)
- **Adult / Child / Infant counters** with beautiful counter UI
- **Extra services**: Child seat, Baby seat, Meet & Greet, VIP Lounge
- **Real-time total price calculation** including all extras
- **WhatsApp link generation** for easy customer contact

---

## 📂 Klasör Yapısı

GNB-Pro/
├── backend/
│   ├── ai/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── index.js
├── .env
├── package.json
└── vite.config.js


---

## 💻 Kurulum ve Çalıştırma

### **Ön Gereksinimler**
- Node.js (v18 veya üzeri)
- npm veya yarn
- MongoDB Atlas veya yerel bir MongoDB sunucusu

### **1. Backend Kurulumu**

1.  `backend` klasörüne gidin:
    ```bash
    cd backend
    ```
2.  Gerekli bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
3.  `.env` dosyasını oluşturun ve veritabanı bağlantı URI'nizi ve JWT sırrınızı ekleyin:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    STRIPE_SECRET_KEY=your_stripe_secret_key
    ```
4.  Sunucuyu başlatın:
    ```bash
    npm run dev
    ```

### **2. Frontend Kurulumu**

1.  `frontend` klasörüne gidin:
    ```bash
    cd ../frontend
    ```
2.  Gerekli bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
3.  `.env` dosyasını oluşturun ve backend API'nizin URL'sini ekleyin:
    ```
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Uygulamayı başlatın:
    ```bash
    npm run dev
    ```

---

## 👨‍💻 Admin Paneli

Admin paneline erişmek için `http://localhost:5173/admin/dashboard` adresine gidin.

**Giriş Bilgileri:**
- **Kullanıcı Adı (Email):** `admin@example.com` (Veritabanına manuel eklenmeli)
- **Şifre:** `123456`

**Not:** Admin hesabını manuel olarak MongoDB'de oluşturmanız gerekmektedir.

---

## 🔒 Security Features

### Production-Ready Security Hardening

This application implements comprehensive security measures for production deployment:

**Authentication & Authorization:**
- JWT-based authentication with short-lived access tokens (15 minutes)
- Refresh token rotation for enhanced security
- httpOnly, secure, SameSite=strict cookies for refresh tokens
- Role-based access control (RBAC)
- bcrypt password hashing with configurable salt rounds

**Security Headers:**
- Strict Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS) with preload
- Referrer-Policy set to 'no-referrer'
- Permissions-Policy restricting camera, microphone, and geolocation

**Request Security:**
- Rate limiting (global and strict for sensitive operations)
- CORS whitelist configuration
- Input validation using express-validator
- Request ID correlation for distributed tracing

**Data Protection:**
- Automatic PII redaction in logs (passwords, tokens, cookies, emails)
- Log rotation with compression (14-day retention)
- Secure token storage (hashed in database)

**API Endpoints (v1):**
- `POST /api/v1/users/register` - User registration with validation
- `POST /api/v1/users/login` - Authentication with token generation
- `POST /api/v1/users/refresh` - Token refresh with rotation
- `POST /api/v1/users/logout` - Token revocation and cleanup

**New Admin API Endpoints:**
- `GET/POST/PATCH/DELETE /api/v1/admin/base-pricing` - Route pricing management
- `GET/POST/PATCH/DELETE /api/v1/admin/extra-services` - Extra services pricing
- `GET/PATCH /api/v1/admin/settings` - Global settings (currency, pricing modifiers)
- `GET/POST /api/v1/reviews` - Review management
- `GET/POST/PATCH/DELETE /api/v1/blog` - Blog & SEO content
- `GET/POST /api/v1/loyalty` - Loyalty points system
- `GET/POST /api/v1/admin/messaging` - Bulk messaging
- `GET /api/v1/invoices/:bookingId` - PDF invoice generation
- `GET/POST /api/v1/tracking` - Ad pixel & conversion tracking
- `GET /api/v1/admin/tracking/dashboard` - Ad tracking dashboard

**Note:** All API endpoints are available with `/api/v1` prefix. Legacy `/api` endpoints are also supported for backward compatibility.

For detailed security documentation, see `backend/SECURITY_API_DOCS.md`

### Required Environment Variables

```bash
# Backend (Required in production)
MONGO_URI=           # MongoDB connection string
JWT_SECRET=          # Generate with: openssl rand -base64 64
CORS_ORIGINS=        # Comma-separated list of frontend URLs

# Backend (Optional - features disabled if not set)
STRIPE_SECRET_KEY=   # For payment processing
STRIPE_WEBHOOK_SECRET= # For Stripe webhooks
OPENAI_API_KEY=      # For AI features
GOOGLE_CLIENT_ID=    # For Google OAuth
GOOGLE_CLIENT_SECRET= # For Google OAuth
SENTRY_DSN=          # For error tracking

# Frontend (Vite)
VITE_API_URL=        # Backend API URL
VITE_STRIPE_PUBLIC_KEY= # Stripe publishable key
VITE_GOOGLE_CLIENT_ID= # For Google Sign-In
VITE_GA_MEASUREMENT_ID= # For Google Analytics
```

---

## 🔐 Deployment: Adding Secrets

This section explains how to securely add environment variables in various deployment platforms.

### Generate Secure Secrets

Before deploying, generate secure values for your secrets:

```bash
# Generate JWT_SECRET (64+ characters recommended)
openssl rand -base64 64 | tr -d '\n'

# Generate SESSION_SECRET
openssl rand -base64 32

# Generate BACKUP_ENCRYPTION_KEY
openssl rand -hex 32
```

### Vercel Deployment

**Adding Environment Variables:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - Click **Add New**
   - Enter the variable name (e.g., `VITE_API_URL`)
   - Enter the value
   - Select environments: **Production**, **Preview**, **Development** as needed
   - Click **Save**

**Required Variables for Vercel (Frontend):**
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com/api` |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_live_...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `123...apps.googleusercontent.com` |

**Tips:**
- Use different values for Production vs Preview environments
- Never use test keys (sk_test_, pk_test_) in Production

### Render Deployment

**Adding Environment Variables:**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service (Web Service or Background Worker)
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Enter the key and value
6. Click **Save Changes** (service will redeploy)

**Required Variables for Render (Backend):**
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | ✅ Yes |
| `PORT` | Usually auto-set by Render | Auto |
| `MONGO_URI` | MongoDB Atlas connection string | ✅ Yes |
| `JWT_SECRET` | 64+ character random string | ✅ Yes |
| `CORS_ORIGINS` | Frontend URL(s), comma-separated | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | For payments |
| `OPENAI_API_KEY` | OpenAI API key | For AI features |

**Generate JWT_SECRET in Render:**
1. In the Environment tab, click **Generate** next to the value field
2. Or paste a pre-generated value from `openssl rand -base64 64`

**Secret Files (Alternative):**
1. Navigate to **Environment** → **Secret Files**
2. Upload `.env` file content
3. Set filename to `.env`

### GitHub Actions Secrets

**For CI/CD Pipelines:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `MONGO_URI`
   - Secret: Your MongoDB connection string
   - Click **Add secret**

**Required Secrets for GitHub Actions:**
| Secret Name | Description |
|-------------|-------------|
| `MONGO_URI` | MongoDB connection string for tests |
| `JWT_SECRET` | JWT secret for test environment |
| `VERCEL_TOKEN` | For Vercel deployment (optional) |
| `RENDER_API_KEY` | For Render deployment (optional) |

**Using Secrets in Workflows:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      MONGO_URI: ${{ secrets.MONGO_URI }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

**Environment-Specific Secrets:**
1. Go to **Settings** → **Environments**
2. Create environments: `production`, `staging`
3. Add environment-specific secrets
4. Reference in workflow:
```yaml
jobs:
  deploy:
    environment: production
    env:
      API_KEY: ${{ secrets.API_KEY }}
```

### Railway Deployment

**Adding Environment Variables:**

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on your service
4. Navigate to **Variables** tab
5. Add variables one by one or use **RAW Editor** for bulk import

**Bulk Import (RAW Editor):**
```
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
CORS_ORIGINS=https://yourapp.vercel.app
```

### MongoDB Atlas Connection String

**Getting your MONGO_URI:**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster → **Connect**
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

**Security Tips:**
- Create a dedicated database user for each environment
- Use IP whitelisting (or allow access from anywhere for serverless)
- Enable MongoDB Atlas monitoring

---

### Social Login Setup

**Google Sign-In:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Set `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment

**Apple Sign-In:**
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Services ID for Sign In with Apple
3. Configure your domain and return URLs
4. Set `VITE_APPLE_CLIENT_ID` and related secrets

---

## 📖 Runbook

For operational procedures, incident response, and troubleshooting guides, see the comprehensive [Runbook](docs/RUNBOOK.md).

The runbook covers:
- Emergency contacts
- Service health monitoring
- Incident response procedures
- Deployment and rollback procedures
- Database operations
- Security operations
- Troubleshooting guide

---

## 🗄️ Database Collections

The application uses the following MongoDB collections:

### Core Collections
- `users` - User accounts and authentication
- `tours` - Tour/transfer listings
- `bookings` - Customer bookings
- `vehicles` - Fleet vehicles
- `drivers` - Driver profiles

### New Feature Collections
- `basepricings` - Route pricing (airport ↔ district)
- `extraservices` - Extra service pricing (child seat, VIP lounge, etc.)
- `settings` - Global app settings (currency, pricing modifiers, seasonal multipliers)
- `reviews` - Customer reviews and ratings
- `blogposts` - Blog content for SEO
- `loyaltypoints` - Customer loyalty points and rewards
- `adtrackings` - Ad pixel and conversion tracking
- `coupons` - Discount coupons

---

## 🌱 Database Seeding

To populate the database with sample data for development:

```bash
# Navigate to backend directory
cd backend

# Seed all data (users and tours)
npm run seed

# Seed only users
npm run seed:users

# Seed only tours
npm run seed:tours

# Clear and re-seed all data
npm run seed:reset
```

**Sample credentials after seeding:**
- Admin: `admin@gnbtransfer.com` / `Admin123!`
- Manager: `manager@gnbtransfer.com` / `Manager123!`
- Driver: `driver1@gnbtransfer.com` / `Driver123!`
- User: `user@gnbtransfer.com` / `User1234!`

---

## 🚀 Deployment to Google Cloud

GNB Transfer is ready for deployment to Google Cloud Platform (Cloud Run or App Engine).

### Quick Deploy to Cloud Run

```bash
# Install gcloud CLI and authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy using the deployment script
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh production
```

### Deployment Options

| Platform | Best For | Deployment Method |
|----------|----------|-------------------|
| **Cloud Run** | Auto-scaling, pay-per-use | `gcloud run deploy --source .` |
| **App Engine** | Integrated GCP features | `gcloud app deploy` |
| **Docker** | Local testing, any cloud | `docker build -t gnb-transfer .` |

### Required Environment Variables

For Google Cloud deployment, set these environment variables:

```bash
# Required
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gnb-transfer
JWT_SECRET=your-secure-secret-minimum-32-characters
CORS_ORIGINS=https://your-domain.com

# Payment Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_key

# Optional
OPENAI_API_KEY=sk-your-openai-key
SENTRY_DSN=https://your-sentry-dsn
```

### Deployment Documentation

- 📖 **[Complete Guide](docs/DEPLOY_GOOGLE_CLOUD.md)** - Detailed deployment instructions
- ⚡ **[Quick Start](docs/QUICKSTART_GOOGLE_CLOUD.md)** - Fast deployment steps
- 🐳 **[Docker Guide](DOCKER_README.md)** - Docker deployment and testing

### Key Features for Cloud Deployment

✅ **Multi-stage Docker build** - Optimized image size (~400MB)  
✅ **Port 8080 support** - Google Cloud default port  
✅ **Health checks** - Automated monitoring at `/api/health`  
✅ **Environment variables** - Secure configuration management  
✅ **Cloud Build integration** - Automated CI/CD with `cloudbuild.yaml`  
✅ **Production ready** - Security headers, rate limiting, error tracking

### Test Locally with Docker

```bash
# Build the Docker image
docker build -t gnb-transfer .

# Run locally
docker run -p 8080:8080 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  gnb-transfer

# Test the application
curl http://localhost:8080/api/health
open http://localhost:8080
```

### Cost Estimation

**Google Cloud Run** (recommended for production):
- Free tier: 2M requests/month, 360K GB-seconds
- Typical cost: $10-50/month for moderate traffic
- Auto-scaling: 0-100+ instances based on demand

See [deployment documentation](docs/DEPLOY_GOOGLE_CLOUD.md) for detailed pricing and optimization tips.

---

Bu adımla, projenin en temel ve kritik sorunlarını çözmüş, eksik dosyalarını tamaml