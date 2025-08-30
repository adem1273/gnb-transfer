export const isLoggedIn = () => {
  const token = localStorage.getItem('adminToken');
  return token ? true : false;
};

export const login = (token) => {
  localStorage.setItem('adminToken', token);
};

export const logout = () => {
  localStorage.removeItem('adminToken');
};
