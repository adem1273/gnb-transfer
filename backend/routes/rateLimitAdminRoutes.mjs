/**
 * Rate Limit Admin Routes
 * Endpoints for managing rate limits, viewing violations, and unblocking IPs/users
 */

import express from 'express';
import { RateLimitViolation } from '../models/RateLimitViolation.mjs';
import { verifyToken } from '../middlewares/auth.mjs';
import { adminGuard } from '../middlewares/adminGuard.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(verifyToken);
router.use(adminGuard);

/**
 * GET /api/admin/rate-limits/violations
 * Get all rate limit violations with pagination and filtering
 */
router.get('/violations', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      isBanned,
      identifierType,
      sortBy = 'lastViolationAt',
      sortOrder = 'desc',
    } = req.query;
    
    const filter = {};
    
    if (isBanned !== undefined) {
      filter.isBanned = isBanned === 'true';
    }
    
    if (identifierType) {
      filter.identifierType = identifierType;
    }
    
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [violations, total] = await Promise.all([
      RateLimitViolation.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      RateLimitViolation.countDocuments(filter),
    ]);
    
    res.json({
      success: true,
      data: {
        violations,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching violations:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violations',
    });
  }
});

/**
 * GET /api/admin/rate-limits/blocked
 * Get all currently blocked/banned IPs and users
 */
router.get('/blocked', async (req, res) => {
  try {
    const blockedViolations = await RateLimitViolation.find({
      isBanned: true,
      $or: [
        { banExpiresAt: null },
        { banExpiresAt: { $gt: new Date() } },
      ],
    })
      .sort({ lastViolationAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        blocked: blockedViolations,
        count: blockedViolations.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching blocked list:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blocked list',
    });
  }
});

/**
 * POST /api/admin/rate-limits/unblock
 * Manually unblock an IP or user
 */
router.post('/unblock', async (req, res) => {
  try {
    const { identifier, endpoint } = req.body;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Identifier is required',
      });
    }
    
    const filter = { identifier };
    if (endpoint) {
      filter.endpoint = endpoint;
    }
    
    const violations = await RateLimitViolation.find(filter);
    
    if (violations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No violations found for this identifier',
      });
    }
    
    // Clear all bans for this identifier
    await Promise.all(violations.map((v) => v.clearBan()));
    
    logger.info('Manual unblock', {
      identifier,
      endpoint,
      admin: req.user.email,
      count: violations.length,
    });
    
    res.json({
      success: true,
      data: {
        message: `Successfully unblocked ${violations.length} violation(s)`,
        unblocked: violations.length,
      },
    });
  } catch (error) {
    logger.error('Error unblocking:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to unblock',
    });
  }
});

/**
 * GET /api/admin/rate-limits/stats
 * Get rate limit statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await RateLimitViolation.getStats();
    
    // Get violations by endpoint
    const violationsByEndpoint = await RateLimitViolation.aggregate([
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          activeBans: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isBanned', true] },
                    {
                      $or: [
                        { $eq: ['$banExpiresAt', null] },
                        { $gt: ['$banExpiresAt', new Date()] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    
    // Get violations by identifier type
    const violationsByType = await RateLimitViolation.aggregate([
      {
        $group: {
          _id: '$identifierType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get suspicious pattern statistics
    const suspiciousPatterns = await RateLimitViolation.aggregate([
      {
        $group: {
          _id: null,
          rapidRequests: {
            $sum: { $cond: ['$suspiciousPatterns.rapidRequests', 1, 0] },
          },
          largePayload: {
            $sum: { $cond: ['$suspiciousPatterns.largePayload', 1, 0] },
          },
          suspiciousBot: {
            $sum: { $cond: ['$suspiciousPatterns.suspiciousBot', 1, 0] },
          },
        },
      },
    ]);
    
    res.json({
      success: true,
      data: {
        overall: stats,
        byEndpoint: violationsByEndpoint,
        byType: violationsByType,
        suspiciousPatterns: suspiciousPatterns[0] || {
          rapidRequests: 0,
          largePayload: 0,
          suspiciousBot: 0,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/admin/rate-limits/metrics
 * Get real-time metrics (requests per minute, violations per hour)
 */
router.get('/metrics', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now - 60 * 1000);
    
    const [violationsLastHour, violationsLastMinute] = await Promise.all([
      RateLimitViolation.countDocuments({
        lastViolationAt: { $gte: oneHourAgo },
      }),
      RateLimitViolation.countDocuments({
        lastViolationAt: { $gte: oneMinuteAgo },
      }),
    ]);
    
    // Calculate violations per hour trend
    const hourlyTrend = await RateLimitViolation.aggregate([
      {
        $match: {
          lastViolationAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00',
              date: '$lastViolationAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    res.json({
      success: true,
      data: {
        realtime: {
          violationsPerHour: violationsLastHour,
          violationsPerMinute: violationsLastMinute,
        },
        trend: hourlyTrend,
      },
    });
  } catch (error) {
    logger.error('Error fetching metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * PUT /api/admin/rate-limits/violations/:id/notes
 * Add notes to a violation record
 */
router.put('/violations/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const violation = await RateLimitViolation.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    );
    
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }
    
    logger.info('Violation notes updated', {
      violationId: id,
      admin: req.user.email,
    });
    
    res.json({
      success: true,
      data: violation,
    });
  } catch (error) {
    logger.error('Error updating notes:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update notes',
    });
  }
});

export default router;
