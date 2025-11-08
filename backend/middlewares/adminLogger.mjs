import AdminLog from '../models/AdminLog.mjs';

/**
 * Admin Action Logger Middleware
 *
 * @module middlewares/adminLogger
 * @description Middleware to automatically log admin CRUD operations
 *
 * Features:
 * - Logs all admin actions to database
 * - Captures user info, action type, target, and metadata
 * - Non-blocking (errors don't break the request)
 */

/**
 * Create an admin log entry
 *
 * @param {Object} params - Log parameters
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {Object} params.user - User object from req.user
 * @param {Object} params.target - Target object {type, id, name}
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} params.req - Express request object
 */
export const createAdminLog = async ({ action, user, target, metadata, req }) => {
  try {
    await AdminLog.create({
      action,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      target,
      metadata,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  } catch (error) {
    console.error('Failed to create admin log:', error);
    // Don't throw - logging failure shouldn't break the request
  }
};

/**
 * Middleware to automatically log admin actions
 * Should be used after authentication middleware
 *
 * @param {string} action - Action type
 * @param {Function} getTarget - Function to extract target info from req
 * @returns {Function} Express middleware function
 *
 * @example
 * router.delete('/users/:id',
 *   requireAuth(['admin']),
 *   logAdminAction('DELETE', (req) => ({ type: 'User', id: req.params.id })),
 *   deleteUserHandler
 * );
 */
export const logAdminAction = (action, getTarget) => async (req, res, next) => {
  try {
    // Only log if user is authenticated and is admin/manager/support
    if (!req.user || !['admin', 'manager', 'support'].includes(req.user.role)) {
      return next();
    }

    const target = typeof getTarget === 'function' ? getTarget(req) : getTarget;

    // Log after the response is sent (non-blocking)
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAdminLog({
          action,
          user: req.user,
          target,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            body: req.body,
          },
          req,
        });
      }
    });

    return next();
  } catch (error) {
    console.error('Admin logger middleware error:', error);
    return next(); // Continue even if logging fails
  }
};

export default { createAdminLog, logAdminAction };
