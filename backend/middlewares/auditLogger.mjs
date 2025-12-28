import AdminLog from '../models/AdminLog.mjs';
import logger from '../config/logger.mjs';

/**
 * Admin Logger Middleware
 * 
 * Automatically logs admin and super admin actions for audit trail
 * 
 * Features:
 * - Logs user, action, IP, endpoint, method
 * - Extracts real IP from proxy headers (X-Forwarded-For)
 * - Non-blocking: doesn't fail request if logging fails
 */

/**
 * Sanitize request data before logging to prevent exposing sensitive information
 * 
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
    'cvv',
  ];

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Get client IP address from request
 * Handles proxy headers (X-Forwarded-For) correctly
 * 
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  // Check X-Forwarded-For header first (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Fall back to direct connection IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Create audit log middleware factory
 * 
 * @param {string} action - Action type (e.g., 'SYSTEM_SETTINGS_UPDATE')
 * @param {string} targetType - Target type (e.g., 'SystemSettings')
 * @returns {Function} - Express middleware
 * 
 * @example
 * router.post('/kill-switch', 
 *   requireAuth(),
 *   requireSuperAdmin,
 *   logAdminAction('KILL_SWITCH_ACTIVATED', 'SystemSettings'),
 *   controller
 * );
 */
export const logAdminAction = (action, targetType = 'System') => {
  return async (req, res, next) => {
    // Only log if user is authenticated
    if (!req.user) {
      return next();
    }

    try {
      const logEntry = {
        action,
        user: {
          id: req.user.id,
          email: req.user.email || 'unknown',
          name: req.user.name || 'unknown',
          role: req.user.role || 'unknown',
        },
        target: {
          type: targetType,
          id: req.params.id || null,
          name: req.body?.name || req.params.id || 'N/A',
        },
        metadata: {
          // Filter out sensitive fields from body
          body: sanitizeLogData(req.body),
          params: req.params,
          query: req.query,
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        endpoint: req.originalUrl || req.url,
        method: req.method,
      };

      // Create log entry asynchronously (don't block the request)
      await AdminLog.create(logEntry);
      
      logger.info(`Admin action logged: ${action} by ${req.user.email} (${req.user.role})`, {
        action,
        userId: req.user.id,
        endpoint: logEntry.endpoint,
      });
    } catch (error) {
      // Log error but don't fail the request
      logger.error('Failed to create admin log entry:', error);
    }

    next();
  };
};

/**
 * Middleware to log super admin actions specifically
 * Shorthand for logAdminAction with SUPER_ADMIN_ACTION type
 * 
 * @param {string} targetType - Target type
 * @returns {Function} - Express middleware
 */
export const logSuperAdminAction = (targetType = 'System') => {
  return logAdminAction('SUPER_ADMIN_ACTION', targetType);
};

/**
 * Middleware to capture response and add to audit log
 * Must be used AFTER the main handler
 * 
 * This is optional and can be used for sensitive operations
 * where you need to log the outcome of the action
 */
export const logActionOutcome = () => {
  return (req, res, next) => {
    // Capture original res.json
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Only log if there's a user and the action succeeded
      if (req.user && data.success) {
        logger.info(`Action completed successfully by ${req.user.email}`, {
          endpoint: req.originalUrl,
          method: req.method,
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

export default {
  logAdminAction,
  logSuperAdminAction,
  logActionOutcome,
};
