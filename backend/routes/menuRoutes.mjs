import express from 'express';
import Menu from '../models/Menu.mjs';
import Page from '../models/Page.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/menus
 * @desc    Get all menus with filtering and pagination
 * @access  Private (requires menus.view permission - admin, manager)
 */
router.get('/', requireAuth(), requirePermission('menus.view'), async (req, res) => {
  try {
    const { location, isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (location) {
      filter.location = location;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const menus = await Menu.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-__v');

    const total = await Menu.countDocuments(filter);

    return res.apiSuccess(
      {
        menus,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Menus retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching menus:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch menus', 500);
  }
});

/**
 * @route   GET /api/admin/menus/:id
 * @desc    Get a single menu by ID
 * @access  Private (requires menus.view permission - admin, manager)
 */
router.get('/:id', requireAuth(), requirePermission('menus.view'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.apiError('Invalid menu ID format', 400);
    }

    const menu = await Menu.findById(id);

    if (!menu) {
      return res.apiError('Menu not found', 404);
    }

    return res.apiSuccess(menu, 'Menu retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch menu', 500);
  }
});

/**
 * @route   POST /api/admin/menus
 * @desc    Create a new menu
 * @access  Private (requires menus.create permission - admin only)
 */
router.post(
  '/',
  requireAuth(),
  requirePermission('menus.create'),
  logAdminAction('MENU_CREATE', (req) => ({ type: 'Menu', name: req.body.name })),
  async (req, res) => {
    try {
      const { name, location, items, isActive } = req.body;

      // Validation
      if (!name || !location) {
        return res.apiError('Name and location are required', 400);
      }

      if (!['header', 'footer'].includes(location)) {
        return res.apiError('Location must be either header or footer', 400);
      }

      // Validate items if provided
      if (items && !Array.isArray(items)) {
        return res.apiError('Items must be an array', 400);
      }

      // Validate item structure
      if (items) {
        for (const item of items) {
          if (!item.label) {
            return res.apiError('Each menu item must have a label', 400);
          }
          if (!item.pageSlug && !item.externalUrl) {
            return res.apiError(
              'Each menu item must have either pageSlug or externalUrl',
              400
            );
          }
          if (item.pageSlug && item.externalUrl) {
            return res.apiError(
              'Menu item cannot have both pageSlug and externalUrl',
              400
            );
          }
          if (item.order === undefined || item.order === null) {
            return res.apiError('Each menu item must have an order', 400);
          }
          // Validate external URL format
          if (item.externalUrl) {
            try {
              new URL(item.externalUrl);
            } catch {
              return res.apiError(`Invalid external URL: ${item.externalUrl}`, 400);
            }
          }
          // Validate page slug exists if provided
          if (item.pageSlug) {
            const page = await Page.findBySlug(item.pageSlug);
            if (!page) {
              return res.apiError(`Page with slug "${item.pageSlug}" not found`, 400);
            }
          }
        }
      }

      const menu = await Menu.create({
        name: name.trim(),
        location,
        items: items || [],
        isActive: isActive !== undefined ? isActive : true,
      });

      return res.apiSuccess(menu, 'Menu created successfully', 201);
    } catch (error) {
      logger.error('Error creating menu:', { error: error.message, stack: error.stack });
      return res.apiError(error.message || 'Failed to create menu', 500);
    }
  }
);

/**
 * @route   PUT /api/admin/menus/:id
 * @desc    Update a menu
 * @access  Private (requires menus.update permission - admin only)
 */
router.put(
  '/:id',
  requireAuth(),
  requirePermission('menus.update'),
  logAdminAction('MENU_UPDATE', (req) => ({ type: 'Menu', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, location, items, isActive } = req.body;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid menu ID format', 400);
      }

      // Find the menu
      const menu = await Menu.findById(id);
      if (!menu) {
        return res.apiError('Menu not found', 404);
      }

      // Validate location if provided
      if (location && !['header', 'footer'].includes(location)) {
        return res.apiError('Location must be either header or footer', 400);
      }

      // Validate items if provided
      if (items) {
        if (!Array.isArray(items)) {
          return res.apiError('Items must be an array', 400);
        }

        for (const item of items) {
          if (!item.label) {
            return res.apiError('Each menu item must have a label', 400);
          }
          if (!item.pageSlug && !item.externalUrl) {
            return res.apiError(
              'Each menu item must have either pageSlug or externalUrl',
              400
            );
          }
          if (item.pageSlug && item.externalUrl) {
            return res.apiError(
              'Menu item cannot have both pageSlug and externalUrl',
              400
            );
          }
          if (item.order === undefined || item.order === null) {
            return res.apiError('Each menu item must have an order', 400);
          }
          // Validate external URL format
          if (item.externalUrl) {
            try {
              new URL(item.externalUrl);
            } catch {
              return res.apiError(`Invalid external URL: ${item.externalUrl}`, 400);
            }
          }
          // Validate page slug exists if provided
          if (item.pageSlug) {
            const page = await Page.findBySlug(item.pageSlug);
            if (!page) {
              return res.apiError(`Page with slug "${item.pageSlug}" not found`, 400);
            }
          }
        }
      }

      // Whitelist allowed fields for update
      const allowedFields = ['name', 'location', 'items', 'isActive'];
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

      const updatedMenu = await Menu.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedMenu) {
        return res.apiError('Menu not found', 404);
      }

      return res.apiSuccess(updatedMenu, 'Menu updated successfully');
    } catch (error) {
      logger.error('Error updating menu:', { error: error.message, stack: error.stack });
      return res.apiError(error.message || 'Failed to update menu', 500);
    }
  }
);

/**
 * @route   DELETE /api/admin/menus/:id
 * @desc    Delete a menu
 * @access  Private (requires menus.delete permission - admin only)
 */
router.delete(
  '/:id',
  requireAuth(),
  requirePermission('menus.delete'),
  logAdminAction('MENU_DELETE', (req) => ({ type: 'Menu', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid menu ID format', 400);
      }

      const menu = await Menu.findByIdAndDelete(id);

      if (!menu) {
        return res.apiError('Menu not found', 404);
      }

      return res.apiSuccess(null, 'Menu deleted successfully');
    } catch (error) {
      logger.error('Error deleting menu:', { error: error.message, stack: error.stack });
      return res.apiError('Failed to delete menu', 500);
    }
  }
);

export default router;
