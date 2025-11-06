/**
 * Booking routes - basic implementations with standardized responses
 */

import express from 'express';
import Booking from '../models/Booking.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * GET /api/bookings - Get all bookings (requires authentication)
 */
router.get('/', requireAuth(), async (req, res) => {
  try {
    const bookings = await Booking.find().limit(100).populate('user tour');
    return res.apiSuccess(bookings, 'Bookings retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve bookings: ' + error.message, 500);
  }
});

/**
 * POST /api/bookings - Create a new booking
 */
router.post('/', async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    return res.apiSuccess(booking, 'Booking created successfully');
  } catch (error) {
    return res.apiError('Failed to create booking: ' + error.message, 500);
  }
});

export default router;

