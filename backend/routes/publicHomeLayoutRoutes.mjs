import express from 'express';
import HomeLayout from '../models/HomeLayout.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';
import logger from '../config/logger.mjs';
import { generateHomepageSchemas } from '../services/structuredDataService.mjs';
import { publicCacheMiddleware } from '../middlewares/publicCacheMiddleware.mjs';
import { publicRateLimiter } from '../middlewares/publicRateLimiter.mjs';

const router = express.Router();

// Apply public rate limiter and cache middleware to all routes
router.use(publicRateLimiter);
router.use(publicCacheMiddleware(300)); // Cache for 5 minutes

/**
 * @route   GET /api/home-layout
 * @desc    Get the active homepage layout for public display
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const layout = await HomeLayout.getActiveLayout();

    if (!layout) {
      return res.apiError('No active homepage layout found', 404);
    }

    // Filter out inactive sections
    const activeSections = layout.sections
      .filter((section) => section.isActive !== false)
      .sort((a, b) => a.order - b.order);

    // Fetch global settings for organization schema
    let globalSettings = null;
    try {
      globalSettings = await GlobalSettings.findOne({ key: 'global' });
    } catch (error) {
      logger.warn('Could not fetch global settings for structured data:', {
        error: error.message,
      });
    }

    // Generate structured data schemas for homepage
    const structuredData = generateHomepageSchemas(layout, globalSettings);

    // Build public response with SEO, structured data, and cache headers
    const publicData = {
      name: layout.name,
      sections: activeSections,
      seo: layout.seo || {},
      updatedAt: layout.updatedAt,
    };

    // Only include structuredData if schemas were generated
    if (structuredData.length > 0) {
      publicData.structuredData = structuredData;
    }

    return res.apiSuccess(publicData, 'Active homepage layout retrieved successfully');
  } catch (error) {
    logger.error('Error fetching public homepage layout:', {
      error: error.message,
      stack: error.stack,
    });
    return res.apiError('Failed to fetch homepage layout', 500);
  }
});

export default router;
