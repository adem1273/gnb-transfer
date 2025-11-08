import express from 'express';
import AdminSettings from '../models/AdminSettings.mjs';
import CampaignRule from '../models/CampaignRule.mjs';
import AdminLog from '../models/AdminLog.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import { clearModuleCache } from '../middlewares/moduleGuard.mjs';
import { applyCampaignRules } from '../services/campaignScheduler.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Private (admin, manager)
 */
router.get('/settings', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      // Create default settings
      settings = await AdminSettings.create({
        activeModules: {
          tours: true,
          users: true,
          bookings: true,
          payments: true,
        },
        notificationSettings: {
          bookingConfirmation: true,
          paymentReceived: true,
          campaignStarted: true,
          systemAlerts: true,
        },
      });
    }

    return res.apiSuccess(settings, 'Settings retrieved successfully');
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.apiError('Failed to fetch settings', 500);
  }
});

/**
 * @route   PATCH /api/admin/settings
 * @desc    Update admin settings
 * @access  Private (admin only)
 */
router.patch(
  '/settings',
  requireAuth(['admin']),
  logAdminAction('SETTINGS_CHANGE', { type: 'Settings', name: 'Admin Settings' }),
  async (req, res) => {
    try {
      const { activeModules, notificationSettings, emailConfig } = req.body;

      let settings = await AdminSettings.findOne();

      if (!settings) {
        settings = new AdminSettings();
      }

      // Update fields if provided
      if (activeModules) {
        settings.activeModules = { ...settings.activeModules, ...activeModules };
        clearModuleCache(); // Clear cache when modules change
      }
      if (notificationSettings) {
        settings.notificationSettings = {
          ...settings.notificationSettings,
          ...notificationSettings,
        };
      }
      if (emailConfig) {
        settings.emailConfig = { ...settings.emailConfig, ...emailConfig };
      }

      await settings.save();

      return res.apiSuccess(settings, 'Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.apiError('Failed to update settings', 500);
    }
  }
);

/**
 * @route   GET /api/admin/campaigns
 * @desc    Get all campaign rules
 * @access  Private (admin, manager)
 */
router.get('/campaigns', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const campaigns = await CampaignRule.find().sort({ createdAt: -1 });
    return res.apiSuccess(campaigns, 'Campaigns retrieved successfully');
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.apiError('Failed to fetch campaigns', 500);
  }
});

/**
 * @route   POST /api/admin/campaigns
 * @desc    Create a new campaign rule
 * @access  Private (admin only)
 */
router.post(
  '/campaigns',
  requireAuth(['admin']),
  logAdminAction('CAMPAIGN_CREATE', (req) => ({ type: 'Campaign', name: req.body.name })),
  async (req, res) => {
    try {
      const { name, description, conditionType, target, discountRate, startDate, endDate, active } =
        req.body;

      // Validation
      if (!name || !conditionType || !target || !discountRate || !startDate || !endDate) {
        return res.apiError('Missing required fields', 400);
      }

      if (discountRate < 0 || discountRate > 100) {
        return res.apiError('Discount rate must be between 0 and 100', 400);
      }

      const campaign = await CampaignRule.create({
        name,
        description,
        conditionType,
        target,
        discountRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active !== undefined ? active : true,
      });

      return res.apiSuccess(campaign, 'Campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
      return res.apiError(error.message || 'Failed to create campaign', 500);
    }
  }
);

/**
 * @route   PATCH /api/admin/campaigns/:id
 * @desc    Update a campaign rule
 * @access  Private (admin only)
 */
router.patch(
  '/campaigns/:id',
  requireAuth(['admin']),
  logAdminAction('CAMPAIGN_UPDATE', (req) => ({ type: 'Campaign', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Whitelist allowed fields for update
      const allowedFields = [
        'name',
        'description',
        'conditionType',
        'target',
        'discountRate',
        'startDate',
        'endDate',
        'active',
      ];
      const sanitizedUpdates = {};
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      });

      const campaign = await CampaignRule.findByIdAndUpdate(
        id,
        { $set: sanitizedUpdates },
        { new: true, runValidators: true }
      );

      if (!campaign) {
        return res.apiError('Campaign not found', 404);
      }

      return res.apiSuccess(campaign, 'Campaign updated successfully');
    } catch (error) {
      console.error('Error updating campaign:', error);
      return res.apiError(error.message || 'Failed to update campaign', 500);
    }
  }
);

/**
 * @route   DELETE /api/admin/campaigns/:id
 * @desc    Delete a campaign rule
 * @access  Private (admin only)
 */
router.delete(
  '/campaigns/:id',
  requireAuth(['admin']),
  logAdminAction('CAMPAIGN_DELETE', (req) => ({ type: 'Campaign', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await CampaignRule.findByIdAndDelete(id);

      if (!campaign) {
        return res.apiError('Campaign not found', 404);
      }

      return res.apiSuccess(null, 'Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return res.apiError('Failed to delete campaign', 500);
    }
  }
);

/**
 * @route   POST /api/admin/campaigns/apply
 * @desc    Manually trigger campaign rule application
 * @access  Private (admin only)
 */
router.post('/campaigns/apply', requireAuth(['admin']), async (req, res) => {
  try {
    await applyCampaignRules();
    return res.apiSuccess(null, 'Campaign rules applied successfully');
  } catch (error) {
    console.error('Error applying campaigns:', error);
    return res.apiError('Failed to apply campaigns', 500);
  }
});

/**
 * @route   GET /api/admin/insights
 * @desc    Get AI-based admin insights
 * @access  Private (admin, manager)
 */
router.get('/insights', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Get statistics
    const bookingsQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const bookings = await Booking.find(bookingsQuery);
    const tours = await Tour.find();
    const users = await User.find();

    // Calculate insights
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

    // Find most popular tour
    const tourBookings = {};
    bookings.forEach((booking) => {
      const tourId = booking.tour?.toString();
      if (tourId) {
        tourBookings[tourId] = (tourBookings[tourId] || 0) + 1;
      }
    });

    const tourIds = Object.keys(tourBookings);
    const mostPopularTourId =
      tourIds.length > 0
        ? tourIds.reduce((a, b) => (tourBookings[a] > tourBookings[b] ? a : b))
        : null;

    const mostPopularTour = mostPopularTourId ? await Tour.findById(mostPopularTourId) : null;

    // Revenue trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const i = 6 - index;
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBookings = bookings.filter(
        (b) => new Date(b.createdAt) >= date && new Date(b.createdAt) < nextDate
      );

      const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      return {
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        bookings: dayBookings.length,
      };
    });


    // Generate insights summary
    const insights = {
      summary: {
        totalBookings: bookings.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        totalUsers: users.length,
        totalTours: tours.length,
      },
      mostPopularTour: mostPopularTour
        ? {
            id: mostPopularTour._id,
            name: mostPopularTour.name,
            bookings: tourBookings[mostPopularTourId],
          }
        : null,
      revenueTrend: last7Days,
      aiSuggestions: [
        totalRevenue > 10000
          ? 'Revenue is strong. Consider launching premium tour packages.'
          : 'Focus on marketing to increase bookings.',
        mostPopularTour
          ? `Your most popular tour is "${mostPopularTour.name}". Consider creating similar experiences.`
          : 'Not enough data to determine popular tours yet.',
        users.length > bookings.length * 2
          ? 'You have many users but few bookings. Improve conversion with special offers.'
          : 'Good user-to-booking ratio.',
      ],
    };

    return res.apiSuccess(insights, 'Insights retrieved successfully');
  } catch (error) {
    console.error('Error fetching insights:', error);
    return res.apiError('Failed to fetch insights', 500);
  }
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get admin activity logs
 * @access  Private (admin only)
 */
router.get('/logs', requireAuth(['admin']), async (req, res) => {
  try {
    const { action, userId, targetType, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build filter with whitelisted values
    const filter = {};
    
    // Whitelist action values
    const validActions = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'VIEW',
      'EXPORT',
      'SETTINGS_CHANGE',
      'CAMPAIGN_CREATE',
      'CAMPAIGN_UPDATE',
      'CAMPAIGN_DELETE',
    ];
    if (action && validActions.includes(action)) {
      filter.action = action;
    }
    
    // Validate ObjectId format for userId
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      filter['user.id'] = userId;
    }
    
    // Whitelist target type values
    const validTargetTypes = ['User', 'Booking', 'Tour', 'Settings', 'Campaign'];
    if (targetType && validTargetTypes.includes(targetType)) {
      filter['target.type'] = targetType;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await AdminLog.countDocuments(filter);

    return res.apiSuccess(
      {
        logs,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Logs retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.apiError('Failed to fetch logs', 500);
  }
});

/**
 * @route   GET /api/admin/logs/export
 * @desc    Export admin logs as CSV
 * @access  Private (admin only)
 */
router.get('/logs/export', requireAuth(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter (dates are validated by Date constructor)
    // Date validation: Invalid dates become NaN which MongoDB safely ignores
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      // Date constructor validates and sanitizes input
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (!Number.isNaN(parsedStart.getTime())) {
          filter.createdAt.$gte = parsedStart;
        }
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          filter.createdAt.$lte = parsedEnd;
        }
      }
    }

    const logs = await AdminLog.find(filter).sort({ createdAt: -1 }).limit(10000);

    // Generate CSV
    const csvHeader = 'Timestamp,Action,User Email,User Name,Target Type,Target Name,IP Address\n';
    const csvRows = logs
      .map((log) =>
        [
          new Date(log.createdAt).toISOString(),
          log.action,
          log.user.email,
          log.user.name,
          log.target.type,
          log.target.name || '',
          log.ipAddress || '',
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=admin-logs.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting logs:', error);
    return res.apiError('Failed to export logs', 500);
  }
});

export default router;
