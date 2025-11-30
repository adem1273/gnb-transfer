// Sentry removed for Render stability (ESM minimatch conflict)
// @sentry/node has been disabled to fix deployment issues
import logger from './logger.mjs';

/**
 * Initialize Sentry for error tracking
 * @param {import('express').Application} app - Express application
 * @returns {null} - Sentry is currently disabled
 */
export function initSentry(app) {
  logger.info('Sentry is disabled for Render deployment stability');
  return null;
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {object} context - Additional context
 */
export function captureException(error, context = {}) {
  logger.error('Exception captured:', { error: error.message, stack: error.stack, ...context });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level
 * @param {object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  logger[level](message, context);
}

// Export a stub Sentry object for backward compatibility
export default {
  captureException,
  captureMessage,
};

