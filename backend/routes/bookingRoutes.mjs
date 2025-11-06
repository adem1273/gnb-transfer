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
    return res.apiError(error.message || 'Failed to retrieve bookings', 500);
  }
});

export default router;

