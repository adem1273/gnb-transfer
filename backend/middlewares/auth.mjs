import jwt from 'jsonwebtoken';

export const requireAuth = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided', data: null });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = payload;
    if (roles.length && !roles.includes(payload.role)) return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token', data: null });
  }
};
/**
 * JWT authentication middleware
 * Verifies JWT tokens and provides role-based access control
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.apiError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Attach decoded user info to request
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.apiError('Token expired', 401);
      }
      return res.apiError('Invalid token', 401);
    }
  } catch (error) {
    return res.apiError('Authentication failed', 401);
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return res.apiError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');
