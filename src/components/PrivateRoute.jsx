import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

// allowedRoles prop'u ile hangi rollerin bu rotaya erişebileceğini belirtiyoruz
function PrivateRoute({ children, allowedRoles = ['admin', 'user'] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // Eğer kullanıcı giriş yapmamışsa
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Eğer kullanıcının rolü izin verilen roller arasında değilse
  if (!allowedRoles.includes(user.role)) {
    // 403 Forbidden sayfasına yönlendirebiliriz veya ana sayfaya
    return <Navigate to="/" replace />;
  }

  // Her şey yolundaysa çocuk bileşeni göster
  return children;
}

export default PrivateRoute;
