import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { requireFeatureEnabled } from '../middlewares/featureToggle.mjs';
import Driver from '../models/Driver.mjs';
import Booking from '../models/Booking.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/drivers/stats
 * @desc    Get driver performance statistics
 * @access  Private (requires view_driver_stats permission)
 */
router.get(
  '/stats',
  requireAuth(),
  requirePermission('view_driver_stats'),
  requireFeatureEnabled('driver_performance'),
  async (req, res) => {
    try {
      const { period = '30', driverId } = req.query;

      // Calculate date range
      const daysAgo = parseInt(period, 10) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Build query filter
      const bookingFilter = {
        createdAt: { $gte: startDate },
        status: { $in: ['completed', 'confirmed', 'in_progress'] },
      };

      if (driverId) {
        bookingFilter.driver = driverId;
      }

      // Get all relevant bookings
      const bookings = await Booking.find(bookingFilter)
        .populate('driver', 'name email')
        .lean();

      // Get all drivers
      const drivers = await Driver.find().lean();

      // Calculate stats per driver
      const driverStatsMap = {};

      bookings.forEach((booking) => {
        if (!booking.driver) return;

        const driverId = booking.driver._id.toString();
        if (!driverStatsMap[driverId]) {
          driverStatsMap[driverId] = {
            driverId,
            driverName: booking.driver.name,
            driverEmail: booking.driver.email,
            totalBookings: 0,
            completedBookings: 0,
            totalRevenue: 0,
            onTimeDeliveries: 0,
            lateDeliveries: 0,
            cancelledBookings: 0,
            averageRating: 0,
            ratings: [],
          };
        }

        const stats = driverStatsMap[driverId];
        stats.totalBookings += 1;

        if (booking.status === 'completed') {
          stats.completedBookings += 1;
          stats.totalRevenue += booking.amount || 0;

          // Check if on time (simplified - assume on time if completed)
          // In real implementation, compare actual vs scheduled times
          if (booking.completedAt && booking.pickupDate) {
            const timeDiff = new Date(booking.completedAt) - new Date(booking.pickupDate);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff <= 24) {
              stats.onTimeDeliveries += 1;
            } else {
              stats.lateDeliveries += 1;
            }
          }
        }

        if (booking.status === 'cancelled') {
          stats.cancelledBookings += 1;
        }

        // Add rating if available
        if (booking.rating) {
          stats.ratings.push(booking.rating);
        }
      });

      // Calculate average ratings and format stats
      const driverStats = Object.values(driverStatsMap).map((stats) => {
        const avgRating =
          stats.ratings.length > 0
            ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
            : 0;

        const onTimeRate =
          stats.completedBookings > 0
            ? (stats.onTimeDeliveries / stats.completedBookings) * 100
            : 0;

        return {
          driverId: stats.driverId,
          driverName: stats.driverName,
          driverEmail: stats.driverEmail,
          totalBookings: stats.totalBookings,
          completedBookings: stats.completedBookings,
          revenue: Math.round(stats.totalRevenue * 100) / 100,
          onTimeDeliveries: stats.onTimeDeliveries,
          lateDeliveries: stats.lateDeliveries,
          onTimeRate: Math.round(onTimeRate * 10) / 10,
          cancelledBookings: stats.cancelledBookings,
          averageRating: Math.round(avgRating * 10) / 10,
          totalRatings: stats.ratings.length,
        };
      });

      // Sort by total bookings descending
      driverStats.sort((a, b) => b.totalBookings - a.totalBookings);

      // Calculate overall summary
      const summary = {
        totalDrivers: drivers.length,
        activeDrivers: driverStats.length,
        totalBookings: driverStats.reduce((sum, s) => sum + s.totalBookings, 0),
        totalRevenue: Math.round(
          driverStats.reduce((sum, s) => sum + s.revenue, 0) * 100
        ) / 100,
        avgOnTimeRate:
          driverStats.length > 0
            ? Math.round(
                (driverStats.reduce((sum, s) => sum + s.onTimeRate, 0) / driverStats.length) * 10
              ) / 10
            : 0,
      };

      return res.apiSuccess(
        {
          driverStats,
          summary,
          period: daysAgo,
          startDate: startDate.toISOString(),
        },
        'Driver statistics retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      return res.apiError('Failed to fetch driver statistics', 500);
    }
  }
);

/**
 * @route   GET /api/admin/drivers/performance/:driverId
 * @desc    Get detailed performance for a specific driver
 * @access  Private (requires view_driver_stats permission)
 */
router.get(
  '/performance/:driverId',
  requireAuth(),
  requirePermission('view_driver_stats'),
  requireFeatureEnabled('driver_performance'),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const driver = await Driver.findById(driverId).lean();
      if (!driver) {
        return res.apiError('Driver not found', 404);
      }

      // Get all bookings for this driver
      const bookings = await Booking.find({ driver: driverId })
        .populate('tour', 'title')
        .sort({ createdAt: -1 })
        .lean();

      // Calculate detailed stats
      const stats = {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
        },
        performance: {
          totalBookings: bookings.length,
          completed: bookings.filter((b) => b.status === 'completed').length,
          inProgress: bookings.filter((b) => b.status === 'in_progress').length,
          cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        },
        recentBookings: bookings.slice(0, 10).map((b) => ({
          id: b._id,
          tour: b.tour?.title,
          status: b.status,
          amount: b.amount,
          date: b.pickupDate,
        })),
      };

      return res.apiSuccess(stats, 'Driver performance retrieved successfully');
    } catch (error) {
      console.error('Error fetching driver performance:', error);
      return res.apiError('Failed to fetch driver performance', 500);
    }
  }
);

export default router;
