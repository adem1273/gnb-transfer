// api.js - GNB Pro Final
import axios from 'axios';

// API temel URL'si
const API = axios.create({
  baseURL: 'https://your-backend-domain.com/api', // Backend URL'nizi buraya ekleyin
  headers: {
    'Content-Type': 'application/json',
  },
});

// Eğer auth token gerekiyorsa her isteğe otomatik ekleyebiliriz
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Token localStorage'da saklanıyor
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for enhanced error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ message: 'Bağlantı hatası', code: 'NETWORK_ERROR' });
    }

    const { status, data } = error.response;
    let message = data?.error || 'Bir hata oluştu';

    if (status === 401) {
      message = 'Oturum süresi doldu';
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      message = 'Bu işleme yetkiniz yok';
    } else if (status === 429) {
      message = 'Çok fazla istek. Bekleyin.';
    } else if (status >= 500) {
      message = 'Sunucu hatası';
    }

    return Promise.reject({ status, message, code: `HTTP_${status}` });
  }
);

export default API;
