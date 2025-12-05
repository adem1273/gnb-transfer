import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Social Login Buttons Component
 *
 * Provides Google and Apple sign-in buttons with OAuth flow support.
 * The actual OAuth implementation requires backend configuration with
 * Google OAuth and Apple Sign In credentials.
 *
 * Environment variables required:
 * - VITE_GOOGLE_CLIENT_ID: Google OAuth Client ID
 * - VITE_APPLE_CLIENT_ID: Apple Sign In Client ID
 */
const SocialLoginButtons = ({ onSuccess, onError, disabled = false }) => {
  const { t } = useTranslation();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);

    try {
      // Check if Google OAuth is configured
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        // If not configured, show info message
        console.info('Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID to enable.');
        onError?.(t('auth.googleNotConfigured') || 'Google Sign-In is not configured');
        return;
      }

      // Initialize Google Sign-In
      // This uses the Google Identity Services library
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              // Send the credential to our backend for verification
              const res = await fetch('/api/users/google-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });

              const data = await res.json();

              if (data.success) {
                onSuccess?.(data.data);
              } else {
                onError?.(data.error || t('auth.googleLoginFailed') || 'Google login failed');
              }
            } catch (err) {
              onError?.(err.message || t('auth.googleLoginFailed') || 'Google login failed');
            }
          },
        });

        // Prompt the user to sign in
        window.google.accounts.id.prompt();
      } else {
        // If Google library not loaded, redirect to OAuth URL
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
        const scope = encodeURIComponent('email profile');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

        window.location.href = authUrl;
      }
    } catch (error) {
      onError?.(error.message || t('auth.googleLoginFailed') || 'Google login failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Apple Sign-In handler
  const handleAppleLogin = async () => {
    setLoadingApple(true);

    try {
      // Check if Apple Sign-In is configured
      const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;

      if (!appleClientId) {
        console.info('Apple Sign-In not configured. Set VITE_APPLE_CLIENT_ID to enable.');
        onError?.(t('auth.appleNotConfigured') || 'Apple Sign-In is not configured');
        return;
      }

      // Apple Sign-In via Apple JS SDK
      if (window.AppleID?.auth) {
        try {
          const data = await window.AppleID.auth.signIn();

          // Send the authorization to our backend
          const res = await fetch('/api/users/apple-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identityToken: data.authorization.id_token,
              authorizationCode: data.authorization.code,
              user: data.user,
            }),
          });

          const result = await res.json();

          if (result.success) {
            onSuccess?.(result.data);
          } else {
            onError?.(result.error || t('auth.appleLoginFailed') || 'Apple login failed');
          }
        } catch (err) {
          if (err.error !== 'popup_closed_by_user') {
            onError?.(err.error || t('auth.appleLoginFailed') || 'Apple login failed');
          }
        }
      } else {
        // If Apple library not loaded, redirect to OAuth URL
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/apple/callback`);
        const scope = encodeURIComponent('name email');
        const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${redirectUri}&response_type=code id_token&scope=${scope}&response_mode=form_post`;

        window.location.href = authUrl;
      }
    } catch (error) {
      onError?.(error.message || t('auth.appleLoginFailed') || 'Apple login failed');
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={disabled || loadingGoogle}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {loadingGoogle ? (
          <svg
            className="animate-spin h-5 w-5 text-gray-500"
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
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="text-gray-700 font-medium group-hover:text-gray-900">
          {t('auth.continueWithGoogle') || 'Continue with Google'}
        </span>
      </button>

      {/* Apple Sign-In Button */}
      <button
        type="button"
        onClick={handleAppleLogin}
        disabled={disabled || loadingApple}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg shadow-sm hover:bg-gray-900 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingApple ? (
          <svg
            className="animate-spin h-5 w-5 text-white"
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
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        )}
        <span className="font-medium">{t('auth.continueWithApple') || 'Continue with Apple'}</span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
