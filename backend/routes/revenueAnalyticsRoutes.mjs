import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { requireFeatureEnabled } from '../middlewares/featureToggle.mjs';
import Booking from '../models/Booking.mjs';
import User from '../models/User.mjs';
import Tour from '../models/Tour.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/analytics/summary
 * @desc    Get revenue and KPI analytics
 * @access  Private (requires view_analytics permission)
 */
router.get(
  '/summary',
  requireAuth(),
  requirePermission('view_analytics'),
  requireFeatureEnabled('revenue_analytics'),
  async (req, res) => {
    try {
      const { period = 'weekly', startDate, endDate } = req.query;

      // Determine date range
      let dateFilter = {};
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (period === 'daily') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = { $gte: yesterday };
      } else if (period === 'weekly') {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = { $gte: lastWeek };
      } else if (period === 'monthly') {
        const lastMonth = new Date(now);
        lastMonth.setDate(lastMonth.getDate() - 30);
        dateFilter = { $gte: lastMonth };
      } else if (period === 'yearly') {
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateFilter = { $gte: lastYear };
      }

      // Fetch bookings in date range
      const bookings = await Booking.find({
        createdAt: dateFilter,
      }).lean();

      // Calculate total revenue
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

      // Calculate AOV (Average Order Value)
      const aov = bookings.length > 0 ? totalRevenue / bookings.length : 0;

      // Calculate revenue by status
      const revenueByStatus = {
        completed: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
      };

      bookings.forEach((b) => {
        if (revenueByStatus[b.status] !== undefined) {
          revenueByStatus[b.status] += b.amount || 0;
        }
      });

      // Calculate repeat booking rate
      const userBookingCounts = {};
      bookings.forEach((b) => {
        const userId = b.user?.toString();
        if (userId) {
          userBookingCounts[userId] = (userBookingCounts[userId] || 0) + 1;
        }
      });

      const repeatCustomers = Object.values(userBookingCounts).filter((count) => count > 1).length;
      const totalCustomers = Object.keys(userBookingCounts).length;
      const repeatBookingRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      // Revenue trend by day
      const revenueTrend = [];
      const daysToShow = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayBookings = bookings.filter((b) => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= date && bookingDate < nextDate;
        });

        const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

        revenueTrend.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.round(dayRevenue * 100) / 100,
          bookings: dayBookings.length,
        });
      }

      // Top revenue sources (tours)
      const tourRevenue = {};
      for (const booking of bookings) {
        if (booking.tour) {
          const tourId = booking.tour.toString();
          tourRevenue[tourId] = (tourRevenue[tourId] || 0) + (booking.amount || 0);
        }
      }

      const topTourIds = Object.entries(tourRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      const topTours = await Tour.find({ _id: { $in: topTourIds } }).lean();
      const topRevenueSources = topTours.map((tour) => ({
        tourId: tour._id,
        tourName: tour.title || tour.name,
        revenue: Math.round(tourRevenue[tour._id.toString()] * 100) / 100,
      }));

      // Calculate growth (compare with previous period)
      const previousDateFilter = {};
      if (dateFilter.$gte) {
        const periodDuration = now - dateFilter.$gte;
        const previousStart = new Date(dateFilter.$gte.getTime() - periodDuration);
        previousDateFilter.$gte = previousStart;
        previousDateFilter.$lt = dateFilter.$gte;
      }

      const previousBookings = await Booking.find({
        createdAt: previousDateFilter,
      }).lean();

      const previousRevenue = previousBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      const revenueGrowth =
        previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const bookingGrowth =
        previousBookings.length > 0
          ? ((bookings.length - previousBookings.length) / previousBookings.length) * 100
          : 0;

      return res.apiSuccess(
        {
          summary: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalBookings: bookings.length,
            aov: Math.round(aov * 100) / 100,
            repeatBookingRate: Math.round(repeatBookingRate * 10) / 10,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
            bookingGrowth: Math.round(bookingGrowth * 10) / 10,
          },
          revenueByStatus: {
            completed: Math.round(revenueByStatus.completed * 100) / 100,
            confirmed: Math.round(revenueByStatus.confirmed * 100) / 100,
            pending: Math.round(revenueByStatus.pending * 100) / 100,
            cancelled: Math.round(revenueByStatus.cancelled * 100) / 100,
          },
          revenueTrend,
          topRevenueSources,
          period,
          dateRange: {
            start: dateFilter.$gte?.toISOString(),
            end: dateFilter.$lte?.toISOString() || now.toISOString(),
          },
        },
        'Revenue analytics retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return res.apiError('Failed to fetch revenue analytics', 500);
    }
  }
);

/**
 * @route   GET /api/admin/analytics/kpi
 * @desc    Get key performance indicators
 * @access  Private (requires view_analytics permission)
 */
router.get(
  '/kpi',
  requireAuth(),
  requirePermission('view_analytics'),
  requireFeatureEnabled('revenue_analytics'),
  async (req, res) => {
    try {
      // Get various KPIs
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const completedBookings = await Booking.countDocuments({ status: 'completed' });
      const totalTours = await Tour.countDocuments();

      // Last 30 days metrics
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentBookings = await Booking.find({
        createdAt: { $gte: last30Days },
      }).lean();

      const recentRevenue = recentBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

      const kpis = {
        totalUsers,
        totalBookings,
        completedBookings,
        completionRate:
          totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100 * 10) / 10 : 0,
        totalTours,
        last30DaysBookings: recentBookings.length,
        last30DaysRevenue: Math.round(recentRevenue * 100) / 100,
      };

      return res.apiSuccess(kpis, 'KPIs retrieved successfully');
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return res.apiError('Failed to fetch KPIs', 500);
    }
  }
);

export default router;
