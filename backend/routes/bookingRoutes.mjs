import express from 'express';
import Booking from '../models/Booking.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().limit(100).populate('user tour');
    return res.apiSuccess(bookings, 'Bookings retrieved');
  } catch (err) {
    return res.apiError(err.message);
/**
 * Booking routes - basic implementations with standardized responses
 */

import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * GET /api/bookings - Get all bookings (requires authentication)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // Basic implementation - returns empty array
    // In production, this would query the database
    return res.apiSuccess([], 'Bookings retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve bookings', 500);
  }
});

export default router;
