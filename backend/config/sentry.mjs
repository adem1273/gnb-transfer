import * as Sentry from '@sentry/node';
import logger from './logger.mjs';

/**
 * Initialize Sentry for error tracking
 * @param {import('express').Application} app - Express application
 */
export function initSentry(app) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    logger.info('Sentry DSN not configured, skipping Sentry initialization');
    return null;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // Set sample rate for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Integrations
      integrations: [
        // Express integration
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],

      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive data from request body
        if (event.request && event.request.data) {
          if (typeof event.request.data === 'object') {
            const sanitized = { ...event.request.data };
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.apiKey;
            event.request.data = sanitized;
          }
        }
        
        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'NotFoundError',
        'ValidationError',
        'CastError',
        /jwt/i,
      ],
    });

    logger.info('Sentry initialized successfully');

    // Return Sentry handlers for Express
    return {
      requestHandler: Sentry.Handlers.requestHandler(),
      tracingHandler: Sentry.Handlers.tracingHandler(),
      errorHandler: Sentry.Handlers.errorHandler(),
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
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  logger.error('Exception captured:', { error: error.message, stack: error.stack, ...context });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level
 * @param {object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  logger[level](message, context);
}

export default Sentry;
