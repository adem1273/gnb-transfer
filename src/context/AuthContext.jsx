import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getToken,
  setToken,
  removeToken,
  setRefreshToken,
  removeRefreshToken,
  logout as authLogout,
} from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = getToken();
    if (token) {
      // TODO: Optionally verify token with backend or decode JWT
      // For now, just mark as authenticated
      setUser({ authenticated: true });
    }
    setLoading(false);
  }, []);

  const login = (userData, token, refreshToken) => {
    setUser(userData);
    setToken(token);
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
