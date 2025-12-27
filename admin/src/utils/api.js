import axios from 'axios';

// API base URL from environment variable with fallback for development
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : (process.env.VITE_API_URL || 'http://localhost:5000/api');

const API = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
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

// Response interceptor for error handling and token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ message: 'Network error', code: 'NETWORK_ERROR' });
    }

    const { status, data } = error.response;
    let message = data?.error || 'An error occurred';

    if (status === 401) {
      // Token expired or invalid - clear auth state and redirect
      message = 'Session expired. Please login again.';
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    } else if (status === 403) {
      message = 'Insufficient permissions';
    } else if (status === 429) {
      message = 'Too many requests. Please wait.';
    } else if (status >= 500) {
      message = 'Server error';
    }

    return Promise.reject({ status, message, code: `HTTP_${status}` });
  }
);

export default API;
