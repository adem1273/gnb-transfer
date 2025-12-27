import express from 'express';
import Page from '../models/Page.mjs';
import logger from '../config/logger.mjs';
import { generatePageSchemas } from '../services/structuredDataService.mjs';

const router = express.Router();

/**
 * @route   GET /api/pages/:slug
 * @desc    Get a published page by slug (public endpoint)
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await Page.findBySlug(slug);

    // Return 404 if page not found or not published
    if (!page || !page.published) {
      return res.apiError('Page not found', 404);
    }

    // Set basic caching headers (cache for 5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    
    // Generate structured data schemas if enabled
    const structuredData = generatePageSchemas(page, {
      language: req.query.lang || 'en',
      includeMenuItems: true,
    });
    
    // Return page with all fields including SEO and structured data
    const responseData = {
      slug: page.slug,
      title: page.title,
      sections: page.sections,
      seo: page.seo,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
    
    // Only include structuredData if schemas were generated
    if (structuredData.length > 0) {
      responseData.structuredData = structuredData;
    }
    
    return res.apiSuccess(
      responseData,
      'Page retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching public page:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch page', 500);
  }
});

export default router;
