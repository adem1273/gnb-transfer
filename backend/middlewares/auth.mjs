import jwt from 'jsonwebtoken';

/**
 * Authentication & authorization middleware
 * - No default/fallback secret. If JWT_SECRET is not set, middleware returns 500 (server misconfiguration).
 * - Exports:
 *    requireAuth(roles = []) -> middleware
 *    requireRole(...roles) -> middleware generator
 *    requireAdmin -> shorthand
 */

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAuth = (roles = []) => (req, res, next) => {
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
    const payload = jwt.verify(token, JWT_SECRET);
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

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.apiError('Authentication required', 401);
  }
  if (!roles.length) return next();
  if (!roles.includes(req.user.role)) {
    return res.apiError('Insufficient permissions', 403);
  }
  return next();
};

export const requireAdmin = requireRole('admin');

export default {
  requireAuth,
  requireRole,
  requireAdmin,
};
