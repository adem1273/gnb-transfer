/**
 * Review Routes
 *
 * @module routes/reviewRoutes
 * @description Endpoints for managing customer reviews and ratings
 */

import express from 'express';
import Review from '../models/Review.mjs';
import Booking from '../models/Booking.mjs';
import Driver from '../models/Driver.mjs';
import { requireAuth, optionalAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import logger from '../config/logger.mjs';
import crypto from 'crypto';

const router = express.Router();

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews (admin) or approved reviews (public)
 * @access  Public / Private
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, showOnHomepage, rating } = req.query;
    const isAdmin = req.user && ['admin', 'manager'].includes(req.user.role);

    const filter = {};

    // Non-admin users only see approved reviews
    if (!isAdmin) {
      filter.status = 'approved';
    } else if (status) {
      filter.status = status;
    }

    if (showOnHomepage !== undefined) {
      filter.showOnHomepage = showOnHomepage === 'true';
    }

    if (rating) {
      filter.rating = parseInt(rating, 10);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reviews = await Review.find(filter)
      .populate('user', 'name')
      .populate('driver', 'name')
      .populate('booking', 'date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Review.countDocuments(filter);
    const stats = await Review.getAverageRating();

    return res.apiSuccess({
      reviews,
      stats,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching reviews:', { error: error.message });
    return res.apiError('Failed to fetch reviews', 500);
  }
});

/**
 * @route   GET /api/reviews/homepage
 * @desc    Get featured reviews for homepage
 * @access  Public
 */
router.get('/homepage', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const reviews = await Review.getHomepageReviews(parseInt(limit, 10));
    const stats = await Review.getAverageRating();

    return res.apiSuccess({ reviews, stats });
  } catch (error) {
    logger.error('Error fetching homepage reviews:', { error: error.message });
    return res.apiError('Failed to fetch reviews', 500);
  }
});

/**
 * @route   GET /api/reviews/stats
 * @desc    Get review statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Review.getAverageRating();

    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distribution.find((d) => d._id === i);
      ratingDistribution[i] = found ? found.count : 0;
    }

    return res.apiSuccess({
      ...stats,
      averageRating: Math.round(stats.averageRating * 10) / 10,
      ratingDistribution,
    });
  } catch (error) {
    logger.error('Error fetching review stats:', { error: error.message });
    return res.apiError('Failed to fetch stats', 500);
  }
});

/**
 * @route   POST /api/reviews
 * @desc    Create review (authenticated user or via token)
 * @access  Private or Token-based
 */
router.post('/', strictRateLimiter, async (req, res) => {
  try {
    const {
      bookingId,
      token,
      rating,
      driverRating,
      vehicleRating,
      punctualityRating,
      title,
      comment,
    } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.apiError('Rating between 1-5 is required', 400);
    }

    let booking;
    let userId;

    // Check if using review token
    if (token) {
      const existingReview = await Review.findOne({ reviewToken: token });
      if (existingReview) {
        return res.apiError('Review already submitted', 400);
      }

      // Find booking by token
      booking = await Booking.findOne({
        _id: bookingId,
        status: 'completed',
      });

      if (!booking) {
        return res.apiError('Invalid booking or token', 400);
      }

      userId = booking.user;
    } else {
      // Authenticated user review
      if (!req.headers.authorization) {
        return res.apiError('Authentication required', 401);
      }

      // Verify booking belongs to user
      booking = await Booking.findOne({
        _id: bookingId,
        user: req.user?.id,
        status: 'completed',
      });

      if (!booking) {
        return res.apiError('Booking not found or not completed', 404);
      }

      userId = req.user.id;
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.apiError('Review already exists for this booking', 400);
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      user: userId,
      driver: booking.driver,
      rating,
      driverRating,
      vehicleRating,
      punctualityRating,
      title,
      comment,
      status: 'pending',
      source: token ? 'email' : 'website',
    });

    // Update driver rating if driver review provided
    if (booking.driver && driverRating) {
      const driverStats = await Review.getDriverRating(booking.driver);
      await Driver.findByIdAndUpdate(booking.driver, {
        $set: { rating: driverStats.averageRating },
        $inc: { totalTrips: 0 }, // Just to trigger update
      });
    }

    return res.apiSuccess(review, 'Review submitted successfully. Pending approval.');
  } catch (error) {
    logger.error('Error creating review:', { error: error.message });
    return res.apiError(error.message || 'Failed to create review', 500);
  }
});

/**
 * @route   PATCH /api/reviews/:id/status
 * @desc    Update review status (approve/reject)
 * @access  Private (admin only)
 */
router.patch('/:id/status', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { status, showOnHomepage, adminResponse } = req.body;

    if (!['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
      return res.apiError('Invalid status', 400);
    }

    const updates = {
      status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    };

    if (showOnHomepage !== undefined) {
      updates.showOnHomepage = showOnHomepage;
    }

    if (adminResponse) {
      updates.adminResponse = adminResponse;
      updates.adminResponseAt = new Date();
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('user', 'name');

    if (!review) {
      return res.apiError('Review not found', 404);
    }

    return res.apiSuccess(review, `Review ${status}`);
  } catch (error) {
    logger.error('Error updating review status:', { error: error.message });
    return res.apiError('Failed to update review', 500);
  }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.apiError('Review not found', 404);
    }

    return res.apiSuccess(null, 'Review deleted');
  } catch (error) {
    logger.error('Error deleting review:', { error: error.message });
    return res.apiError('Failed to delete review', 500);
  }
});

/**
 * @route   POST /api/reviews/generate-token
 * @desc    Generate review request token for a booking
 * @access  Private (admin, system)
 */
router.post('/generate-token', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.apiError('bookingId is required', 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.apiError('Booking not found', 404);
    }

    if (booking.status !== 'completed') {
      return res.apiError('Booking must be completed to request review', 400);
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.apiError('Review already exists for this booking', 400);
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create placeholder review with token
    const review = await Review.create({
      booking: bookingId,
      user: booking.user,
      driver: booking.driver,
      rating: 5, // Placeholder
      status: 'pending',
      reviewToken: token,
      tokenExpiry,
    });

    // Generate review URL
    const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review?token=${token}&booking=${bookingId}`;

    return res.apiSuccess(
      {
        token,
        tokenExpiry,
        reviewUrl,
      },
      'Review token generated'
    );
  } catch (error) {
    logger.error('Error generating review token:', { error: error.message });
    return res.apiError('Failed to generate token', 500);
  }
});

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Mark review as helpful/not helpful
 * @access  Public
 */
router.post('/:id/helpful', strictRateLimiter, async (req, res) => {
  try {
    const { helpful } = req.body;

    const update = helpful ? { $inc: { helpful: 1 } } : { $inc: { notHelpful: 1 } };

    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!review) {
      return res.apiError('Review not found', 404);
    }

    return res.apiSuccess({
      helpful: review.helpful,
      notHelpful: review.notHelpful,
    });
  } catch (error) {
    logger.error('Error updating helpful count:', { error: error.message });
    return res.apiError('Failed to update', 500);
  }
});

export default router;
