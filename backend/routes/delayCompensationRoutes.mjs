import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { requireFeatureEnabled } from '../middlewares/featureToggle.mjs';
import DelayCompensation from '../models/DelayCompensation.mjs';
import Booking from '../models/Booking.mjs';
import Coupon from '../models/Coupon.mjs';

const router = express.Router();

/**
 * Generate unique discount code
 */
function generateDiscountCode(bookingId) {
  const prefix = 'DELAY';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * @route   GET /api/admin/delay/pending
 * @desc    Get pending delay compensation requests
 * @access  Private (requires manage_compensation permission)
 */
router.get(
  '/pending',
  requireAuth(),
  requirePermission('manage_compensation'),
  requireFeatureEnabled('delay_compensation'),
  async (req, res) => {
    try {
      const { status = 'pending', page = 1, limit = 20 } = req.query;

      const filter = {};
      if (status && ['pending', 'approved', 'rejected', 'applied'].includes(status)) {
        filter.status = status;
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const compensations = await DelayCompensation.find(filter)
        .populate('booking', 'bookingNumber pickupDate status amount')
        .populate('user', 'name email')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      const total = await DelayCompensation.countDocuments(filter);

      // Add discount code if approved and not already present
      const compensationsWithCodes = compensations.map((comp) => {
        if (comp.status === 'approved' && !comp.discountCode) {
          comp.discountCode = generateDiscountCode(comp.booking._id);
        }
        return comp;
      });

      return res.apiSuccess(
        {
          compensations: compensationsWithCodes,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
        'Delay compensations retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching delay compensations:', error);
      return res.apiError('Failed to fetch delay compensations', 500);
    }
  }
);

/**
 * @route   POST /api/admin/delay/approve/:id
 * @desc    Approve a delay compensation request
 * @access  Private (requires manage_compensation permission)
 */
router.post(
  '/approve/:id',
  requireAuth(),
  requirePermission('manage_compensation'),
  requireFeatureEnabled('delay_compensation'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const compensation = await DelayCompensation.findById(id)
        .populate('booking')
        .populate('user');

      if (!compensation) {
        return res.apiError('Compensation request not found', 404);
      }

      if (compensation.status !== 'pending') {
        return res.apiError('Only pending compensations can be approved', 400);
      }

      // Generate discount code
      const discountCode = generateDiscountCode(compensation.booking._id);

      // Create coupon
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90); // 90 days validity

      await Coupon.create({
        code: discountCode,
        discountType: 'percentage',
        discountValue: compensation.compensationValue,
        maxUses: 1,
        usedCount: 0,
        expiryDate,
        isActive: true,
        applicableFor: [compensation.user._id],
        description: `Delay compensation for booking ${compensation.booking.bookingNumber}`,
      });

      // Update compensation
      compensation.status = 'approved';
      compensation.discountCode = discountCode;
      compensation.reviewedBy = req.user.id;
      compensation.reviewedAt = new Date();
      compensation.reviewNotes = notes;
      await compensation.save();

      return res.apiSuccess(
        {
          compensation,
          discountCode,
        },
        'Compensation approved successfully'
      );
    } catch (error) {
      console.error('Error approving compensation:', error);
      return res.apiError('Failed to approve compensation', 500);
    }
  }
);

/**
 * @route   POST /api/admin/delay/reject/:id
 * @desc    Reject a delay compensation request
 * @access  Private (requires manage_compensation permission)
 */
router.post(
  '/reject/:id',
  requireAuth(),
  requirePermission('manage_compensation'),
  requireFeatureEnabled('delay_compensation'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const compensation = await DelayCompensation.findById(id);

      if (!compensation) {
        return res.apiError('Compensation request not found', 404);
      }

      if (compensation.status !== 'pending') {
        return res.apiError('Only pending compensations can be rejected', 400);
      }

      compensation.status = 'rejected';
      compensation.reviewedBy = req.user.id;
      compensation.reviewedAt = new Date();
      compensation.reviewNotes = notes;
      await compensation.save();

      return res.apiSuccess(compensation, 'Compensation rejected successfully');
    } catch (error) {
      console.error('Error rejecting compensation:', error);
      return res.apiError('Failed to reject compensation', 500);
    }
  }
);

/**
 * @route   GET /api/admin/delay/stats
 * @desc    Get delay compensation statistics
 * @access  Private (requires manage_compensation permission)
 */
router.get(
  '/stats',
  requireAuth(),
  requirePermission('manage_compensation'),
  requireFeatureEnabled('delay_compensation'),
  async (req, res) => {
    try {
      const total = await DelayCompensation.countDocuments();
      const pending = await DelayCompensation.countDocuments({ status: 'pending' });
      const approved = await DelayCompensation.countDocuments({ status: 'approved' });
      const rejected = await DelayCompensation.countDocuments({ status: 'rejected' });
      const applied = await DelayCompensation.countDocuments({ status: 'applied' });

      // Calculate total compensation value
      const approvedCompensations = await DelayCompensation.find({
        status: { $in: ['approved', 'applied'] },
      }).lean();

      const totalValue = approvedCompensations.reduce(
        (sum, c) => sum + (c.compensationValue || 0),
        0
      );

      return res.apiSuccess(
        {
          total,
          pending,
          approved,
          rejected,
          applied,
          totalValue: Math.round(totalValue * 100) / 100,
        },
        'Delay compensation stats retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching compensation stats:', error);
      return res.apiError('Failed to fetch compensation stats', 500);
    }
  }
);

export default router;
