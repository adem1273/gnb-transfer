/**
 * Sentry Error Tracking Integration
 * 
 * This module initializes Sentry for error tracking and performance monitoring.
 * Sentry captures exceptions, tracks performance, and provides detailed error reports.
 * 
 * Environment Separation:
 * - Development: Errors logged to console only
 * - Production: Errors sent to Sentry for monitoring
 * 
 * @module config/sentry
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './logger.mjs';

/**
 * Initialize Sentry for error tracking
 * @param {import('express').Application} app - Express application
 * @returns {object|null} - Sentry handlers or null if disabled
 */
export function initSentry(app) {
  const sentryDsn = process.env.SENTRY_DSN;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Only enable Sentry if DSN is provided and we're not in test mode
  if (!sentryDsn || nodeEnv === 'test') {
    logger.info('Sentry is disabled', { 
      reason: !sentryDsn ? 'No SENTRY_DSN provided' : 'Test environment',
      environment: nodeEnv 
    });
    return null;
  }

  try {
    // Initialize Sentry with comprehensive configuration
    Sentry.init({
      dsn: sentryDsn,
      environment: nodeEnv,
      
      // Performance Monitoring
      tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
      
      // Integrations
      integrations: [
        nodeProfilingIntegration(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
      ],
      
      // Error filtering - don't send certain errors to Sentry
      beforeSend(event, hint) {
        // Filter out common validation errors
        const error = hint.originalException;
        if (error && error.message) {
          const message = error.message.toLowerCase();
          
          // Don't send validation errors to Sentry
          if (message.includes('validation') || 
              message.includes('invalid') ||
              message.includes('required')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      
      // Server name
      serverName: process.env.SERVER_NAME || 'gnb-backend',
      
      // Debug mode
      debug: nodeEnv === 'development',
    });

    logger.info('Sentry initialized successfully', {
      environment: nodeEnv,
      tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
    });

    // Return Sentry handlers for Express
    return {
      requestHandler: Sentry.Handlers.requestHandler(),
      tracingHandler: Sentry.Handlers.tracingHandler(),
      errorHandler: Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          // Capture all server errors (5xx) and above
          return error.status >= 500;
        },
      }),
    };
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
    return null;
  }
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    logger.error('Exception captured:', { 
      error: error.message, 
      stack: error.stack, 
      ...context 
    });
  }
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level
 * @param {object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    logger[level](message, context);
  }
}

/**
 * Set user context for error tracking
 * @param {object} user - User information
 */
export function setUser(user) {
  if (process.env.SENTRY_DSN && user) {
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
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {object} data - Additional data
 */
export function addBreadcrumb(message, data = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    });
  }
}

// Export Sentry for direct use if needed
export { Sentry };

// Export a stub Sentry object for backward compatibility
export default {
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
};


