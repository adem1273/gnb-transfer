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

Bu adımla, projenin en temel ve kritik sorunlarını çözmüş, eksik dosyalarını tamaml