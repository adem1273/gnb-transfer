export const isLoggedIn = () => {
  const token = localStorage.getItem('adminToken');
  return token ? true : false;
};

export const login = (token, refreshToken = null) => {
  localStorage.setItem('adminToken', token);
  if (refreshToken) {
    localStorage.setItem('adminRefreshToken', refreshToken);
  }
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('adminRefreshToken');
  
  // Revoke refresh token on backend if available
  if (refreshToken) {
    try {
      const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : (process.env.VITE_API_URL || 'http://localhost:5000/api');
      
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    }
  }
  
  // Clear local storage
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
};
