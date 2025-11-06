import express from 'express';
import User from '../models/User.mjs';

const router = express.Router();

// GET /api/users/
router.get('/', async (req, res) => {
  try {
    const users = await User.find().limit(100);
    return res.apiSuccess(users, 'Users retrieved');
  } catch (err) {
    return res.apiError(err.message);
  }
});

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.apiError('Missing fields', 400);
    const existing = await User.findOne({ email });
    if (existing) return res.apiError('Email already registered', 400);
    const user = new User({ name, email, password });
    await user.save();
    return res.apiSuccess({ id: user._id, email: user.email }, 'User registered');
  } catch (err) {
    return res.apiError(err.message);
/**
 * User routes - basic implementations with standardized responses
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * GET /api/users - Get all users (admin only)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Basic implementation - returns empty array
    // In production, this would query the database
    return res.apiSuccess([], 'Users retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve users', 500);
  }
});

/**
 * POST /api/users/register - Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.apiError('Name, email, and password are required', 400);
    }

    // Basic implementation - returns success message
    // In production, this would create a user in the database
    return res.apiSuccess(
      { message: 'User registration endpoint ready' },
      'Registration endpoint available',
      201
    );
  } catch (error) {
    return res.apiError('Failed to register user', 500);
  }
});

export default router;
