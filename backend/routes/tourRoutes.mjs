/**
 * Tour routes - comprehensive tour management
 */

import express from 'express';
import Tour from '../models/Tour.mjs';
import Booking from '../models/Booking.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { validateTourCreation, validateTourUpdate, validateMongoId } from '../validators/index.mjs';
import { cacheMiddleware, clearCache } from '../middlewares/cache.mjs';

const router = express.Router();

/**
 * GET /api/tours - Get all tours (cached for 10 minutes)
 */
router.get('/', cacheMiddleware(600), async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    return res.apiSuccess(tours, 'Tours retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to retrieve tours: ${error.message}`, 500);
  }
});

/**
 * GET /api/tours/campaigns - Get campaign tours (cached for 15 minutes)
 */
router.get('/campaigns', cacheMiddleware(900), async (req, res) => {
  try {
    const campaignTours = await Tour.find({ isCampaign: true }).sort({ discount: -1 });
    return res.apiSuccess(campaignTours, 'Campaign tours retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to fetch campaign tours: ${error.message}`, 500);
  }
});

/**
 * GET /api/tours/most-popular - Get most popular tours (cached for 30 minutes)
 */
router.get('/most-popular', cacheMiddleware(1800), async (req, res) => {
  try {
    const mostPopularTours = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed', 'paid'] } } },
      { $group: { _id: '$tourId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'tourDetails',
        },
      },
      { $unwind: '$tourDetails' },
      {
        $project: {
          _id: '$tourDetails._id',
          title: '$tourDetails.title',
          description: '$tourDetails.description',
          price: '$tourDetails.price',
          duration: '$tourDetails.duration',
          discount: '$tourDetails.discount',
          isCampaign: '$tourDetails.isCampaign',
          bookingCount: '$count',
        },
      },
    ]);

    return res.apiSuccess(mostPopularTours, 'Most popular tours retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to fetch most popular tours: ${error.message}`, 500);
  }
});

/**
 * GET /api/tours/:id - Get tour by ID (cached for 15 minutes)
 */
router.get('/:id', validateMongoId, cacheMiddleware(900), async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.apiError('Tour not found', 404);
    }
    return res.apiSuccess(tour, 'Tour retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to fetch tour: ${error.message}`, 500);
  }
});

/**
 * GET /api/tours/:id/discounted-price - Get discounted price for a tour (cached for 15 minutes)
 */
router.get('/:id/discounted-price', validateMongoId, cacheMiddleware(900), async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.apiError('Tour not found', 404);
    }

    const originalPrice = tour.price;
    const discount = tour.discount || 0;

    // Calculate discounted price
    // Discount range: 0-100% (inclusive)
    // Note: 100% discount (free tour) is intentionally allowed for promotions
    const discountedPrice =
      discount > 0 && discount <= 100
        ? originalPrice - (originalPrice * discount) / 100
        : originalPrice;

    return res.apiSuccess(
      {
        originalPrice,
        discount,
        discountedPrice,
      },
      'Discounted price calculated successfully'
    );
  } catch (error) {
    return res.apiError(`Failed to calculate discounted price: ${error.message}`, 500);
  }
});

/**
 * POST /api/tours - Create a new tour (Admin only)
 */
router.post(
  '/',
  requireAuth(['admin']),
  validateTourCreation,
  strictRateLimiter,
  async (req, res) => {
    try {
      const { title, description, price, duration, discount, isCampaign, ...translations } =
        req.body;

      if (!title || !price || !duration) {
        return res.apiError('Title, price, and duration are required', 400);
      }

      const tour = await Tour.create({
        title,
        description,
        price,
        duration,
        discount: discount || 0,
        isCampaign: isCampaign || false,
        ...translations,
      });

      // Clear tour-related cache
      clearCache(/^\/api\/tours/);

      return res.apiSuccess(tour, 'Tour created successfully', 201);
    } catch (error) {
      return res.apiError(`Failed to create tour: ${error.message}`, 500);
    }
  }
);

/**
 * PUT /api/tours/:id - Update a tour (Admin only)
 */
router.put(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  validateTourUpdate,
  strictRateLimiter,
  async (req, res) => {
    try {
      const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!tour) {
        return res.apiError('Tour not found', 404);
      }

      // Clear tour-related cache
      clearCache(/^\/api\/tours/);

      return res.apiSuccess(tour, 'Tour updated successfully');
    } catch (error) {
      return res.apiError(`Failed to update tour: ${error.message}`, 500);
    }
  }
);

/**
 * DELETE /api/tours/:id - Delete a tour (Admin only)
 */
router.delete(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  strictRateLimiter,
  async (req, res) => {
    try {
      const tour = await Tour.findByIdAndDelete(req.params.id);

      if (!tour) {
        return res.apiError('Tour not found', 404);
      }

      // Clear tour-related cache
      clearCache(/^\/api\/tours/);

      return res.apiSuccess(null, 'Tour deleted successfully');
    } catch (error) {
      return res.apiError(`Failed to delete tour: ${error.message}`, 500);
    }
  }
);

export default router;
