import express from 'express';
import RobotsConfig from '../models/RobotsConfig.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/robots-config
 * @desc    Get current robots.txt configuration
 * @access  Private (requires settings.view permission - admin, manager)
 */
router.get('/', requireAuth(), requirePermission('settings.view'), async (req, res) => {
  try {
    const config = await RobotsConfig.getConfig();
    return res.apiSuccess(config, 'Robots.txt configuration retrieved successfully');
  } catch (error) {
    logger.error('Error fetching robots config:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to fetch robots.txt configuration', 500);
  }
});

/**
 * @route   PUT /api/admin/robots-config
 * @desc    Update robots.txt configuration
 * @access  Private (requires settings.update permission - admin only)
 */
router.put(
  '/',
  requireAuth(),
  requirePermission('settings.update'),
  logAdminAction('ROBOTS_CONFIG_UPDATE', () => ({ type: 'RobotsConfig' })),
  async (req, res) => {
    try {
      const { enabled, sitemapUrl, rules } = req.body;

      // Get existing config
      const config = await RobotsConfig.getConfig();

      // Validate rules if provided
      if (rules) {
        if (!Array.isArray(rules)) {
          return res.apiError('Rules must be an array', 400);
        }

        for (const rule of rules) {
          if (!rule.userAgent) {
            return res.apiError('Each rule must have a userAgent', 400);
          }

          if (rule.allow && !Array.isArray(rule.allow)) {
            return res.apiError('Allow must be an array', 400);
          }

          if (rule.disallow && !Array.isArray(rule.disallow)) {
            return res.apiError('Disallow must be an array', 400);
          }

          if (rule.crawlDelay !== undefined && rule.crawlDelay !== null) {
            const delay = Number(rule.crawlDelay);
            if (isNaN(delay) || delay < 0 || delay > 60) {
              return res.apiError('Crawl delay must be between 0 and 60 seconds', 400);
            }
          }
        }
      }

      // Update config
      if (enabled !== undefined) config.enabled = enabled;
      if (sitemapUrl !== undefined) config.sitemapUrl = sitemapUrl;
      if (rules !== undefined) config.rules = rules;

      await config.save();

      return res.apiSuccess(config, 'Robots.txt configuration updated successfully');
    } catch (error) {
      logger.error('Error updating robots config:', { error: error.message, stack: error.stack });
      return res.apiError(error.message || 'Failed to update robots.txt configuration', 500);
    }
  }
);

/**
 * @route   GET /api/admin/robots-config/preview
 * @desc    Preview generated robots.txt
 * @access  Private (requires settings.view permission - admin, manager)
 */
router.get('/preview', requireAuth(), requirePermission('settings.view'), async (req, res) => {
  try {
    const config = await RobotsConfig.getConfig();
    const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://gnbtransfer.com';
    const robotsTxt = config.generateRobotsTxt(siteUrl);

    return res.apiSuccess({ content: robotsTxt }, 'Robots.txt preview generated successfully');
  } catch (error) {
    logger.error('Error generating robots.txt preview:', { error: error.message, stack: error.stack });
    return res.apiError('Failed to generate robots.txt preview', 500);
  }
});

/**
 * @route   POST /api/admin/robots-config/reset
 * @desc    Reset robots.txt configuration to defaults
 * @access  Private (requires settings.update permission - admin only)
 */
router.post(
  '/reset',
  requireAuth(),
  requirePermission('settings.update'),
  logAdminAction('ROBOTS_CONFIG_RESET', () => ({ type: 'RobotsConfig' })),
  async (req, res) => {
    try {
      // Delete existing config to trigger default creation
      await RobotsConfig.deleteMany({});
      const config = await RobotsConfig.getConfig();

      return res.apiSuccess(config, 'Robots.txt configuration reset to defaults');
    } catch (error) {
      logger.error('Error resetting robots config:', { error: error.message, stack: error.stack });
      return res.apiError('Failed to reset robots.txt configuration', 500);
    }
  }
);

export default router;
