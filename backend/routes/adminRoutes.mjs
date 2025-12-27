import express from 'express';
import AdminSettings from '../models/AdminSettings.mjs';
import CampaignRule from '../models/CampaignRule.mjs';
import AdminLog from '../models/AdminLog.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import User from '../models/User.mjs';
import Driver from '../models/Driver.mjs';
import Vehicle from '../models/Vehicle.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission, requireAnyPermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import { clearModuleCache } from '../middlewares/moduleGuard.mjs';
import { applyCampaignRules } from '../services/campaignScheduler.mjs';
import logger from '../config/logger.mjs';
import { PAGINATION } from '../constants/limits.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (admin, manager)
 */
router.get('/stats', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    // Get start of today for todayBookings calculation
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Use aggregation for efficient statistics gathering
    const [statsResult] = await Booking.aggregate([
      {
        $facet: {
          // Total bookings
          totalBookings: [{ $count: 'count' }],
          // Today's bookings
          todayBookings: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $count: 'count' }
          ],
          // Pending bookings
          pendingBookings: [
            { $match: { status: 'pending' } },
            { $count: 'count' }
          ],
          // Total revenue from completed bookings
          totalRevenue: [
            { $match: { status: { $in: ['completed', 'paid'] } } },
            { $group: { _id: null, revenue: { $sum: '$amount' } } }
          ]
        }
      }
    ]);

    // Get user and tour counts using countDocuments for efficiency
    const [totalUsers, totalTours] = await Promise.all([
      User.countDocuments(),
      Tour.countDocuments()
    ]);

    // Extract values from aggregation results with proper fallbacks
    const totalBookings = statsResult.totalBookings[0]?.count || 0;
    const todayBookings = statsResult.todayBookings[0]?.count || 0;
    const pendingBookings = statsResult.pendingBookings[0]?.count || 0;
    const totalRevenue = statsResult.totalRevenue[0]?.revenue || 0;

    return res.apiSuccess({
      totalUsers,
      totalTours,
      totalBookings,
      todayBookings,
      pendingBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100 // Round to 2 decimal places
    }, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching admin stats:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch statistics', 500);
  }
});

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Private (requires settings.view permission)
 */
router.get('/settings', requireAuth(), requirePermission('settings.view'), async (req, res) => {
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
    logger.error('Error fetching settings:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch settings', 500);
  }
});

/**
 * @route   PATCH /api/admin/settings
 * @desc    Update admin settings
 * @access  Private (requires settings.update permission)
 */
router.patch(
  '/settings',
  requireAuth(),
  requirePermission('settings.update'),
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
      logger.error('Error updating settings:', { error: error.message, stack: error.stack });
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
    logger.error('Error fetching campaigns:', { error: error.message, stack: error.stack });
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
      logger.error('Error creating campaign:', { error: error.message, stack: error.stack });
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
      logger.error('Error updating campaign:', { error: error.message, stack: error.stack });
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
      logger.error('Error deleting campaign:', { error: error.message, stack: error.stack });
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
    logger.error('Error applying campaigns:', { error: error.message, stack: error.stack });
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
    logger.error('Error fetching insights:', { error: error.message, stack: error.stack });
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
    logger.error('Error fetching logs:', { error: error.message, stack: error.stack });
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

    const logs = await AdminLog.find(filter).sort({ createdAt: -1 }).limit(PAGINATION.EXPORT_MAX_LIMIT);

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
    logger.error('Error exporting logs:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to export logs', 500);
  }
});

/**
 * @route   GET /api/admin/analytics
 * @desc    Get comprehensive analytics dashboard data
 * @access  Private (admin, manager)
 */
router.get('/analytics', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '365days':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Calculate previous period start for growth comparison
    const periodDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    // Optimized: Use aggregation and countDocuments instead of fetching all documents
    const [periodStats] = await Booking.aggregate([
      {
        $facet: {
          // Current period bookings with tour info
          currentPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $lookup: {
                from: 'tours',
                localField: 'tour',
                foreignField: '_id',
                as: 'tourInfo',
              },
            },
            { $unwind: { path: '$tourInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                amount: 1,
                status: 1,
                paymentMethod: 1,
                createdAt: 1,
                'tourInfo.title': 1,
                'tourInfo.price': 1,
              },
            },
          ],
          // Previous period for growth comparison
          previousPeriod: [
            {
              $match: {
                createdAt: {
                  $gte: previousPeriodStart,
                  $lt: startDate,
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ]);

    // Simple count queries (much faster than fetching all documents)
    const totalUsers = await User.countDocuments();
    const totalTours = await Tour.countDocuments();
    const newUsersCount = await User.countDocuments({ createdAt: { $gte: startDate } });
    const previousUsersCount = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    });

    const bookings = periodStats.currentPeriod;
    const previousStats = periodStats.previousPeriod[0] || { count: 0, revenue: 0 };

    // Calculate summary stats
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalBookings = bookings.length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Status breakdown
    const statusBreakdown = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    // Payment method breakdown
    const paymentMethodBreakdown = bookings.reduce((acc, b) => {
      acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Revenue by tour
    const revenueByTour = {};
    bookings.forEach((b) => {
      const tourName = b.tourInfo?.title || 'Unknown';
      revenueByTour[tourName] = (revenueByTour[tourName] || 0) + (b.amount || 0);
    });

    // Top 5 tours by revenue
    const topTours = Object.entries(revenueByTour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    // Bookings by tour
    const bookingsByTour = {};
    bookings.forEach((b) => {
      const tourName = b.tourInfo?.title || 'Unknown';
      bookingsByTour[tourName] = (bookingsByTour[tourName] || 0) + 1;
    });

    // Most booked tours
    const mostBookedTours = Object.entries(bookingsByTour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }));

    // Daily revenue trend (last 30 days)
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= date && bookingDate < nextDate;
      });

      const revenue = dayBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue * 100) / 100,
        bookings: dayBookings.length,
      });
    }

    // Growth metrics using pre-calculated values
    const previousRevenue = previousStats.revenue || 0;
    const previousBookingsCount = previousStats.count || 0;

    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const bookingsGrowth =
      previousBookingsCount > 0
        ? ((totalBookings - previousBookingsCount) / previousBookingsCount) * 100
        : 0;

    const userGrowth = previousUsersCount > 0 ? ((newUsersCount - previousUsersCount) / previousUsersCount) * 100 : 0;

    // Response
    return res.apiSuccess(
      {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalBookings,
          totalUsers,
          totalTours,
          avgBookingValue: Math.round(avgBookingValue * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          bookingsGrowth: Math.round(bookingsGrowth * 10) / 10,
          userGrowth: Math.round(userGrowth * 10) / 10,
        },
        statusBreakdown,
        paymentMethodBreakdown,
        topTours,
        mostBookedTours,
        dailyRevenue,
        period,
      },
      'Analytics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching analytics:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch analytics', 500);
  }
});

/**
 * @route   GET /api/admin/drivers
 * @desc    Get all drivers with filtering and pagination
 * @access  Private (admin, manager)
 */
router.get('/drivers', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    const validStatuses = ['active', 'inactive', 'on-duty', 'off-duty'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const drivers = await Driver.find(filter)
      .populate('user', 'name email')
      .populate('vehicleAssigned', 'model brand plateNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Driver.countDocuments(filter);

    return res.apiSuccess(
      {
        drivers,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Drivers retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching drivers:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch drivers', 500);
  }
});

/**
 * @route   GET /api/admin/vehicles
 * @desc    Get all vehicles with filtering and pagination
 * @access  Private (admin, manager)
 */
router.get('/vehicles', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = {};
    const validStatuses = ['available', 'in-use', 'maintenance', 'retired'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const validTypes = ['sedan', 'suv', 'van', 'minibus', 'luxury', 'economy'];
    if (type && validTypes.includes(type)) {
      filter.type = type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const vehicles = await Vehicle.find(filter)
      .populate('currentDriver', 'name email licenseNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Vehicle.countDocuments(filter);

    return res.apiSuccess(
      {
        vehicles,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Vehicles retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching vehicles:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch vehicles', 500);
  }
});

/**
 * @route   PATCH /api/admin/bookings/:id/assign
 * @desc    Assign driver and vehicle to a booking
 * @access  Private (admin only)
 */
router.patch(
  '/bookings/:id/assign',
  requireAuth(['admin']),
  logAdminAction('BOOKING_ASSIGN', (req) => ({ type: 'Booking', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId, vehicleId } = req.body;

      // Validate ObjectId formats
      if (driverId && !/^[0-9a-fA-F]{24}$/.test(driverId)) {
        return res.apiError('Invalid driver ID format', 400);
      }
      if (vehicleId && !/^[0-9a-fA-F]{24}$/.test(vehicleId)) {
        return res.apiError('Invalid vehicle ID format', 400);
      }

      // Verify booking exists
      const booking = await Booking.findById(id);
      if (!booking) {
        return res.apiError('Booking not found', 404);
      }

      // Verify driver exists if provided
      if (driverId) {
        const driver = await Driver.findById(driverId);
        if (!driver) {
          return res.apiError('Driver not found', 404);
        }
      }

      // Verify vehicle exists if provided
      if (vehicleId) {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
          return res.apiError('Vehicle not found', 404);
        }
      }

      // Update booking
      const updates = {};
      if (driverId) updates.driver = driverId;
      if (vehicleId) updates.vehicle = vehicleId;

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('driver', 'name email phone')
        .populate('vehicle', 'model brand plateNumber')
        .populate('tour', 'title price');

      return res.apiSuccess(updatedBooking, 'Booking assignment updated successfully');
    } catch (error) {
      logger.error('Error assigning booking:', { error: error.message, stack: error.stack });
      return res.apiError('Failed to assign booking', 500);
    }
  }
);

export default router;
