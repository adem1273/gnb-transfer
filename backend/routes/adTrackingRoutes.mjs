/**
 * Ad Tracking Routes
 *
 * @module routes/adTrackingRoutes
 * @description Endpoints for ad pixel and conversion tracking
 */

import express from 'express';
import AdTracking from '../models/AdTracking.mjs';
import Booking from '../models/Booking.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   POST /api/tracking/session
 * @desc    Create or update tracking session
 * @access  Public
 */
router.post('/session', async (req, res) => {
  try {
    const {
      sessionId,
      utm,
      referrer,
      landingPage,
      adPlatform,
      adCampaignId,
      adSetId,
      adId,
      gclid,
      fbclid,
      ttclid,
      device,
      geo,
    } = req.body;

    if (!sessionId) {
      return res.apiError('sessionId is required', 400);
    }

    const tracking = await AdTracking.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          utm,
          referrer,
          landingPage,
          adPlatform: adPlatform || 'organic',
          adCampaignId,
          adSetId,
          adId,
          gclid,
          fbclid,
          ttclid,
          device,
          geo,
          lastTouchDate: new Date(),
        },
        $setOnInsert: {
          firstTouchDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.apiSuccess({ sessionId: tracking.sessionId }, 'Session tracked');
  } catch (error) {
    logger.error('Error tracking session:', { error: error.message });
    return res.apiError('Failed to track session', 500);
  }
});

/**
 * @route   POST /api/tracking/event
 * @desc    Track conversion event
 * @access  Public
 */
router.post('/event', async (req, res) => {
  try {
    const { sessionId, eventName, value, currency, bookingId, metadata } = req.body;

    if (!sessionId || !eventName) {
      return res.apiError('sessionId and eventName are required', 400);
    }

    const tracking = await AdTracking.trackEvent(sessionId, eventName, {
      value,
      currency,
      bookingId,
      metadata,
    });

    // If it's a purchase event, mark as converted
    if (eventName === 'purchase' && value) {
      await AdTracking.markConverted(sessionId, value);
    }

    return res.apiSuccess({ tracked: true });
  } catch (error) {
    logger.error('Error tracking event:', { error: error.message });
    return res.apiError('Failed to track event', 500);
  }
});

/**
 * @route   POST /api/tracking/conversion
 * @desc    Mark session as converted
 * @access  Public
 */
router.post('/conversion', async (req, res) => {
  try {
    const { sessionId, value, bookingId } = req.body;

    if (!sessionId) {
      return res.apiError('sessionId is required', 400);
    }

    const tracking = await AdTracking.markConverted(sessionId, value);

    if (bookingId) {
      await AdTracking.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            events: {
              eventName: 'purchase',
              value,
              booking: bookingId,
            },
          },
        }
      );
    }

    return res.apiSuccess({ converted: true });
  } catch (error) {
    logger.error('Error marking conversion:', { error: error.message });
    return res.apiError('Failed to mark conversion', 500);
  }
});

/**
 * @route   GET /api/admin/tracking/dashboard
 * @desc    Get ad tracking dashboard data
 * @access  Private (admin only)
 */
router.get('/dashboard', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get campaign performance
    const campaignPerformance = await AdTracking.getCampaignPerformance(start, end);

    // Get platform summary
    const platformSummary = await AdTracking.getPlatformSummary(start, end);

    // Get daily conversions
    const dailyConversions = await AdTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sessions: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          revenue: { $sum: '$conversionValue' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get totals
    const totals = await AdTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalConversions: { $sum: { $cond: ['$converted', 1, 0] } },
          totalRevenue: { $sum: '$conversionValue' },
        },
      },
    ]);

    const summary = totals[0] || { totalSessions: 0, totalConversions: 0, totalRevenue: 0 };
    summary.conversionRate =
      summary.totalSessions > 0
        ? Math.round((summary.totalConversions / summary.totalSessions) * 10000) / 100
        : 0;

    return res.apiSuccess({
      dateRange: { start, end },
      summary,
      campaignPerformance,
      platformSummary,
      dailyConversions,
    });
  } catch (error) {
    logger.error('Error fetching tracking dashboard:', { error: error.message });
    return res.apiError('Failed to fetch dashboard data', 500);
  }
});

/**
 * @route   GET /api/admin/tracking/campaigns
 * @desc    Get detailed campaign data
 * @access  Private (admin only)
 */
router.get('/campaigns', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, platform, page = 1, limit = 50 } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const matchStage = {
      createdAt: { $gte: start, $lte: end },
      'utm.campaign': { $exists: true, $ne: null },
    };

    if (platform) {
      matchStage.adPlatform = platform;
    }

    const campaigns = await AdTracking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            campaign: '$utm.campaign',
            source: '$utm.source',
            medium: '$utm.medium',
            platform: '$adPlatform',
          },
          sessions: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          revenue: { $sum: '$conversionValue' },
          firstSeen: { $min: '$createdAt' },
          lastSeen: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          campaign: '$_id.campaign',
          source: '$_id.source',
          medium: '$_id.medium',
          platform: '$_id.platform',
          sessions: 1,
          conversions: 1,
          revenue: 1,
          firstSeen: 1,
          lastSeen: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$sessions', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$sessions'] }, 100] },
            ],
          },
          avgOrderValue: {
            $cond: [{ $eq: ['$conversions', 0] }, 0, { $divide: ['$revenue', '$conversions'] }],
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) },
      { $limit: parseInt(limit, 10) },
    ]);

    return res.apiSuccess({ campaigns });
  } catch (error) {
    logger.error('Error fetching campaigns:', { error: error.message });
    return res.apiError('Failed to fetch campaigns', 500);
  }
});

/**
 * @route   GET /api/admin/tracking/attribution
 * @desc    Get attribution data for bookings
 * @access  Private (admin only)
 */
router.get('/attribution', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get bookings with their tracking data
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'completed', 'paid'] },
    }).select('_id amount createdAt');

    const bookingIds = bookings.map((b) => b._id);

    // Find tracking sessions that led to bookings
    const attributedSessions = await AdTracking.find({
      converted: true,
      'events.booking': { $in: bookingIds },
    });

    // Calculate attribution metrics
    const attribution = {
      totalBookings: bookings.length,
      attributedBookings: attributedSessions.length,
      attributionRate:
        bookings.length > 0
          ? Math.round((attributedSessions.length / bookings.length) * 10000) / 100
          : 0,
      bySource: {},
      byPlatform: {},
    };

    attributedSessions.forEach((session) => {
      const source = session.utm?.source || 'direct';
      const platform = session.adPlatform || 'organic';

      if (!attribution.bySource[source]) {
        attribution.bySource[source] = { count: 0, revenue: 0 };
      }
      attribution.bySource[source].count++;
      attribution.bySource[source].revenue += session.conversionValue || 0;

      if (!attribution.byPlatform[platform]) {
        attribution.byPlatform[platform] = { count: 0, revenue: 0 };
      }
      attribution.byPlatform[platform].count++;
      attribution.byPlatform[platform].revenue += session.conversionValue || 0;
    });

    return res.apiSuccess(attribution);
  } catch (error) {
    logger.error('Error fetching attribution:', { error: error.message });
    return res.apiError('Failed to fetch attribution data', 500);
  }
});

export default router;
