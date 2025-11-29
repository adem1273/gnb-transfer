/**
 * Pricing Routes
 *
 * @module routes/pricingRoutes
 * @description Endpoints for price calculation
 */

import express from 'express';
import { calculatePrice } from '../services/pricingService.mjs';

export const pricingRouter = express.Router();

/**
 * @route   POST /api/pricing/calc
 * @desc    Calculate transfer price based on distance, vehicle type, and time
 * @access  Public
 */
pricingRouter.post('/calc', (req, res) => {
  const { distanceMeters, vehicleType, date } = req.body;
  const out = calculatePrice({ distanceMeters, vehicleType, pickupDate: date });
  res.json(out);
});
