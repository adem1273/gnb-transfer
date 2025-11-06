import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * GET /api/users - Admin only
 */
router.get('/', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const users = await User.find().limit(100).select('-password');
    return res.apiSuccess(users, 'Users retrieved');
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * POST /api/users/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.apiError('Name, email, and password are required', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) return res.apiError('Email already registered', 400);

    const user = new User({ name, email, password });
    await user.save();

    // Optionally return token on registration:
    if (!JWT_SECRET) {
      // if secret missing, return user info but warn
      return res.apiSuccess({ id: user._id, email: user.email }, 'User registered', 201);
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.apiSuccess({ id: user._id, email: user.email, token }, 'User registered', 201);
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * POST /api/users/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.apiError('Email and password are required', 400);

    const user = await User.findOne({ email });
    if (!user) return res.apiError('Invalid credentials', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.apiError('Invalid credentials', 401);

    if (!JWT_SECRET) return res.apiError('Server misconfiguration: JWT_SECRET not set', 500);

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.apiSuccess({ token }, 'Login successful', 200);
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

export default router;
