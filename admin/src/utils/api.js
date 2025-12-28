import axios from 'axios';

// API base URL - standardized to /api/v1/admin
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? `${import.meta.env.VITE_API_URL}/v1/admin`
  : (process.env.VITE_API_URL 
      ? `${process.env.VITE_API_URL}/v1/admin` 
      : 'http://localhost:5000/api/v1/admin');

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global variable to access AuthContext if available
let authContextRef = null;

/**
 * Set auth context reference for token access
 */
export const setAuthContext = (authContext) => {
  authContextRef = authContext;
};

// Request interceptor - Add auth token
API.interceptors.request.use(
  (config) => {
    // Try to get token from AuthContext first, fallback to localStorage
    let token = null;
    
    if (authContextRef?.user?.token) {
      token = authContextRef.user.token;
    } else {
      token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ 
        message: 'Network connection error', 
        code: 'NETWORK_ERROR',
        originalError: error 
      });
    }

    const { status, data } = error.response;
    let message = data?.error || data?.message || 'An error occurred';

    if (status === 401) {
      message = 'Session expired. Please login again.';
      // Token expired or invalid - clear auth state and redirect
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    } else if (status === 403) {
      message = 'Insufficient permissions for this action';
    } else if (status === 429) {
      message = 'Too many requests. Please wait a moment.';
    } else if (status >= 500) {
      message = 'Server error. Please try again later.';
    }

    // Log detailed error for debugging
    console.error('Admin API Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject({ 
      status, 
      message, 
      code: `HTTP_${status}`,
      data: data,
      originalError: error 
    });
  }
);

// Helper functions for common HTTP methods
export const get = (url, config) => API.get(url, config);
export const post = (url, data, config) => API.post(url, data, config);
export const put = (url, data, config) => API.put(url, data, config);
export const patch = (url, data, config) => API.patch(url, data, config);
export const del = (url, config) => API.delete(url, config);

export default API;
