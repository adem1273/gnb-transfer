/**
 * Campaign Routes
 *
 * @module routes/campaignRoutes
 * @description Campaign management and application endpoints
 */

import express from 'express';
import Campaign from '../models/Campaign.mjs';
import Coupon from '../models/Coupon.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns (admin only)
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { active, type, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (active !== undefined) filter.active = active === 'true';
    if (type) filter.type = type;
    
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('applicableTours', 'title')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));
    
    const total = await Campaign.countDocuments(filter);
    
    return res.apiSuccess({
      campaigns,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch campaigns', 500);
  }
});

/**
 * @route   GET /api/campaigns/active
 * @desc    Get currently active campaigns (public - for display)
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { maxUsage: null },
        { $expr: { $lt: ['$currentUsage', '$maxUsage'] } },
      ],
    })
      .select('name description discountType discountValue startDate endDate couponCode type')
      .sort({ priority: -1 })
      .limit(10);
    
    return res.apiSuccess({ campaigns });
  } catch (error) {
    logger.error('Error fetching active campaigns:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch active campaigns', 500);
  }
});

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Private (admin, manager)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('applicableTours', 'title price');
    
    if (!campaign) {
      return res.apiError('Campaign not found', 404);
    }
    
    return res.apiSuccess(campaign);
  } catch (error) {
    logger.error('Error fetching campaign:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch campaign', 500);
  }
});

/**
 * @route   POST /api/campaigns
 * @desc    Create new campaign
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      discountType,
      discountValue,
      seasonMultiplier,
      startDate,
      endDate,
      applicableRoutes,
      applicableTours,
      autoGenerateCoupon,
      couponCode,
      maxUsage,
      minPurchaseAmount,
      maxDiscountAmount,
      active,
      priority,
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !startDate || !endDate) {
      return res.apiError('Missing required fields', 400);
    }
    
    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.apiError('End date must be after start date', 400);
    }
    
    // Create campaign
    const campaign = await Campaign.create({
      name,
      description,
      type,
      discountType: discountType || 'percentage',
      discountValue,
      seasonMultiplier: seasonMultiplier || 1.0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicableRoutes: applicableRoutes || [],
      applicableTours: applicableTours || [],
      autoGenerateCoupon: autoGenerateCoupon || false,
      couponCode,
      maxUsage: maxUsage || null,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      active: active !== undefined ? active : true,
      priority: priority || 0,
      createdBy: req.user.id,
    });
    
    // If auto-generate coupon is enabled, also create a Coupon document
    if (campaign.autoGenerateCoupon && campaign.couponCode) {
      try {
        await Coupon.create({
          code: campaign.couponCode,
          description: `Auto-generated for campaign: ${campaign.name}`,
          discountType: campaign.discountType,
          discountValue: campaign.discountValue,
          minPurchaseAmount: campaign.minPurchaseAmount,
          maxDiscountAmount: campaign.maxDiscountAmount,
          usageLimit: campaign.maxUsage,
          validFrom: campaign.startDate,
          validUntil: campaign.endDate,
          active: campaign.active,
          applicableTours: campaign.applicableTours,
          createdBy: req.user.id,
        });
      } catch (couponError) {
        logger.warn('Failed to create associated coupon:', { error: couponError.message });
        // Don't fail the campaign creation if coupon creation fails
      }
    }
    
    return res.apiSuccess(campaign, 'Campaign created successfully');
  } catch (error) {
    logger.error('Error creating campaign:', { error: error.message, stack: error.stack });
    return res.apiError(error.message || 'Failed to create campaign', 500);
  }
});

/**
 * @route   PATCH /api/campaigns/:id
 * @desc    Update campaign
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'description',
      'type',
      'discountType',
      'discountValue',
      'seasonMultiplier',
      'startDate',
      'endDate',
      'applicableRoutes',
      'applicableTours',
      'couponCode',
      'maxUsage',
      'minPurchaseAmount',
      'maxDiscountAmount',
      'active',
      'priority',
    ];
    
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    updates.updatedBy = req.user.id;
    
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('applicableTours', 'title');
    
    if (!campaign) {
      return res.apiError('Campaign not found', 404);
    }
    
    return res.apiSuccess(campaign, 'Campaign updated successfully');
  } catch (error) {
    logger.error('Error updating campaign:', { error: error.message, stack: error.stack });
    return res.apiError(error.message || 'Failed to update campaign', 500);
  }
});

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    
    if (!campaign) {
      return res.apiError('Campaign not found', 404);
    }
    
    // Also delete associated coupon if it exists
    if (campaign.couponCode) {
      await Coupon.findOneAndDelete({ code: campaign.couponCode });
    }
    
    return res.apiSuccess(null, 'Campaign deleted successfully');
  } catch (error) {
    logger.error('Error deleting campaign:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to delete campaign', 500);
  }
});

/**
 * @route   POST /api/campaigns/check
 * @desc    Check applicable campaigns for a booking
 * @access  Public
 */
router.post('/check', async (req, res) => {
  try {
    const { origin, destination, tourId, bookingAmount, date } = req.body;
    
    if (!bookingAmount || bookingAmount <= 0) {
      return res.apiError('Valid booking amount is required', 400);
    }
    
    const campaigns = await Campaign.findApplicableCampaigns({
      origin,
      destination,
      tourId,
      bookingAmount: parseFloat(bookingAmount),
      date: date ? new Date(date) : new Date(),
    });
    
    // Calculate discounts for each campaign
    const campaignsWithDiscounts = campaigns.map((campaign) => {
      const campaignDoc = new Campaign(campaign);
      const discount = campaignDoc.calculateDiscount(parseFloat(bookingAmount));
      return {
        ...campaign,
        calculatedDiscount: discount,
        finalAmount: parseFloat(bookingAmount) - discount,
      };
    });
    
    // Sort by discount amount (highest first)
    campaignsWithDiscounts.sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);
    
    return res.apiSuccess({
      campaigns: campaignsWithDiscounts,
      bestCampaign: campaignsWithDiscounts[0] || null,
    });
  } catch (error) {
    logger.error('Error checking campaigns:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to check campaigns', 500);
  }
});

/**
 * @route   POST /api/campaigns/:id/apply
 * @desc    Apply campaign (increment usage, internal use)
 * @access  Private
 */
router.post('/:id/apply', requireAuth(), async (req, res) => {
  try {
    const { discountAmount } = req.body;
    
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.apiError('Campaign not found', 404);
    }
    
    if (!campaign.isValid) {
      return res.apiError('Campaign is not valid or has expired', 400);
    }
    
    await campaign.apply(discountAmount || 0);
    
    return res.apiSuccess(
      {
        currentUsage: campaign.currentUsage,
        totalDiscount: campaign.totalDiscount,
      },
      'Campaign applied successfully'
    );
  } catch (error) {
    logger.error('Error applying campaign:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to apply campaign', 500);
  }
});

/**
 * @route   GET /api/campaigns/season/multipliers
 * @desc    Get active season multipliers
 * @access  Public
 */
router.get('/season/multipliers', async (req, res) => {
  try {
    const now = new Date();
    const multipliers = await Campaign.find({
      active: true,
      type: 'seasonal_multiplier',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .select('name seasonMultiplier startDate endDate')
      .sort({ priority: -1 });
    
    // Return the highest priority multiplier
    const activeMultiplier = multipliers[0] || { seasonMultiplier: 1.0 };
    
    return res.apiSuccess({
      multiplier: activeMultiplier.seasonMultiplier || 1.0,
      campaign: multipliers[0] || null,
      allMultipliers: multipliers,
    });
  } catch (error) {
    logger.error('Error fetching season multipliers:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch season multipliers', 500);
  }
});

export default router;
