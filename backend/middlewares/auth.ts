import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { ITokenPayload, AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from './response.js';

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
 * - No default/fallback secret - requires JWT_SECRET environment variable
 */

const { JWT_SECRET } = process.env;

type UserRole = 'user' | 'admin' | 'superadmin' | 'manager' | 'support' | 'driver';

/**
 * Middleware to require authentication and optionally check user roles
 *
 * @param roles - Array of allowed roles (e.g., ['admin', 'user'])
 * @returns Express middleware function
 *
 * @example
 * // Allow any authenticated user
 * router.get('/profile', requireAuth(), handler);
 *
 * @example
 * // Allow only admin users
 * router.get('/admin/users', requireAuth(['admin']), handler);
 *
 * Security:
 * - Expects Authorization header: "Bearer <token>"
 * - Returns 401 if token is missing, invalid, or expired
 * - Returns 403 if user role is not in allowed roles
 * - Returns 500 if JWT_SECRET is not configured (server misconfiguration)
 */
export const requireAuth =
  (roles: UserRole[] = []) =>
  (req: AuthenticatedRequest, res: ApiResponse, next: NextFunction): Response | void => {
    if (!JWT_SECRET) {
      console.error('Server misconfiguration: JWT_SECRET is not set.');
      return res.apiError('Server misconfiguration: authentication secret not configured', 500);
    }

    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.apiError('No token provided', 401);
    }

    const token = authHeader.slice(7); // remove 'Bearer '
    try {
      const payload = jwt.verify(token, JWT_SECRET) as ITokenPayload;
      req.user = payload;
      if (Array.isArray(roles) && roles.length > 0 && !roles.includes(payload.role as UserRole)) {
        return res.apiError('Insufficient permissions', 403);
      }
      return next();
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        return res.apiError('Token expired', 401);
      }
      return res.apiError('Invalid token', 401);
    }
  };

/**
 * Middleware to require specific user roles (used after authentication)
 *
 * @param roles - Allowed roles as rest parameters
 * @returns Express middleware function
 *
 * @example
 * router.get('/dashboard', requireAuth(), requireRole('admin', 'driver'), handler);
 *
 * Note: This middleware expects req.user to be set by previous middleware (requireAuth)
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, res: ApiResponse, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }
    if (!roles.length) return next();
    if (!roles.includes(req.user.role as UserRole)) {
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
 * @returns Express middleware function
 *
 * @example
 * // Route accessible to both authenticated and non-authenticated users
 * router.get('/tours', optionalAuth, handler);
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!JWT_SECRET) {
    return next();
  }

  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ITokenPayload;
    req.user = payload;
  } catch {
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
