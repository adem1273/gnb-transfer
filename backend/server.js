// Ana backend dosyası (Express + MongoDB + Routes)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Veritabanı bağlantısı dosyasını içe aktar
const connectDB = require('./config/database');

// Rota dosyalarını içe aktar
const userRoutes = require('./routes/userRoutes');
const tourRoutes = require('./routes/tourRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./ai/aiRoutes');
const blogRoutes = require('./routes/blogRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());

// Rotaları kullan
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/reviews', reviewRoutes);

// Test rotası
app.get('/api/status', (req, res) => res.json({ message: 'API çalışıyor ✅' }));

// MongoDB'ye bağlan
connectDB();

// ----------------------------
// React frontend'i servis et
// ----------------------------
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
