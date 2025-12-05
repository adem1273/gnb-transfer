/**
 * Base Pricing Routes
 *
 * @module routes/basePricingRoutes
 * @description Endpoints for managing base pricing between locations
 */

import express from 'express';
import BasePricing from '../models/BasePricing.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/base-pricing
 * @desc    Get all base pricing routes
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 50, originType, destinationType, active } = req.query;

    const filter = {};
    if (originType) filter.originType = originType;
    if (destinationType) filter.destinationType = destinationType;
    if (active !== undefined) filter.active = active === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const pricings = await BasePricing.find(filter)
      .sort({ origin: 1, destination: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await BasePricing.countDocuments(filter);

    return res.apiSuccess({
      pricings,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching base pricing:', { error: error.message });
    return res.apiError('Failed to fetch pricing data', 500);
  }
});

/**
 * @route   GET /api/admin/base-pricing/calculate
 * @desc    Calculate price for a route
 * @access  Public
 */
router.get('/calculate', async (req, res) => {
  try {
    const { origin, destination, vehicleType = 'sedan' } = req.query;

    if (!origin || !destination) {
      return res.apiError('Origin and destination are required', 400);
    }

    const result = await BasePricing.getPriceForRoute(origin, destination, vehicleType);

    if (!result) {
      return res.apiError('Route not found', 404);
    }

    return res.apiSuccess({
      price: result.price,
      route: {
        origin: result.route.origin,
        destination: result.route.destination,
        distanceKm: result.route.distanceKm,
        estimatedDuration: result.route.estimatedDuration,
      },
      vehicleType,
      allPrices: result.route.prices,
    });
  } catch (error) {
    logger.error('Error calculating price:', { error: error.message });
    return res.apiError('Failed to calculate price', 500);
  }
});

/**
 * @route   POST /api/admin/base-pricing
 * @desc    Create new base pricing route
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      origin,
      destination,
      originType,
      destinationType,
      prices,
      currency,
      distanceKm,
      estimatedDuration,
      active,
      notes,
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !originType || !destinationType || !prices) {
      return res.apiError('Missing required fields', 400);
    }

    // Validate prices
    if (!prices.sedan || !prices.minivan || !prices.vip) {
      return res.apiError('Prices for sedan, minivan, and vip are required', 400);
    }

    // Check if route already exists
    const existing = await BasePricing.findOne({
      origin: { $regex: new RegExp(`^${origin}$`, 'i') },
      destination: { $regex: new RegExp(`^${destination}$`, 'i') },
    });

    if (existing) {
      return res.apiError('This route already exists', 400);
    }

    const pricing = await BasePricing.create({
      origin,
      destination,
      originType,
      destinationType,
      prices,
      currency: currency || 'USD',
      distanceKm,
      estimatedDuration,
      active: active !== false,
      notes,
      createdBy: req.user.id,
    });

    return res.apiSuccess(pricing, 'Base pricing created successfully');
  } catch (error) {
    logger.error('Error creating base pricing:', { error: error.message });
    return res.apiError(error.message || 'Failed to create pricing', 500);
  }
});

/**
 * @route   PATCH /api/admin/base-pricing/:id
 * @desc    Update base pricing
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'origin',
      'destination',
      'originType',
      'destinationType',
      'prices',
      'currency',
      'distanceKm',
      'estimatedDuration',
      'active',
      'notes',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedBy = req.user.id;

    const pricing = await BasePricing.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!pricing) {
      return res.apiError('Pricing route not found', 404);
    }

    return res.apiSuccess(pricing, 'Pricing updated successfully');
  } catch (error) {
    logger.error('Error updating base pricing:', { error: error.message });
    return res.apiError(error.message || 'Failed to update pricing', 500);
  }
});

/**
 * @route   DELETE /api/admin/base-pricing/:id
 * @desc    Delete base pricing
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const pricing = await BasePricing.findByIdAndDelete(req.params.id);

    if (!pricing) {
      return res.apiError('Pricing route not found', 404);
    }

    return res.apiSuccess(null, 'Pricing deleted successfully');
  } catch (error) {
    logger.error('Error deleting base pricing:', { error: error.message });
    return res.apiError('Failed to delete pricing', 500);
  }
});

/**
 * @route   POST /api/admin/base-pricing/bulk
 * @desc    Bulk create/update pricing routes
 * @access  Private (admin only)
 */
router.post('/bulk', requireAuth(['admin']), async (req, res) => {
  try {
    const { pricings } = req.body;

    if (!Array.isArray(pricings) || pricings.length === 0) {
      return res.apiError('pricings array is required', 400);
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const item of pricings) {
      try {
        const existing = await BasePricing.findOne({
          origin: { $regex: new RegExp(`^${item.origin}$`, 'i') },
          destination: { $regex: new RegExp(`^${item.destination}$`, 'i') },
        });

        if (existing) {
          await BasePricing.findByIdAndUpdate(existing._id, {
            $set: {
              ...item,
              updatedBy: req.user.id,
            },
          });
          results.updated++;
        } else {
          await BasePricing.create({
            ...item,
            createdBy: req.user.id,
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          route: `${item.origin} → ${item.destination}`,
          error: err.message,
        });
      }
    }

    return res.apiSuccess(results, 'Bulk operation completed');
  } catch (error) {
    logger.error('Error in bulk pricing:', { error: error.message });
    return res.apiError('Failed to process bulk pricing', 500);
  }
});

/**
 * @route   GET /api/admin/base-pricing/locations
 * @desc    Get all unique locations for dropdown
 * @access  Public
 */
router.get('/locations', async (req, res) => {
  try {
    const origins = await BasePricing.distinct('origin', { active: true });
    const destinations = await BasePricing.distinct('destination', { active: true });

    // Combine and remove duplicates
    const allLocations = [...new Set([...origins, ...destinations])].sort();

    return res.apiSuccess({ locations: allLocations });
  } catch (error) {
    logger.error('Error fetching locations:', { error: error.message });
    return res.apiError('Failed to fetch locations', 500);
  }
});

export default router;
