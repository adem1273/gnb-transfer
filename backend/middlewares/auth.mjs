import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.mjs';

/**
 * Authentication & authorization middleware
 *
 * @module middlewares/auth
 * @description Provides JWT token verification and role-based access control
 *
 * Security features:
 * - Verifies JWT tokens using RS256 or HS256 algorithm
 * - Enforces role-based access control
 * - Returns appropriate HTTP status codes (401 for auth, 403 for authorization)
 * - Uses centralized JWT_SECRET from env module
 *
 * Exports:
 * - requireAuth(roles = []) -> middleware for route protection
 * - requireRole(...roles) -> middleware generator for specific roles
 * - requireAdmin -> shorthand for admin-only routes
 */

/**
 * Middleware to require authentication and optionally check user roles
 *
 * @param {string[]} [roles=[]] - Array of allowed roles (e.g., ['admin', 'user'])
 * @returns {Function} Express middleware function
 *
 * @example
 * // Allow any authenticated user
 * router.get('/profile', requireAuth(), handler);
 *
 * @example
 * // Allow only admin users
 * router.get('/admin/users', requireAuth(['admin']), handler);
 *
 * @example
 * // Allow admin or driver users
 * router.get('/dashboard', requireAuth(['admin', 'driver']), handler);
 *
 * Security:
 * - Expects Authorization header: "Bearer <token>"
 * - Returns 401 if token is missing, invalid, or expired
 * - Returns 403 if user role is not in allowed roles
 * - Returns 500 if JWT_SECRET is not configured (server misconfiguration)
 */
export const requireAuth =
  (roles = []) =>
  (req, res, next) => {
    let jwtSecret;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      console.error('Server misconfiguration:', error.message);
      return res.apiError('Server misconfiguration: authentication secret not configured', 500);
    }

    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.apiError('No token provided', 401);
    }

    const token = authHeader.slice(7); // remove 'Bearer '
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload;
      if (Array.isArray(roles) && roles.length > 0 && !roles.includes(payload.role)) {
        return res.apiError('Insufficient permissions', 403);
      }
      return next();
    } catch (err) {
      if (err && err.name === 'TokenExpiredError') {
        return res.apiError('Token expired', 401);
      }
      return res.apiError('Invalid token', 401);
    }
  };

/**
 * Middleware to require specific user roles (used after authentication)
 *
 * @param {...string} roles - Allowed roles as rest parameters
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/dashboard', requireAuth(), requireRole('admin', 'driver'), handler);
 *
 * Note: This middleware expects req.user to be set by previous middleware (requireAuth)
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }
    if (!roles.length) return next();
    if (!roles.includes(req.user.role)) {
      return res.apiError('Insufficient permissions', 403);
    }
    return next();
  };

/**
 * Shorthand middleware for admin-only routes
 *
 * @example
 * router.delete('/users/:id', requireAuth(), requireAdmin, handler);
 */
export const requireAdmin = requireRole('admin');

/**
 * Optional authentication middleware - sets req.user if valid token exists
 * Does not reject requests without tokens
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Route accessible to both authenticated and non-authenticated users
 * router.get('/tours', optionalAuth, handler);
 */
export const optionalAuth = (req, res, next) => {
  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (error) {
    // In development without JWT_SECRET, continue without auth
    return next();
  }

  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
  } catch (err) {
    // Token invalid/expired, but continue without user
  }
  return next();
};

export default {
  requireAuth,
  requireRole,
  requireAdmin,
  optionalAuth,
};
