// auth.js - GNB Pro Final
import API from './api';

export const getToken = () => localStorage.getItem('token');

export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const setRefreshToken = (refreshToken) => {
  localStorage.setItem('refreshToken', refreshToken);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const removeRefreshToken = () => {
  localStorage.removeItem('refreshToken');
};

/**
 * Logout user and revoke refresh token on backend
 * @returns {Promise<void>}
 */
export const logout = async () => {
  const refreshToken = getRefreshToken();

  // Revoke refresh token on backend if available
  if (refreshToken) {
    try {
      await API.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    }
  }

  // Clear tokens from storage
  removeToken();
  removeRefreshToken();
};
