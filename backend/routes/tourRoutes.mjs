/**
 * Tour routes - basic implementations with standardized responses
 */

import express from 'express';
import Tour from '../models/Tour.mjs';

const router = express.Router();

/**
 * GET /api/tours - Get all tours
 */
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find().limit(100);
    return res.apiSuccess(tours, 'Tours retrieved successfully');
  } catch (error) {
    return res.apiError('Failed to retrieve tours: ' + error.message, 500);
  }
});

export default router;

