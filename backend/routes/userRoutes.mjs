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
  }
});

export default router;
