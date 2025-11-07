/**
 * User routes - authentication and user management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import {
  validateUserRegistration,
  validateUserLogin,
  validateMongoId,
} from '../validators/index.mjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * @route   POST /api/users/register
 * @desc    Register a new user account
 * @access  Public
 * @body    {string} name - User's full name (2-100 characters)
 * @body    {string} email - Valid email address
 * @body    {string} password - Password (min 6 chars, must contain uppercase, lowercase, and number)
 * @returns {object} - JWT token and user details (without password)
 *
 * Security measures:
 * - Rate limited to 5 requests per 15 minutes
 * - Password is hashed with bcrypt before storage (see User model)
 * - Default role is 'user' to prevent privilege escalation
 * - JWT token expires in 7 days
 * - Email uniqueness is enforced at database level
 */
router.post('/register', strictRateLimiter, validateUserRegistration, async (req, res) => {
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
      role: 'user', // Always default to 'user' role for security
    });
    await user.save();

    // Generate JWT token
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.apiError('Server configuration error', 500);
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.apiSuccess(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} password - User's password
 * @returns {object} - JWT token and user details (without password)
 *
 * Security measures:
 * - Rate limited to 5 requests per 15 minutes
 * - Password verified using bcrypt compare (see User.comparePassword method)
 * - JWT token expires in 7 days
 * - Generic error message on invalid credentials (security best practice)
 */
router.post('/login', strictRateLimiter, validateUserLogin, async (req, res) => {
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
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.apiError('Server configuration error', 500);
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.apiSuccess(
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current authenticated user's profile
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @returns {object} - User profile (without password)
 *
 * Security:
 * - Requires valid JWT token in Authorization header
 * - Password field is excluded from response
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
        role: user.role,
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    return res.apiError(`Failed to retrieve profile: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (limited to 100)
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @returns {array} - Array of user objects (passwords excluded)
 *
 * Security:
 * - Requires admin role
 * - Limited to 100 results to prevent memory issues
 */
router.get('/', requireAuth(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    return res.apiSuccess(users, 'Users retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to retrieve users: ${error.message}`, 500);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user by ID
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @param   {string} id - MongoDB ObjectId of the user to delete
 * @returns {null} - Success message on deletion
 *
 * Security:
 * - Requires admin role
 * - Rate limited to 5 requests per 15 minutes
 * - Validates MongoDB ObjectId format
 */
router.delete(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  strictRateLimiter,
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.apiError('User not found', 404);
      }

      return res.apiSuccess(null, 'User deleted successfully');
    } catch (error) {
      return res.apiError(`Failed to delete user: ${error.message}`, 500);
    }
  }
);

export default router;
