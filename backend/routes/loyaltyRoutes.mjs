/**
 * Loyalty Points Routes
 *
 * @module routes/loyaltyRoutes
 * @description Endpoints for managing loyalty points and rewards
 */

import express from 'express';
import LoyaltyPoints from '../models/LoyaltyPoints.mjs';
import Settings from '../models/Settings.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/loyalty/my-points
 * @desc    Get current user's loyalty points
 * @access  Private
 */
router.get('/my-points', requireAuth(), async (req, res) => {
  try {
    const loyalty = await LoyaltyPoints.getOrCreateForUser(req.user.id);
    const availableRewards = loyalty.getAvailableRewards();
    const settings = await Settings.getGlobalSettings();

    return res.apiSuccess({
      totalPoints: loyalty.totalPoints,
      availablePoints: loyalty.availablePoints,
      lifetimePoints: loyalty.lifetimePoints,
      tier: loyalty.tier,
      totalRides: loyalty.totalRides,
      nextMilestone: loyalty.nextMilestone,
      availableRewards,
      settings: {
        pointsPerDollar: settings.loyalty.pointsPerDollar,
        redemptionRate: settings.loyalty.redemptionRate,
      },
    });
  } catch (error) {
    logger.error('Error fetching loyalty points:', { error: error.message });
    return res.apiError('Failed to fetch points', 500);
  }
});

/**
 * @route   GET /api/loyalty/history
 * @desc    Get user's points transaction history
 * @access  Private
 */
router.get('/history', requireAuth(), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const loyalty = await LoyaltyPoints.getOrCreateForUser(req.user.id);

    const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const endIndex = startIndex + parseInt(limit, 10);

    const transactions = loyalty.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    return res.apiSuccess({
      transactions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: loyalty.transactions.length,
        pages: Math.ceil(loyalty.transactions.length / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching loyalty history:', { error: error.message });
    return res.apiError('Failed to fetch history', 500);
  }
});

/**
 * @route   POST /api/loyalty/redeem
 * @desc    Redeem points for discount
 * @access  Private
 */
router.post('/redeem', requireAuth(), async (req, res) => {
  try {
    const { points, bookingId } = req.body;

    if (!points || points <= 0) {
      return res.apiError('Valid points amount is required', 400);
    }

    const loyalty = await LoyaltyPoints.getOrCreateForUser(req.user.id);
    const settings = await Settings.getGlobalSettings();

    if (points > loyalty.availablePoints) {
      return res.apiError('Insufficient points', 400);
    }

    // Calculate discount value
    const discountValue = points * settings.loyalty.redemptionRate;

    await loyalty.redeemPoints(points, bookingId, `Redeemed ${points} points for $${discountValue} discount`);

    return res.apiSuccess({
      redeemedPoints: points,
      discountValue,
      remainingPoints: loyalty.availablePoints,
    });
  } catch (error) {
    logger.error('Error redeeming points:', { error: error.message });
    return res.apiError(error.message || 'Failed to redeem points', 500);
  }
});

/**
 * @route   POST /api/loyalty/use-reward
 * @desc    Use an available reward
 * @access  Private
 */
router.post('/use-reward', requireAuth(), async (req, res) => {
  try {
    const { rewardId, bookingId } = req.body;

    if (!rewardId) {
      return res.apiError('rewardId is required', 400);
    }

    const loyalty = await LoyaltyPoints.getOrCreateForUser(req.user.id);

    const reward = loyalty.rewards.id(rewardId);
    if (!reward) {
      return res.apiError('Reward not found', 404);
    }

    if (!reward.earned || reward.used) {
      return res.apiError('Reward is not available', 400);
    }

    if (reward.expiresAt && reward.expiresAt < new Date()) {
      return res.apiError('Reward has expired', 400);
    }

    // Mark reward as used
    reward.used = true;
    reward.usedAt = new Date();
    reward.booking = bookingId;

    await loyalty.save();

    return res.apiSuccess({
      reward: {
        type: reward.type,
        value: reward.value,
      },
      message: 'Reward applied successfully',
    });
  } catch (error) {
    logger.error('Error using reward:', { error: error.message });
    return res.apiError('Failed to use reward', 500);
  }
});

/**
 * @route   GET /api/admin/loyalty/leaderboard
 * @desc    Get loyalty points leaderboard
 * @access  Private (admin)
 */
router.get('/leaderboard', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const leaderboard = await LoyaltyPoints.getLeaderboard(parseInt(limit, 10));

    return res.apiSuccess({ leaderboard });
  } catch (error) {
    logger.error('Error fetching leaderboard:', { error: error.message });
    return res.apiError('Failed to fetch leaderboard', 500);
  }
});

/**
 * @route   GET /api/admin/loyalty/stats
 * @desc    Get loyalty program statistics
 * @access  Private (admin)
 */
router.get('/stats', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const stats = await LoyaltyPoints.aggregate([
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          totalPointsIssued: { $sum: '$lifetimePoints' },
          totalPointsAvailable: { $sum: '$availablePoints' },
          totalRides: { $sum: '$totalRides' },
          avgPointsPerMember: { $avg: '$lifetimePoints' },
        },
      },
    ]);

    const tierDistribution = await LoyaltyPoints.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const rewardStats = await LoyaltyPoints.aggregate([
      { $unwind: '$rewards' },
      {
        $group: {
          _id: '$rewards.type',
          earned: { $sum: { $cond: ['$rewards.earned', 1, 0] } },
          used: { $sum: { $cond: ['$rewards.used', 1, 0] } },
        },
      },
    ]);

    return res.apiSuccess({
      summary: stats[0] || {
        totalMembers: 0,
        totalPointsIssued: 0,
        totalPointsAvailable: 0,
        totalRides: 0,
        avgPointsPerMember: 0,
      },
      tierDistribution,
      rewardStats,
    });
  } catch (error) {
    logger.error('Error fetching loyalty stats:', { error: error.message });
    return res.apiError('Failed to fetch stats', 500);
  }
});

/**
 * @route   POST /api/admin/loyalty/adjust
 * @desc    Manually adjust user's points (admin)
 * @access  Private (admin only)
 */
router.post('/adjust', requireAuth(['admin']), async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || points === undefined) {
      return res.apiError('userId and points are required', 400);
    }

    const loyalty = await LoyaltyPoints.getOrCreateForUser(userId);

    loyalty.transactions.push({
      type: 'adjustment',
      points,
      description: reason || `Manual adjustment by admin`,
    });

    loyalty.totalPoints += points;
    loyalty.availablePoints += points;
    if (points > 0) {
      loyalty.lifetimePoints += points;
    }
    loyalty.lastActivityAt = new Date();

    await loyalty.save();

    logger.info('Points adjusted', { userId, points, adjustedBy: req.user.id });

    return res.apiSuccess({
      newTotal: loyalty.totalPoints,
      newAvailable: loyalty.availablePoints,
    });
  } catch (error) {
    logger.error('Error adjusting points:', { error: error.message });
    return res.apiError('Failed to adjust points', 500);
  }
});

/**
 * @route   POST /api/admin/loyalty/award-bonus
 * @desc    Award bonus points to users (admin)
 * @access  Private (admin only)
 */
router.post('/award-bonus', requireAuth(['admin']), async (req, res) => {
  try {
    const { userIds, points, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !points) {
      return res.apiError('userIds array and points are required', 400);
    }

    const results = { success: 0, failed: 0 };

    for (const userId of userIds) {
      try {
        const loyalty = await LoyaltyPoints.getOrCreateForUser(userId);

        loyalty.transactions.push({
          type: 'bonus',
          points,
          description: reason || 'Bonus points',
        });

        loyalty.totalPoints += points;
        loyalty.availablePoints += points;
        loyalty.lifetimePoints += points;
        loyalty.lastActivityAt = new Date();

        await loyalty.save();
        results.success++;
      } catch (err) {
        results.failed++;
      }
    }

    return res.apiSuccess(results, `Bonus points awarded to ${results.success} users`);
  } catch (error) {
    logger.error('Error awarding bonus:', { error: error.message });
    return res.apiError('Failed to award bonus', 500);
  }
});

export default router;
