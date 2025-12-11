# GNB Transfer Web Sitesi

Bu proje, **GNB Transfer** için hazırlanmış, modern bir MERN (MongoDB, Express, React, Node.js) yığını kullanarak geliştirilmiş profesyonel bir web sitesidir. Hem kullanıcı arayüzü hem de admin paneli, merkezi durum yönetimi ve güvenli kimlik doğrulama mekanizmalarıyla güçlendirilmiştir.

---

## 🌍 Multi-Language Support / Çok Dilli Destek

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
- ✅ Header & Navigation (home, tours, booking, blog, admin)
- ✅ Authentication (login, register, password reset, social auth)
- ✅ Home Page (welcome, services, trust badges, campaigns)
- ✅ Booking System (multi-step form, passenger details, payment)
- ✅ Tours & Packages (listings, details, recommendations)
- ✅ Admin Panel (dashboard, users, bookings, analytics)
- ✅ Blog System (posts, categories, sharing)
- ✅ Reviews & Testimonials
- ✅ Live Chat & AI Assistant
- ✅ Footer & Legal Pages
- ✅ Forms & Validation Messages
- ✅ Error Messages & Notifications

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

## 📝 Blog System - 40 Sales-Oriented Posts in 9 Languages

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

## 🚀 Özellikler
- **Tam Yığın Geliştirme:** React (Vite + Tailwind) ön yüz ve Express.js arka yüz.
- **Güvenlik:** JWT tabanlı kimlik doğrulama, bcrypt ile şifre hash'leme ve admin yetkisi kontrolü.
- **Admin Paneli:** Kullanıcı, tur, rezervasyon yönetimi ve yapay zeka destekli basit raporlama modülleri.
- **Veritabanı:** MongoDB, Mongoose ORM ile entegrasyon.
- **Modern Tasarım:** Tailwind CSS ile tamamen mobil uyumlu ve duyarlı tasarım.
- **Ödeme Entegrasyonu:** Stripe için temel ödeme akışı.
- **Sosyal Giriş:** Google ve Apple ile tek tıkla giriş desteği.
- **📋 Bakanlık Uyumlu Yolcu Bilgileri:** Türkiye Ulaştırma Bakanlığı düzenlemelerine uygun yolcu adı toplama sistemi.
- **📝 Blog Sistemi:** 9 dilde 40 satış odaklı blog yazısı ile SEO uyumlu blog sistemi.

---

## 🎯 Ultimate Admin Features (12 New Features)

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

## 🏛️ Ministry-Compliant Passenger Name Collection (Bakanlık Uyumlu)

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

Bu adımla, projenin en temel ve kritik sorunlarını çözmüş, eksik dosyalarını tamaml