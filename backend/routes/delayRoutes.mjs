/**
 * Delay Routes
 * Routes for delay guarantee feature
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';
import {
  calculateBookingDelay,
  getDelayMetrics,
  getAllDelayMetrics
} from '../controllers/delayController.mjs';

const router = express.Router();

/**
 * POST /api/delay/calculate
 * Calculate delay risk for a booking
 * Public endpoint (can be called during booking process)
 */
router.post('/calculate', calculateBookingDelay);

/**
 * GET /api/delay/:bookingId
 * Get delay metrics for a specific booking
 */
router.get('/:bookingId', getDelayMetrics);

/**
 * GET /api/delay/all
 * Get all delay metrics (admin only)
 */
router.get('/all', requireAuth, requireAdmin, getAllDelayMetrics);

export default router;
