/**
 * Delay routes - AI-powered delay guarantee system
 *
 * @module routes/delayRoutes
 * @description Handles delay risk calculation and discount code generation
 */

import express from 'express';
import mongoose from 'mongoose';
import DelayMetrics from '../models/DelayMetrics.mjs';
import Booking from '../models/Booking.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { calculateDelayRisk, generateDiscountCode } from '../services/aiService.mjs';

const router = express.Router();

/**
 * @route   POST /api/delay/calculate
 * @desc    Calculate delay risk for a booking
 * @access  Public (rate limited)
 * @body    {string} bookingId - MongoDB ObjectId of the booking
 * @body    {string} origin - Starting point
 * @body    {string} destination - Ending point
 * @returns {object} Delay metrics with risk score and potential discount
 */
router.post('/calculate', strictRateLimiter, async (req, res) => {
  try {
    const { bookingId, origin, destination } = req.body;

    // Validate required fields
    if (!bookingId || !origin || !destination) {
      return res.apiError('Booking ID, origin, and destination are required', 400);
    }

    // Validate bookingId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.apiError('Invalid booking ID format', 400);
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    // Calculate delay risk
    const scheduledTime = booking.date || new Date();
    const delayData = await calculateDelayRisk({ origin, destination, scheduledTime });

    // Generate discount code if delay exceeds threshold
    const discountCode = generateDiscountCode(delayData.estimatedDelay);

    // Create or update delay metrics
    await DelayMetrics.findOneAndUpdate(
      { booking: bookingId },
      {
        booking: bookingId,
        route: {
          origin,
          destination,
          distance: delayData.route.distance,
          estimatedDuration: delayData.route.estimatedDuration,
        },
        delayRiskScore: delayData.delayRiskScore,
        estimatedDelay: delayData.estimatedDelay,
        discountCode,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update booking with delay guarantee info
    await Booking.findByIdAndUpdate(bookingId, {
      'aiMetadata.delayGuarantee': {
        riskScore: delayData.delayRiskScore,
        estimatedDelay: delayData.estimatedDelay,
        discountCode,
      },
    });

    return res.apiSuccess(
      {
        delayRiskScore: delayData.delayRiskScore,
        estimatedDelay: delayData.estimatedDelay,
        discountCode,
        route: delayData.route,
      },
      'Delay risk calculated successfully',
      201
    );
  } catch (error) {
    console.error('Delay calculation error:', error);
    return res.apiError(`Failed to calculate delay: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/delay/:bookingId
 * @desc    Get delay metrics for a specific booking
 * @access  Public
 * @param   {string} bookingId - MongoDB ObjectId of the booking
 * @returns {object} Delay metrics
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Validate bookingId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.apiError('Invalid booking ID format', 400);
    }

    const delayMetrics = await DelayMetrics.findOne({ booking: bookingId })
      .populate('booking', 'name email date status')
      .sort({ createdAt: -1 });

    if (!delayMetrics) {
      return res.apiError('No delay metrics found for this booking', 404);
    }

    return res.apiSuccess(delayMetrics, 'Delay metrics retrieved successfully');
  } catch (error) {
    console.error('Get delay metrics error:', error);
    return res.apiError(`Failed to retrieve delay metrics: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/delay/admin/all
 * @desc    Get all delay metrics (admin only)
 * @access  Private (admin)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 50)
 * @returns {object} Paginated delay metrics
 */
router.get('/admin/all', requireAuth(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [metrics, total] = await Promise.all([
      DelayMetrics.find()
        .populate('booking', 'name email date status amount')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      DelayMetrics.countDocuments(),
    ]);

    // Calculate statistics
    const stats = {
      totalCalculations: total,
      avgRiskScore: 0,
      highRiskCount: 0,
      discountCodesIssued: 0,
    };

    if (metrics.length > 0) {
      stats.avgRiskScore = Math.round(
        metrics.reduce((sum, m) => sum + m.delayRiskScore, 0) / metrics.length
      );
      stats.highRiskCount = metrics.filter((m) => m.delayRiskScore >= 60).length;
      stats.discountCodesIssued = metrics.filter((m) => m.discountCode).length;
    }

    return res.apiSuccess(
      {
        metrics,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'All delay metrics retrieved successfully'
    );
  } catch (error) {
    console.error('Get all delay metrics error:', error);
    return res.apiError(`Failed to retrieve delay metrics: ${error.message}`, 500);
  }
});

export default router;
