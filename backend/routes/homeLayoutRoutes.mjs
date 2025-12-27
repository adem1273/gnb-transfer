import express from 'express';
import HomeLayout from '../models/HomeLayout.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';
import { PAGINATION } from '../constants/limits.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/home-layouts
 * @desc    Get all homepage layouts with filtering and pagination
 * @access  Private (requires pages.view permission - admin, manager)
 */
router.get('/', requireAuth(), requirePermission('pages.view'), async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const layouts = await HomeLayout.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-__v');

    const total = await HomeLayout.countDocuments(filter);

    return res.apiSuccess(
      {
        layouts,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Homepage layouts retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching homepage layouts:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch homepage layouts', 500);
  }
});

/**
 * @route   GET /api/admin/home-layouts/active
 * @desc    Get the currently active homepage layout
 * @access  Private (requires pages.view permission - admin, manager)
 */
router.get('/active', requireAuth(), requirePermission('pages.view'), async (req, res) => {
  try {
    const layout = await HomeLayout.getActiveLayout();

    if (!layout) {
      return res.apiError('No active homepage layout found', 404);
    }

    return res.apiSuccess(layout, 'Active homepage layout retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active homepage layout:', {
      error: error.message,
      stack: error.stack,
    });
    return res.apiError('Failed to fetch active homepage layout', 500);
  }
});

/**
 * @route   GET /api/admin/home-layouts/:id
 * @desc    Get a single homepage layout by ID
 * @access  Private (requires pages.view permission - admin, manager)
 */
router.get('/:id', requireAuth(), requirePermission('pages.view'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.apiError('Invalid layout ID format', 400);
    }

    const layout = await HomeLayout.findById(id).select('-__v');

    if (!layout) {
      return res.apiError('Homepage layout not found', 404);
    }

    return res.apiSuccess(layout, 'Homepage layout retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homepage layout:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch homepage layout', 500);
  }
});

/**
 * @route   POST /api/admin/home-layouts
 * @desc    Create a new homepage layout
 * @access  Private (requires pages.create permission - admin only)
 */
router.post(
  '/',
  requireAuth(),
  requirePermission('pages.create'),
  logAdminAction('HOMELAYOUT_CREATE', (req) => ({ type: 'HomeLayout', name: req.body.name })),
  async (req, res) => {
    try {
      const { name, description, sections, isActive, seo } = req.body;

      // Validation
      if (!name) {
        return res.apiError('Layout name is required', 400);
      }

      // Validate sections if provided
      if (sections && !Array.isArray(sections)) {
        return res.apiError('Sections must be an array', 400);
      }

      // Validate section structure
      if (sections) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (!section.type || section.data === undefined || section.order === undefined) {
            return res.apiError(
              `Section ${i}: type, data, and order are required`,
              400
            );
          }

          const validTypes = [
            'hero',
            'features',
            'tours',
            'testimonials',
            'cta',
            'stats',
            'gallery',
            'text',
            'faq',
          ];
          if (!validTypes.includes(section.type)) {
            return res.apiError(
              `Section ${i}: Invalid section type '${section.type}'`,
              400
            );
          }

          if (typeof section.data !== 'object' || section.data === null) {
            return res.apiError(`Section ${i}: Section data must be an object`, 400);
          }

          if (typeof section.order !== 'number' || section.order < 0) {
            return res.apiError(`Section ${i}: Order must be a non-negative number`, 400);
          }
        }
      }

      const layout = await HomeLayout.create({
        name: name.trim(),
        description: description?.trim() || '',
        sections: sections || [],
        isActive: isActive || false,
        seo: seo || {},
      });

      return res.apiSuccess(layout, 'Homepage layout created successfully', 201);
    } catch (error) {
      logger.error('Error creating homepage layout:', {
        error: error.message,
        stack: error.stack,
      });
      return res.apiError(error.message || 'Failed to create homepage layout', 500);
    }
  }
);

/**
 * @route   PUT /api/admin/home-layouts/:id
 * @desc    Update a homepage layout
 * @access  Private (requires pages.update permission - admin only)
 */
router.put(
  '/:id',
  requireAuth(),
  requirePermission('pages.update'),
  logAdminAction('HOMELAYOUT_UPDATE', (req) => ({ type: 'HomeLayout', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, sections, isActive, seo } = req.body;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid layout ID format', 400);
      }

      // Find the layout
      const layout = await HomeLayout.findById(id);
      if (!layout) {
        return res.apiError('Homepage layout not found', 404);
      }

      // Validate sections if provided
      if (sections) {
        if (!Array.isArray(sections)) {
          return res.apiError('Sections must be an array', 400);
        }

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (!section.type || section.data === undefined || section.order === undefined) {
            return res.apiError(
              `Section ${i}: type, data, and order are required`,
              400
            );
          }

          const validTypes = [
            'hero',
            'features',
            'tours',
            'testimonials',
            'cta',
            'stats',
            'gallery',
            'text',
            'faq',
          ];
          if (!validTypes.includes(section.type)) {
            return res.apiError(
              `Section ${i}: Invalid section type '${section.type}'`,
              400
            );
          }

          if (typeof section.data !== 'object' || section.data === null) {
            return res.apiError(`Section ${i}: Section data must be an object`, 400);
          }

          if (typeof section.order !== 'number' || section.order < 0) {
            return res.apiError(`Section ${i}: Order must be a non-negative number`, 400);
          }
        }
      }

      // Whitelist allowed fields for update
      const allowedFields = ['name', 'description', 'sections', 'isActive', 'seo'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Normalize name if provided
      if (updates.name) {
        updates.name = updates.name.trim();
      }

      const updatedLayout = await HomeLayout.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedLayout) {
        return res.apiError('Homepage layout not found', 404);
      }

      return res.apiSuccess(updatedLayout, 'Homepage layout updated successfully');
    } catch (error) {
      logger.error('Error updating homepage layout:', {
        error: error.message,
        stack: error.stack,
      });
      return res.apiError(error.message || 'Failed to update homepage layout', 500);
    }
  }
);

/**
 * @route   PATCH /api/admin/home-layouts/:id/activate
 * @desc    Set a homepage layout as active (deactivates all others)
 * @access  Private (requires pages.update permission - admin only)
 */
router.patch(
  '/:id/activate',
  requireAuth(),
  requirePermission('pages.update'),
  logAdminAction('HOMELAYOUT_ACTIVATE', (req) => ({ type: 'HomeLayout', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid layout ID format', 400);
      }

      const layout = await HomeLayout.setActiveLayout(id);

      if (!layout) {
        return res.apiError('Homepage layout not found', 404);
      }

      return res.apiSuccess(layout, 'Homepage layout activated successfully');
    } catch (error) {
      logger.error('Error activating homepage layout:', {
        error: error.message,
        stack: error.stack,
      });
      return res.apiError('Failed to activate homepage layout', 500);
    }
  }
);

/**
 * @route   DELETE /api/admin/home-layouts/:id
 * @desc    Delete a homepage layout
 * @access  Private (requires pages.delete permission - admin only)
 */
router.delete(
  '/:id',
  requireAuth(),
  requirePermission('pages.delete'),
  logAdminAction('HOMELAYOUT_DELETE', (req) => ({ type: 'HomeLayout', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid layout ID format', 400);
      }

      const layout = await HomeLayout.findById(id);

      if (!layout) {
        return res.apiError('Homepage layout not found', 404);
      }

      // Prevent deletion of active layout
      if (layout.isActive) {
        return res.apiError(
          'Cannot delete the active homepage layout. Please activate another layout first.',
          400
        );
      }

      await HomeLayout.findByIdAndDelete(id);

      return res.apiSuccess(null, 'Homepage layout deleted successfully');
    } catch (error) {
      logger.error('Error deleting homepage layout:', {
        error: error.message,
        stack: error.stack,
      });
      return res.apiError('Failed to delete homepage layout', 500);
    }
  }
);

export default router;
