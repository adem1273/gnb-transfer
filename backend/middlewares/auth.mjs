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
