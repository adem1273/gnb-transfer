/**
 * Package Controller
 * Handles smart package recommendations using AI
 */

import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import User from '../models/User.mjs';
import { generateSmartPackage } from '../services/aiService.mjs';

/**
 * Generate smart package recommendation for a user
 * POST /api/packages/recommend
 */
export async function recommendPackage(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.apiError('User ID is required', 400);
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.apiError('User not found', 404);
    }

    // Get user's booking history
    const userBookings = await Booking.find({ user: userId })
      .populate('tour')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get available tours
    const availableTours = await Tour.find().limit(50);

    if (availableTours.length === 0) {
      return res.apiError('No tours available for recommendation', 404);
    }

    // Generate smart package using AI
    const packageRecommendation = await generateSmartPackage(
      userId,
      userBookings,
      availableTours
    );

    if (!packageRecommendation.success) {
      return res.apiError(packageRecommendation.error || 'Failed to generate package', 500);
    }

    return res.apiSuccess(packageRecommendation.package, 'Smart package generated successfully');

  } catch (error) {
    console.error('Error generating package recommendation:', error);
    return res.apiError('Failed to generate package recommendation', 500);
  }
}

/**
 * Generate package recommendation for authenticated user
 * GET /api/packages/my-recommendation
 */
export async function getMyRecommendation(req, res) {
  try {
    const userId = req.user.id; // From JWT token

    // Get user's booking history
    const userBookings = await Booking.find({ user: userId })
      .populate('tour')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get available tours
    const availableTours = await Tour.find().limit(50);

    if (availableTours.length === 0) {
      return res.apiError('No tours available for recommendation', 404);
    }

    // Generate smart package using AI
    const packageRecommendation = await generateSmartPackage(
      userId,
      userBookings,
      availableTours
    );

    if (!packageRecommendation.success) {
      return res.apiError(packageRecommendation.error || 'Failed to generate package', 500);
    }

    return res.apiSuccess(packageRecommendation.package, 'Smart package generated successfully');

  } catch (error) {
    console.error('Error generating package recommendation:', error);
    return res.apiError('Failed to generate package recommendation', 500);
  }
}

export default {
  recommendPackage,
  getMyRecommendation
};
