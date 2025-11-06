/**
 * User routes - authentication and user management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * POST /api/users/register - Register a new user
 */
router.post('/register', strictRateLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.apiError('Name, email, and password are required', 400);
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.apiError('Email already registered', 409);
    }

    // Create new user with 'user' role by default
    // Note: Role assignment restricted to prevent privilege escalation
    const user = new User({ 
      name, 
      email, 
      password,
      role: 'user' // Always default to 'user' role for security
    });
    await user.save();

    // Generate JWT token
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
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
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
router.post('/login', strictRateLimiter, async (req, res) => {
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
 * GET /api/users/profile - Get current user profile (requires authentication)
 */
router.get('/profile', requireAuth(), async (req, res) => {
  try {
    if (!req.user) {
      return res.apiError('Not authenticated', 401);
    }
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.apiError('User not found', 404);
    }
    
    return res.apiSuccess(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    return res.apiError('Failed to retrieve profile: ' + error.message, 500);
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
    return res.apiError('Failed to retrieve users: ' + error.message, 500);
  }
});

/**
 * DELETE /api/users/:id - Delete a user (admin only)
 */
router.delete('/:id', requireAuth(['admin']), strictRateLimiter, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.apiError('User not found', 404);
    }
    
    return res.apiSuccess(null, 'User deleted successfully');
  } catch (error) {
    return res.apiError('Failed to delete user: ' + error.message, 500);
  }
});

export default router;
