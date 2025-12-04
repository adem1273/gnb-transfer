import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { useTranslation } from 'react-i18next';

// Zod validation schema for login form
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate with Zod
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
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
          className={`w-full p-2 border rounded ${fieldErrors.email ? 'border-red-500' : ''}`}
        />
        {fieldErrors.email && <p className="text-red-500 text-sm">{fieldErrors.email}</p>}
        <input
          type="password"
          name="password"
          placeholder={t('forms.password')}
          value={form.password}
          onChange={handleChange}
          className={`w-full p-2 border rounded ${fieldErrors.password ? 'border-red-500' : ''}`}
        />
        {fieldErrors.password && <p className="text-red-500 text-sm">{fieldErrors.password}</p>}
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