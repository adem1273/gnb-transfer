/**
 * Extra Services Routes
 *
 * @module routes/extraServicesRoutes
 * @description Endpoints for managing extra services and their pricing
 */

import express from 'express';
import ExtraService from '../models/ExtraService.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/extra-services
 * @desc    Get all extra services
 * @access  Public (active ones) / Private (all)
 */
router.get('/', async (req, res) => {
  try {
    const { active, category, page = 1, limit = 50 } = req.query;

    const filter = {};
    
    // For public access, only show active services
    if (!req.headers.authorization) {
      filter.active = true;
    } else if (active !== undefined) {
      filter.active = active === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const services = await ExtraService.find(filter)
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await ExtraService.countDocuments(filter);

    return res.apiSuccess({
      services,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching extra services:', { error: error.message });
    return res.apiError('Failed to fetch services', 500);
  }
});

/**
 * @route   GET /api/admin/extra-services/active
 * @desc    Get all active extra services for public use
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const services = await ExtraService.getActiveServices();
    return res.apiSuccess({ services });
  } catch (error) {
    logger.error('Error fetching active services:', { error: error.message });
    return res.apiError('Failed to fetch services', 500);
  }
});

/**
 * @route   POST /api/admin/extra-services/calculate
 * @desc    Calculate total for selected services
 * @access  Public
 */
router.post('/calculate', async (req, res) => {
  try {
    const { selectedServices } = req.body;

    if (!Array.isArray(selectedServices)) {
      return res.apiError('selectedServices must be an array', 400);
    }

    const result = await ExtraService.calculateTotal(selectedServices);
    return res.apiSuccess(result, 'Services total calculated');
  } catch (error) {
    logger.error('Error calculating services total:', { error: error.message });
    return res.apiError('Failed to calculate total', 500);
  }
});

/**
 * @route   GET /api/admin/extra-services/:id
 * @desc    Get extra service by ID
 * @access  Private (admin, manager)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const service = await ExtraService.findById(req.params.id);

    if (!service) {
      return res.apiError('Service not found', 404);
    }

    return res.apiSuccess(service);
  } catch (error) {
    logger.error('Error fetching service:', { error: error.message });
    return res.apiError('Failed to fetch service', 500);
  }
});

/**
 * @route   POST /api/admin/extra-services
 * @desc    Create new extra service
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      category,
      price,
      currency,
      priceType,
      maxQuantity,
      icon,
      active,
      order,
    } = req.body;

    // Validate required fields
    if (!name || !code || price === undefined) {
      return res.apiError('Name, code, and price are required', 400);
    }

    // Check if code already exists
    const existing = await ExtraService.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.apiError('Service with this code already exists', 400);
    }

    const service = await ExtraService.create({
      name,
      code: code.toUpperCase(),
      description,
      category: category || 'convenience',
      price,
      currency: currency || 'USD',
      priceType: priceType || 'fixed',
      maxQuantity: maxQuantity || 10,
      icon,
      active: active !== false,
      order: order || 0,
      createdBy: req.user.id,
    });

    return res.apiSuccess(service, 'Extra service created successfully');
  } catch (error) {
    logger.error('Error creating extra service:', { error: error.message });
    return res.apiError(error.message || 'Failed to create service', 500);
  }
});

/**
 * @route   PATCH /api/admin/extra-services/:id
 * @desc    Update extra service
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'code',
      'description',
      'category',
      'price',
      'currency',
      'priceType',
      'maxQuantity',
      'icon',
      'active',
      'order',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Uppercase code if provided
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    updates.updatedBy = req.user.id;

    const service = await ExtraService.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.apiError('Service not found', 404);
    }

    return res.apiSuccess(service, 'Service updated successfully');
  } catch (error) {
    logger.error('Error updating service:', { error: error.message });
    return res.apiError(error.message || 'Failed to update service', 500);
  }
});

/**
 * @route   DELETE /api/admin/extra-services/:id
 * @desc    Delete extra service
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const service = await ExtraService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.apiError('Service not found', 404);
    }

    return res.apiSuccess(null, 'Service deleted successfully');
  } catch (error) {
    logger.error('Error deleting service:', { error: error.message });
    return res.apiError('Failed to delete service', 500);
  }
});

/**
 * @route   PATCH /api/admin/extra-services/reorder
 * @desc    Reorder extra services
 * @access  Private (admin only)
 */
router.patch('/reorder', requireAuth(['admin']), async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.apiError('orders must be an array of { id, order } objects', 400);
    }

    const updatePromises = orders.map(({ id, order }) =>
      ExtraService.findByIdAndUpdate(id, { $set: { order } })
    );

    await Promise.all(updatePromises);

    const services = await ExtraService.find().sort({ order: 1, name: 1 });
    return res.apiSuccess({ services }, 'Services reordered');
  } catch (error) {
    logger.error('Error reordering services:', { error: error.message });
    return res.apiError('Failed to reorder services', 500);
  }
});

export default router;
