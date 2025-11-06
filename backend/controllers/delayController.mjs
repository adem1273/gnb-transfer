/**
 * Delay Controller
 * Handles delay guarantee calculations and discount generation
 */

import DelayMetrics from '../models/DelayMetrics.mjs';
import Booking from '../models/Booking.mjs';
import { calculateDelayRisk, generateDiscountCode } from '../services/aiService.mjs';

/**
 * Calculate delay risk for a booking
 * POST /api/delay/calculate
 */
export async function calculateBookingDelay(req, res) {
  try {
    const { bookingId, origin, destination } = req.body;

    if (!bookingId || !origin || !destination) {
      return res.apiError('Booking ID, origin, and destination are required', 400);
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    // Calculate delay risk using AI service
    const riskData = await calculateDelayRisk(origin, destination);

    // Generate discount code if delay > 15 minutes
    const discountCode = generateDiscountCode(riskData.estimatedDelay);

    // Save or update delay metrics
    let delayMetrics = await DelayMetrics.findOne({ booking: bookingId });
    
    if (delayMetrics) {
      // Update existing metrics
      delayMetrics.route = { origin, destination, ...riskData };
      delayMetrics.delayRiskScore = riskData.delayRiskScore;
      delayMetrics.estimatedDelay = riskData.estimatedDelay;
      delayMetrics.discountCode = discountCode;
      delayMetrics.discountApplied = !!discountCode;
      delayMetrics.calculatedAt = new Date();
      await delayMetrics.save();
    } else {
      // Create new metrics
      delayMetrics = await DelayMetrics.create({
        booking: bookingId,
        route: {
          origin,
          destination,
          distance: riskData.distance,
          estimatedDuration: riskData.estimatedDuration
        },
        delayRiskScore: riskData.delayRiskScore,
        estimatedDelay: riskData.estimatedDelay,
        discountCode,
        discountApplied: !!discountCode
      });
    }

    return res.apiSuccess({
      delayRiskScore: delayMetrics.delayRiskScore,
      estimatedDelay: delayMetrics.estimatedDelay,
      discountCode: delayMetrics.discountCode,
      route: delayMetrics.route
    }, 'Delay risk calculated successfully');

  } catch (error) {
    console.error('Error calculating delay:', error);
    return res.apiError('Failed to calculate delay risk', 500);
  }
}

/**
 * Get delay metrics for a booking
 * GET /api/delay/:bookingId
 */
export async function getDelayMetrics(req, res) {
  try {
    const { bookingId } = req.params;

    const delayMetrics = await DelayMetrics.findOne({ booking: bookingId })
      .populate('booking');

    if (!delayMetrics) {
      return res.apiError('No delay metrics found for this booking', 404);
    }

    return res.apiSuccess(delayMetrics, 'Delay metrics retrieved successfully');

  } catch (error) {
    console.error('Error fetching delay metrics:', error);
    return res.apiError('Failed to retrieve delay metrics', 500);
  }
}

/**
 * Get all delay metrics (admin only)
 * GET /api/delay/all
 */
export async function getAllDelayMetrics(req, res) {
  try {
    const delayMetrics = await DelayMetrics.find()
      .populate('booking')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.apiSuccess(delayMetrics, 'All delay metrics retrieved successfully');

  } catch (error) {
    console.error('Error fetching all delay metrics:', error);
    return res.apiError('Failed to retrieve delay metrics', 500);
  }
}

export default {
  calculateBookingDelay,
  getDelayMetrics,
  getAllDelayMetrics
};
