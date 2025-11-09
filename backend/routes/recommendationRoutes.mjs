/**
 * Recommendation Routes
 * 
 * @module routes/recommendationRoutes
 * @description Smart tour recommendation endpoints
 */

import express from 'express';
import { getSmartRecommendations, getTrendingDestinations } from '../services/recommendationService.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * @route   GET /api/recommendations
 * @desc    Get smart tour recommendations
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.id || null;

    const recommendations = await getSmartRecommendations({
      limit: Math.min(parseInt(limit, 10), 50),
      userId
    });

    return res.apiSuccess({
      recommendations,
      personalized: !!userId
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.apiError('Failed to fetch recommendations', 500);
  }
});

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending destinations
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const trending = await getTrendingDestinations();

    return res.apiSuccess({ trending });
  } catch (error) {
    console.error('Error fetching trending destinations:', error);
    return res.apiError('Failed to fetch trending destinations', 500);
  }
});

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Get personalized recommendations for authenticated user
 * @access  Private
 */
router.get('/personalized', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recommendations = await getSmartRecommendations({
      limit: Math.min(parseInt(limit, 10), 50),
      userId: req.user.id
    });

    return res.apiSuccess({
      recommendations,
      personalized: true
    });
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    return res.apiError('Failed to fetch personalized recommendations', 500);
  }
});

export default router;
