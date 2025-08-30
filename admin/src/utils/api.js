import axios from 'axios';

const API = axios.create({
  baseURL: 'https://your-backend-domain.com/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
