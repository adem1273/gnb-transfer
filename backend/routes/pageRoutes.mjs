import express from 'express';
import Page from '../models/Page.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission, requireAnyPermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';
import { PAGINATION } from '../constants/limits.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/pages
 * @desc    Get all pages with filtering and pagination
 * @access  Private (requires pages.view permission - admin, manager)
 */
router.get('/', requireAuth(), requirePermission('pages.view'), async (req, res) => {
  try {
    const { published, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (published !== undefined) {
      filter.published = published === 'true';
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const pages = await Page.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-__v');

    const total = await Page.countDocuments(filter);

    return res.apiSuccess(
      {
        pages,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Pages retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching pages:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch pages', 500);
  }
});

/**
 * @route   GET /api/admin/pages/:slug
 * @desc    Get a single page by slug
 * @access  Private (requires pages.view permission - admin, manager)
 */
router.get('/:slug', requireAuth(), requirePermission('pages.view'), async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await Page.findBySlug(slug);

    if (!page) {
      return res.apiError('Page not found', 404);
    }

    return res.apiSuccess(page, 'Page retrieved successfully');
  } catch (error) {
    logger.error('Error fetching page:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch page', 500);
  }
});

/**
 * @route   POST /api/admin/pages
 * @desc    Create a new page
 * @access  Private (requires pages.create permission - admin only)
 */
router.post(
  '/',
  requireAuth(),
  requirePermission('pages.create'),
  logAdminAction('PAGE_CREATE', (req) => ({ type: 'Page', name: req.body.title })),
  async (req, res) => {
    try {
      const { slug, title, sections, seo, published } = req.body;

      // Validation
      if (!slug || !title) {
        return res.apiError('Slug and title are required', 400);
      }

      // Check if slug already exists
      const existingPage = await Page.findBySlug(slug);
      if (existingPage) {
        return res.apiError('A page with this slug already exists', 400);
      }

      // Validate sections if provided
      if (sections && !Array.isArray(sections)) {
        return res.apiError('Sections must be an array', 400);
      }

      // Validate section structure
      if (sections) {
        for (const section of sections) {
          if (!section.type || !section.content) {
            return res.apiError('Each section must have type and content', 400);
          }
          if (!['text', 'image', 'markdown'].includes(section.type)) {
            return res.apiError(
              'Section type must be text, image, or markdown',
              400
            );
          }
        }
      }

      const page = await Page.create({
        slug: slug.toLowerCase().trim(),
        title: title.trim(),
        sections: sections || [],
        seo: seo || {},
        published: published || false,
      });

      return res.apiSuccess(page, 'Page created successfully', 201);
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.apiError('A page with this slug already exists', 400);
      }
      logger.error('Error creating page:', { error: error.message, stack: error.stack });
      return res.apiError(error.message || 'Failed to create page', 500);
    }
  }
);

/**
 * @route   PUT /api/admin/pages/:id
 * @desc    Update a page
 * @access  Private (requires pages.update permission - admin only)
 */
router.put(
  '/:id',
  requireAuth(),
  requirePermission('pages.update'),
  logAdminAction('PAGE_UPDATE', (req) => ({ type: 'Page', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { slug, title, sections, seo, published } = req.body;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid page ID format', 400);
      }

      // Find the page
      const page = await Page.findById(id);
      if (!page) {
        return res.apiError('Page not found', 404);
      }

      // If slug is being changed, check uniqueness
      if (slug && slug.toLowerCase() !== page.slug) {
        const existingPage = await Page.findBySlug(slug);
        if (existingPage) {
          return res.apiError('A page with this slug already exists', 400);
        }
      }

      // Validate sections if provided
      if (sections) {
        if (!Array.isArray(sections)) {
          return res.apiError('Sections must be an array', 400);
        }

        for (const section of sections) {
          if (!section.type || !section.content) {
            return res.apiError('Each section must have type and content', 400);
          }
          if (!['text', 'image', 'markdown'].includes(section.type)) {
            return res.apiError(
              'Section type must be text, image, or markdown',
              400
            );
          }
        }
      }

      // Whitelist allowed fields for update
      const allowedFields = ['slug', 'title', 'sections', 'seo', 'published'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Normalize slug if provided
      if (updates.slug) {
        updates.slug = updates.slug.toLowerCase().trim();
      }

      const updatedPage = await Page.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedPage) {
        return res.apiError('Page not found', 404);
      }

      return res.apiSuccess(updatedPage, 'Page updated successfully');
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.apiError('A page with this slug already exists', 400);
      }
      logger.error('Error updating page:', { error: error.message, stack: error.stack });
      return res.apiError(error.message || 'Failed to update page', 500);
    }
  }
);

/**
 * @route   DELETE /api/admin/pages/:id
 * @desc    Delete a page
 * @access  Private (requires pages.delete permission - admin only)
 */
router.delete(
  '/:id',
  requireAuth(),
  requirePermission('pages.delete'),
  logAdminAction('PAGE_DELETE', (req) => ({ type: 'Page', id: req.params.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.apiError('Invalid page ID format', 400);
      }

      const page = await Page.findByIdAndDelete(id);

      if (!page) {
        return res.apiError('Page not found', 404);
      }

      return res.apiSuccess(null, 'Page deleted successfully');
    } catch (error) {
      logger.error('Error deleting page:', { error: error.message, stack: error.stack });
      return res.apiError('Failed to delete page', 500);
    }
  }
);

export default router;
