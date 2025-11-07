/**
 * Package routes - AI-powered smart package recommendations
 *
 * @module routes/packageRoutes
 * @description Handles smart package creation and recommendations
 */

import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { generateSmartPackage, clearPackageCache } from '../services/aiService.mjs';

const router = express.Router();

/**
 * @route   POST /api/packages/recommend
 * @desc    Generate AI-powered package recommendation for a user
 * @access  Public (rate limited)
 * @body    {string} userId - MongoDB ObjectId of the user
 * @returns {object} Package recommendation with 15% discount
 */
router.post('/recommend', strictRateLimiter, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.apiError('User ID is required', 400);
    }

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.apiError('Invalid user ID format', 400);
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.apiError('User not found', 404);
    }

    // Get user's booking history
    const bookingHistory = await Booking.find({ user: userId })
      .populate(
        'tour',
        'title title_ar title_ru title_es title_zh title_hi title_de title_it price'
      )
      .sort({ createdAt: -1 })
      .limit(20);

    // Get available tours
    const availableTours = await Tour.find({ availableSeats: { $gt: 0 } })
      .sort({ price: -1 })
      .limit(50);

    if (availableTours.length === 0) {
      return res.apiError('No tours available at the moment', 404);
    }

    // Get user's preferred language
    const userLanguage = user.preferences?.language || 'en';

    // Generate package recommendation
    const packageRecommendation = await generateSmartPackage({
      userId,
      bookingHistory,
      availableTours,
      userLanguage,
    });

    // Log interaction
    if (user.interactionLogs) {
      user.interactionLogs.push({
        action: 'package_recommendation_viewed',
        tourId: packageRecommendation.tourId,
        timestamp: new Date(),
        metadata: {
          bundlePrice: packageRecommendation.bundlePrice,
          discount: packageRecommendation.discount,
        },
      });
      await user.save();
    }

    return res.apiSuccess(packageRecommendation, 'Smart package generated successfully', 200);
  } catch (error) {
    console.error('Package recommendation error:', error);
    return res.apiError(`Failed to generate package: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/packages/my-recommendation
 * @desc    Get package recommendation for authenticated user
 * @access  Private
 * @returns {object} Package recommendation with 15% discount
 */
router.get('/my-recommendation', requireAuth(), async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's booking history
    const bookingHistory = await Booking.find({ user: userId })
      .populate(
        'tour',
        'title title_ar title_ru title_es title_zh title_hi title_de title_it price'
      )
      .sort({ createdAt: -1 })
      .limit(20);

    // Get available tours
    const availableTours = await Tour.find({ availableSeats: { $gt: 0 } })
      .sort({ price: -1 })
      .limit(50);

    if (availableTours.length === 0) {
      return res.apiError('No tours available at the moment', 404);
    }

    // Get user's preferred language
    const user = await User.findById(userId);
    const userLanguage = user.preferences?.language || 'en';

    // Generate package recommendation
    const packageRecommendation = await generateSmartPackage({
      userId: userId.toString(),
      bookingHistory,
      availableTours,
      userLanguage,
    });

    // Log interaction
    if (user.interactionLogs) {
      user.interactionLogs.push({
        action: 'package_recommendation_viewed',
        tourId: packageRecommendation.tourId,
        timestamp: new Date(),
        metadata: {
          bundlePrice: packageRecommendation.bundlePrice,
          discount: packageRecommendation.discount,
        },
      });
      await user.save();
    }

    return res.apiSuccess(packageRecommendation, 'Smart package generated successfully', 200);
  } catch (error) {
    console.error('Package recommendation error:', error);
    return res.apiError(`Failed to generate package: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/packages/clear-cache
 * @desc    Clear package cache for a user (for testing/admin)
 * @access  Private
 * @body    {string} userId - MongoDB ObjectId of the user
 * @returns {object} Success message
 */
router.post('/clear-cache', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || req.user._id.toString();

    clearPackageCache(targetUserId);

    return res.apiSuccess({ userId: targetUserId }, 'Package cache cleared successfully', 200);
  } catch (error) {
    console.error('Clear cache error:', error);
    return res.apiError(`Failed to clear cache: ${error.message}`, 500);
  }
});

export default router;
