/**
 * Referral Routes
 * 
 * @module routes/referralRoutes
 * @description Referral program management endpoints
 */

import express from 'express';
import Referral from '../models/Referral.mjs';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * Generate a unique referral code
 */
const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * @route   GET /api/referrals
 * @desc    Get all referrals
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const referrals = await Referral.find()
      .populate('referrer', 'name email')
      .populate('referredUsers.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Referral.countDocuments();

    return res.apiSuccess({
      referrals,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return res.apiError('Failed to fetch referrals', 500);
  }
});

/**
 * @route   GET /api/referrals/my
 * @desc    Get current user's referral data
 * @access  Private (authenticated users)
 */
router.get('/my', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrer: req.user.id })
      .populate('referredUsers.user', 'name email');

    if (!referral) {
      // Create referral for user if doesn't exist
      let referralCode;
      let isUnique = false;

      // Generate unique code
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existing = await Referral.findOne({ referralCode });
        if (!existing) isUnique = true;
      }

      referral = await Referral.create({
        referrer: req.user.id,
        referralCode,
        active: true
      });

      referral = await referral.populate('referrer', 'name email');
    }

    return res.apiSuccess(referral);
  } catch (error) {
    console.error('Error fetching user referral:', error);
    return res.apiError('Failed to fetch referral data', 500);
  }
});

/**
 * @route   POST /api/referrals/register
 * @desc    Register a new user with a referral code
 * @access  Public (called during registration)
 */
router.post('/register', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;

    if (!referralCode || !userId) {
      return res.apiError('Referral code and user ID are required', 400);
    }

    const referral = await Referral.findOne({ referralCode: referralCode.toUpperCase() });

    if (!referral) {
      return res.apiError('Invalid referral code', 404);
    }

    if (!referral.active) {
      return res.apiError('Referral program is not active', 400);
    }

    // Check if referrer is trying to refer themselves
    if (referral.referrer.toString() === userId) {
      return res.apiError('You cannot refer yourself', 400);
    }

    // Add referral
    const result = referral.addReferral(userId);

    if (!result.success) {
      return res.apiError(result.message, 400);
    }

    await referral.save();

    return res.apiSuccess(
      {
        referralCode: referral.referralCode,
        rewardType: referral.rewardType,
        rewardValue: referral.rewardValue
      },
      'Referral registered successfully'
    );
  } catch (error) {
    console.error('Error registering referral:', error);
    return res.apiError('Failed to register referral', 500);
  }
});

/**
 * @route   POST /api/referrals/complete-booking
 * @desc    Mark referral as successful when referred user completes first booking
 * @access  Private (used internally by booking system)
 */
router.post('/complete-booking', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.apiError('User ID is required', 400);
    }

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.apiError('Invalid user ID format', 400);
    }

    // Find referral where this user was referred
    const referral = await Referral.findOne({ 'referredUsers.user': userId });

    if (!referral) {
      // User was not referred, that's okay
      return res.apiSuccess({ referred: false }, 'User was not referred');
    }

    const result = await referral.markReferralSuccessful(userId);

    if (!result.success) {
      return res.apiError(result.message, 400);
    }

    await referral.save();

    return res.apiSuccess(
      {
        referred: true,
        rewardType: referral.rewardType,
        rewardValue: referral.rewardValue
      },
      'Referral marked as successful'
    );
  } catch (error) {
    console.error('Error completing referral booking:', error);
    return res.apiError('Failed to complete referral booking', 500);
  }
});

/**
 * @route   POST /api/referrals/claim-reward
 * @desc    Claim referral reward
 * @access  Private (authenticated users)
 */
router.post('/claim-reward', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const { referredUserId } = req.body;

    if (!referredUserId) {
      return res.apiError('Referred user ID is required', 400);
    }

    const referral = await Referral.findOne({ referrer: req.user.id });

    if (!referral) {
      return res.apiError('Referral not found', 404);
    }

    const result = referral.claimReward(referredUserId);

    if (!result.success) {
      return res.apiError(result.message, 400);
    }

    await referral.save();

    return res.apiSuccess(
      {
        rewardType: result.rewardType,
        rewardValue: result.rewardValue,
        totalRewards: referral.totalRewards
      },
      'Reward claimed successfully'
    );
  } catch (error) {
    console.error('Error claiming reward:', error);
    return res.apiError('Failed to claim reward', 500);
  }
});

/**
 * @route   GET /api/referrals/stats
 * @desc    Get referral program statistics
 * @access  Private (admin, manager)
 */
router.get('/stats', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    
    const stats = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferrers: { $sum: 1 },
          totalReferredUsers: { $sum: '$totalReferrals' },
          totalSuccessful: { $sum: '$successfulReferrals' },
          totalRewardsGiven: { $sum: '$totalRewards' }
        }
      }
    ]);

    const topReferrers = await Referral.find()
      .sort({ successfulReferrals: -1 })
      .limit(10)
      .populate('referrer', 'name email');

    return res.apiSuccess({
      overview: stats.length > 0 ? stats[0] : {
        totalReferrers: 0,
        totalReferredUsers: 0,
        totalSuccessful: 0,
        totalRewardsGiven: 0
      },
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer,
        code: r.referralCode,
        totalReferrals: r.totalReferrals,
        successfulReferrals: r.successfulReferrals,
        totalRewards: r.totalRewards
      }))
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return res.apiError('Failed to fetch referral statistics', 500);
  }
});

/**
 * @route   PATCH /api/referrals/:id
 * @desc    Update referral settings
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const { rewardType, rewardValue, active } = req.body;

    const updates = {};
    if (rewardType) updates.rewardType = rewardType;
    if (rewardValue !== undefined) updates.rewardValue = rewardValue;
    if (active !== undefined) updates.active = active;

    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('referrer', 'name email');

    if (!referral) {
      return res.apiError('Referral not found', 404);
    }

    return res.apiSuccess(referral, 'Referral updated successfully');
  } catch (error) {
    console.error('Error updating referral:', error);
    return res.apiError('Failed to update referral', 500);
  }
});

export default router;
