import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { setToken, getToken, removeToken } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Token'ın süresinin dolup dolmadığını kontrol et
        if (decoded.exp * 1000 > Date.now()) {
          // Token geçerliyse kullanıcıyı ayarla
          setUser({ id: decoded.id, role: decoded.role }); // Sadece id ve rol bilgisi
        } else {
          // Süresi dolduysa token'ı ve kullanıcıyı sil
          removeToken();
          setUser(null);
        }
      } catch (error) {
        // Token çözülemezse hata varsayıp sil
        console.error('Failed to decode token:', error);
        removeToken();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/users/login', { email, password });
      setToken(res.data.token);
      const decoded = jwtDecode(res.data.token);
      setUser({ id: decoded.id, role: decoded.role });
    } catch (err) {
      console.error(err);
      throw err; // Hatanın yayılmasını sağlar
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};