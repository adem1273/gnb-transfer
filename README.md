# GNB Transfer Web Sitesi

Bu proje, **GNB Transfer** için hazırlanmış, modern bir MERN (MongoDB, Express, React, Node.js) yığını kullanarak geliştirilmiş profesyonel bir web sitesidir. Hem kullanıcı arayüzü hem de admin paneli, merkezi durum yönetimi ve güvenli kimlik doğrulama mekanizmalarıyla güçlendirilmiştir.

---

## 🚀 Özellikler
- **Tam Yığın Geliştirme:** React (Vite + Tailwind) ön yüz ve Express.js arka yüz.
- **Güvenlik:** JWT tabanlı kimlik doğrulama, bcrypt ile şifre hash'leme ve admin yetkisi kontrolü.
- **Admin Paneli:** Kullanıcı, tur, rezervasyon yönetimi ve yapay zeka destekli basit raporlama modülleri.
- **Veritabanı:** MongoDB, Mongoose ORM ile entegrasyon.
- **Modern Tasarım:** Tailwind CSS ile tamamen mobil uyumlu ve duyarlı tasarım.
- **Ödeme Entegrasyonu:** Stripe için temel ödeme akışı.

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

**Note:** All API endpoints are available with `/api/v1` prefix. Legacy `/api` endpoints are also supported for backward compatibility.

For detailed security documentation, see `backend/SECURITY_API_DOCS.md`

### Required Environment Variables

```bash
# Backend (.env in backend/)
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGINS=https://your-frontend-domain.com
MONGO_URI=your_mongodb_connection_string
```

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