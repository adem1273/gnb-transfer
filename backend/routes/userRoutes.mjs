/**
 * User routes - authentication and user management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * POST /api/users/register - Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.apiError('Name, email, and password are required', 400);
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.apiError('Email already registered', 400);
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({ name, email, password });
    await user.save();

    return res.apiSuccess(
      { id: user._id, email: user.email, name: user.name },
      'User registered successfully',
      201
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * POST /api/users/login - Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.apiError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.apiError('Invalid credentials', 401);
    }

    // Verify password using comparePassword helper
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.apiError('Invalid credentials', 401);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.apiError('Server configuration error', 500);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.apiSuccess(
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      'Login successful'
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * GET /api/users - Get all users (admin only)
 */
router.get('/', requireAuth(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    return res.apiSuccess(users, 'Users retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve users', 500);
  }
});

export default router;
