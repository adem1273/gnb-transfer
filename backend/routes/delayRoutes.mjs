/**
 * Delay Guarantee Routes
 */

import express from 'express';
import {
  calculateDelayGuarantee,
  getDelayMetrics,
  getDelayStats
} from '../controllers/delayController.mjs';
import { requireAuth, requireAdmin } from '../middlewares/auth.mjs';

const router = express.Router();

// Public routes (authenticated users can calculate delay for their bookings)
router.get('/calculate/:bookingId', requireAuth(), calculateDelayGuarantee);
router.get('/metrics/:bookingId', requireAuth(), getDelayMetrics);

// Admin routes
router.get('/stats', requireAuth(), requireAdmin, getDelayStats);

export default router;
