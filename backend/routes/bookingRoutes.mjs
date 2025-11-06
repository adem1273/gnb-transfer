import express from 'express';
import Booking from '../models/Booking.mjs';
import { authMiddleware } from '../middlewares/auth.mjs';

const router = express.Router();

// GET /api/bookings - Get all bookings (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('tour', 'title price location');
    res.apiSuccess(bookings, 'Bookings retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve bookings', 500);
  }
});

// GET /api/bookings/:id - Get booking by ID (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('tour', 'title price location');
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }
    res.apiSuccess(booking, 'Booking retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve booking', 500);
  }
});

// POST /api/bookings - Create new booking (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.apiSuccess(booking, 'Booking created successfully');
  } catch (error) {
    res.apiError('Failed to create booking', 500);
  }
});

export default router;
