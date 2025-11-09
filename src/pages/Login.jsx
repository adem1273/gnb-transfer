import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { useTranslation } from 'react-i18next'; // <-- Yeni import

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation(); // <-- useTranslation hook'unu kullan

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(t('messages.allFieldsRequired'));
      return;
    }

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(t('messages.invalidCredentials'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{t('header.login')}</h2>
      <ErrorMessage message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder={t('forms.email')}
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder={t('forms.password')}
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {t('header.login')}
        </button>
      </form>
      <div className="mt-4 text-center space-y-2">
        <Link
          to="/forgot-password"
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          {t('auth.forgotPassword')}
        </Link>
        <div>
          <span className="text-gray-600 text-sm">{t('auth.noAccount')} </span>
          <Link to="/register" className="text-blue-600 hover:text-blue-700 text-sm">
            {t('auth.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;