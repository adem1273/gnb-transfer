/**
 * API Documentation Routes
 *
 * @module routes/docsRoutes
 * @description Provides API documentation endpoint
 */

import express from 'express';

const router = express.Router();

const apiDocs = {
  info: { title: 'GNB Transfer API', version: '1.1.0' },
  endpoints: [
    { method: 'POST', path: '/auth/refresh', desc: 'Refresh token' },
    { method: 'POST', path: '/users/register', desc: 'Register user' },
    { method: 'POST', path: '/users/login', desc: 'Login' },
    { method: 'GET', path: '/tours', desc: 'List tours' },
    { method: 'POST', path: '/bookings', desc: 'Create booking' },
    { method: 'POST', path: '/coupons/validate', desc: 'Validate coupon' },
    { method: 'GET', path: '/health', desc: 'Health check' },
  ],
};

router.get('/', (req, res) => res.json(apiDocs));

export default router;
