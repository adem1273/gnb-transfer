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

export default API;
