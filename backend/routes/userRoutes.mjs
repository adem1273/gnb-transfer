import express from 'express';
import User from '../models/User.mjs';
import { authMiddleware } from '../middlewares/auth.mjs';

const router = express.Router();

// GET /api/users - Get all users (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.apiSuccess(users, 'Users retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve users', 500);
  }
});

// GET /api/users/:id - Get user by ID (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.apiError('User not found', 404);
    }
    res.apiSuccess(user, 'User retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve user', 500);
  }
});

export default router;
