/**
 * Coupon Routes
 * 
 * @module routes/couponRoutes
 * @description Coupon management and validation endpoints
 */

import express from 'express';
import Coupon from '../models/Coupon.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (active !== undefined) filter.active = active === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .populate('applicableTours', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Coupon.countDocuments(filter);

    return res.apiSuccess({
      coupons,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.apiError('Failed to fetch coupons', 500);
  }
});

/**
 * @route   GET /api/coupons/:id
 * @desc    Get coupon by ID
 * @access  Private (admin, manager)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applicableTours', 'title price');

    if (!coupon) {
      return res.apiError('Coupon not found', 404);
    }

    return res.apiSuccess(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return res.apiError('Failed to fetch coupon', 500);
  }
});

/**
 * @route   POST /api/coupons
 * @desc    Create new coupon
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validUntil,
      active,
      applicableTours
    } = req.body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined || !validUntil) {
      return res.apiError('Missing required fields', 400);
    }

    // Check if coupon code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.apiError('Coupon code already exists', 400);
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.apiError('Percentage discount must be between 0 and 100', 400);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description: description || '',
      discountType,
      discountValue,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit: usageLimit || null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: new Date(validUntil),
      active: active !== undefined ? active : true,
      applicableTours: applicableTours || [],
      createdBy: req.user.id
    });

    return res.apiSuccess(coupon, 'Coupon created successfully');
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.apiError(error.message || 'Failed to create coupon', 500);
  }
});

/**
 * @route   PATCH /api/coupons/:id
 * @desc    Update coupon
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'code',
      'description',
      'discountType',
      'discountValue',
      'minPurchaseAmount',
      'maxDiscountAmount',
      'usageLimit',
      'validFrom',
      'validUntil',
      'active',
      'applicableTours'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Uppercase code if provided
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('applicableTours', 'title');

    if (!coupon) {
      return res.apiError('Coupon not found', 404);
    }

    return res.apiSuccess(coupon, 'Coupon updated successfully');
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.apiError(error.message || 'Failed to update coupon', 500);
  }
});

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete coupon
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.apiError('Coupon not found', 404);
    }

    return res.apiSuccess(null, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.apiError('Failed to delete coupon', 500);
  }
});

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate coupon code for a booking
 * @access  Public (but should be called during checkout)
 */
router.post('/validate', async (req, res) => {
  try {
    const { code, bookingAmount, tourId } = req.body;

    if (!code || !bookingAmount) {
      return res.apiError('Code and booking amount are required', 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.apiError('Invalid coupon code', 404);
    }

    // Check if coupon can be applied
    const validation = coupon.canApply(bookingAmount, tourId);

    if (!validation.valid) {
      return res.apiError(validation.reason, 400);
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(bookingAmount);
    const finalAmount = bookingAmount - discountAmount;

    return res.apiSuccess({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.apiError('Failed to validate coupon', 500);
  }
});

/**
 * @route   POST /api/coupons/:id/apply
 * @desc    Apply coupon (increment usage count)
 * @access  Private (used internally by booking system)
 */
router.post('/:id/apply', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.apiError('Coupon not found', 404);
    }

    if (!coupon.isValid) {
      return res.apiError('Coupon is not valid or has expired', 400);
    }

    // Increment usage count
    coupon.usageCount += 1;
    await coupon.save();

    return res.apiSuccess({ usageCount: coupon.usageCount }, 'Coupon applied successfully');
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.apiError('Failed to apply coupon', 500);
  }
});

export default router;
