/**
 * Pricing Routes
 *
 * @module routes/pricingRoutes
 * @description Endpoints for price calculation
 */

import express from 'express';
import { calculatePrice, VALID_VEHICLE_TYPES } from '../services/pricingService.mjs';

export const pricingRouter = express.Router();

/**
 * @route   POST /api/pricing/calc
 * @desc    Calculate transfer price based on distance, vehicle type, and time
 * @access  Public
 */
pricingRouter.post('/calc', (req, res) => {
  try {
    const { distanceMeters, vehicleType, date } = req.body;

    // Validate distanceMeters
    if (distanceMeters === undefined || distanceMeters === null) {
      return res.status(400).json({
        success: false,
        error: 'distanceMeters is required',
      });
    }

    const distance = Number(distanceMeters);
    if (isNaN(distance) || distance < 0) {
      return res.status(400).json({
        success: false,
        error: 'distanceMeters must be a non-negative number',
      });
    }

    // Validate vehicleType if provided
    if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid vehicleType. Must be one of: ${VALID_VEHICLE_TYPES.join(', ')}`,
      });
    }

    const out = calculatePrice({ distanceMeters: distance, vehicleType, pickupDate: date });
    res.json(out);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate price',
    });
  }
});
