import jwt from 'jsonwebtoken';

/**
 * JWT verification middleware
 * Verifies JWT token from Authorization header
 */
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.apiError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.apiError('Invalid or expired token', 401);
  }
};
