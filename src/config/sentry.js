/**
 * Sentry Error Tracking for Frontend
 * 
 * This module initializes Sentry for the React frontend application.
 * It captures JavaScript errors, React component errors, and tracks user interactions.
 * 
 * Environment Separation:
 * - Development: Errors logged to console only (Sentry disabled)
 * - Production: Errors sent to Sentry for monitoring
 * 
 * @module config/sentry
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for frontend error tracking
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  
  // Only enable Sentry if DSN is provided and we're not in development
  if (!sentryDsn || environment === 'development') {
    console.info('Sentry is disabled', { 
      reason: !sentryDsn ? 'No VITE_SENTRY_DSN provided' : 'Development environment',
      environment 
    });
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in staging
      
      // Session Replay (optional - captures user sessions)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Integrations
      integrations: [
        new Sentry.BrowserTracing({
          // Track navigation changes
          tracePropagationTargets: [
            'localhost',
            /^\//,
            import.meta.env.VITE_API_URL || 'http://localhost:5000'
          ],
        }),
        new Sentry.Replay({
          maskAllText: true, // Mask sensitive text
          blockAllMedia: true, // Block media from replays
        }),
      ],
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out certain errors
        const error = hint.originalException;
        if (error && error.message) {
          const message = error.message.toLowerCase();
          
          // Don't send network errors to Sentry (they're usually temporary)
          if (message.includes('network') || 
              message.includes('failed to fetch') ||
              message.includes('load failed')) {
            return null;
          }
          
          // Don't send validation errors
          if (message.includes('validation') || message.includes('invalid')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Debug mode
      debug: environment !== 'production',
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Facebook errors
        'fb_xd_fragment',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
      ],
      
      // Deny URLs (don't capture errors from these domains)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        // Other third-party scripts
        /graph\.facebook\.com/i,
      ],
    });

    console.info('Sentry initialized successfully', {
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Exception captured:', error, context);
  }
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (error, warning, info, debug)
 * @param {object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console[level](message, context);
  }
}

/**
 * Set user context for error tracking
 * @param {object} user - User information
 */
export function setUser(user) {
  if (import.meta.env.VITE_SENTRY_DSN && user) {
    Sentry.setUser({
      id: user._id || user.id,
      email: user.email,
      username: user.name,
    });
  }
}

/**
 * Clear user context
 */
export function clearUser() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {object} data - Additional data
 */
export function addBreadcrumb(message, data = {}) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    });
  }
}

/**
 * ErrorBoundary component for React
 * Wrap your app with this to catch React component errors
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry for direct use if needed
export { Sentry };

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  ErrorBoundary,
};
