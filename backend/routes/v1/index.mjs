/**
 * API Version 1 Routes Aggregator
 *
 * @module routes/v1/index
 * @description Aggregates all v1 API routes and provides version endpoint
 */

import express from 'express';
import userRoutes from '../userRoutes.mjs';
import tourRoutes from '../tourRoutes.mjs';
import bookingRoutes from '../bookingRoutes.mjs';
import couponRoutes from '../couponRoutes.mjs';
import authRoutes from '../authRoutes.mjs';

const router = express.Router();

// Version info endpoint
router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: 'v1',
      current: true,
      deprecated: false,
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        tours: '/api/v1/tours',
        bookings: '/api/v1/bookings',
        coupons: '/api/v1/coupons',
      },
    },
  });
});

// Mount v1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/coupons', couponRoutes);

export default router;
