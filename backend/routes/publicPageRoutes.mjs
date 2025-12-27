import express from 'express';
import Page from '../models/Page.mjs';
import logger from '../config/logger.mjs';

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
    
    // Return page with all fields including SEO
    return res.apiSuccess(
      {
        slug: page.slug,
        title: page.title,
        sections: page.sections,
        seo: page.seo,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
      'Page retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching public page:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch page', 500);
  }
});

export default router;
