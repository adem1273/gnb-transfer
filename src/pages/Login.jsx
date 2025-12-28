import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import SocialLoginButtons from '../components/SocialLoginButtons';

// Zod validation schema for login form
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);

    // Validate with Zod
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      setError(t('messages.allFieldsRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(t('messages.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle social login success
  const handleSocialLoginSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  // Handle social login error
  const handleSocialLoginError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 p-6 bg-white border rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{t('header.login')}</h2>

      <ErrorMessage message={error} />

      {/* Social Login Buttons */}
      <div className="mb-6">
        <SocialLoginButtons
          onSuccess={handleSocialLoginSuccess}
          onError={handleSocialLoginError}
          disabled={isSubmitting}
        />
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">
            {t('auth.orContinueWith') || 'or continue with email'}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('forms.email')}</label>
          <input
            type="email"
            name="email"
            placeholder={t('forms.emailPlaceholder') || 'Enter your email'}
            value={form.email}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('forms.password')}
          </label>
          <input
            type="password"
            name="password"
            placeholder={t('forms.passwordPlaceholder') || 'Enter your password'}
            value={form.password}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.password && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t('common.loading') || 'Loading...'}
            </span>
          ) : (
            t('header.login')
          )}
        </button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm block">
          {t('auth.forgotPassword')}
        </Link>
        <div className="text-sm">
          <span className="text-gray-600">{t('auth.noAccount')} </span>
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
