/**
 * Global Settings Routes
 *
 * @module routes/globalSettingsRoutes
 * @description Admin endpoints for managing global application settings
 *
 * Endpoints:
 * - GET /api/admin/global-settings - Get global settings (admin, manager)
 * - PUT /api/admin/global-settings - Update global settings (admin only)
 */

import express from 'express';
import GlobalSettings from '../models/GlobalSettings.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/global-settings
 * @desc    Get global settings
 * @access  Private (admin, manager - requires settings.view permission)
 */
router.get('/', requireAuth(), requirePermission('settings.view'), async (req, res) => {
  try {
    const settings = await GlobalSettings.getGlobalSettings();

    logger.info('Global settings retrieved', {
      userId: req.user.id,
      role: req.user.role,
    });

    return res.apiSuccess(settings, 'Global settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching global settings:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    return res.apiError('Failed to fetch global settings', 500);
  }
});

/**
 * @route   PUT /api/admin/global-settings
 * @desc    Update global settings
 * @access  Private (admin only - requires settings.update permission)
 */
router.put(
  '/',
  requireAuth(),
  requirePermission('settings.update'),
  logAdminAction('GLOBAL_SETTINGS_UPDATE', { type: 'GlobalSettings', name: 'Global Settings' }),
  async (req, res) => {
    try {
      const {
        siteName,
        logo,
        contactEmail,
        contactPhone,
        address,
        currency,
        defaultLanguage,
        featureFlags,
      } = req.body;

      // Build updates object with only provided fields
      const updates = {};
      if (siteName !== undefined) updates.siteName = siteName;
      if (logo !== undefined) updates.logo = logo;
      if (contactEmail !== undefined) updates.contactEmail = contactEmail;
      if (contactPhone !== undefined) updates.contactPhone = contactPhone;
      if (address !== undefined) updates.address = address;
      if (currency !== undefined) updates.currency = currency;
      if (defaultLanguage !== undefined) updates.defaultLanguage = defaultLanguage;
      if (featureFlags !== undefined) {
        // Convert plain object to Map if needed
        if (typeof featureFlags === 'object' && !featureFlags instanceof Map) {
          updates.featureFlags = new Map(Object.entries(featureFlags));
        } else {
          updates.featureFlags = featureFlags;
        }
      }

      // Update settings
      const settings = await GlobalSettings.updateGlobalSettings(updates);

      logger.info('Global settings updated', {
        userId: req.user.id,
        role: req.user.role,
        updatedFields: Object.keys(updates),
      });

      return res.apiSuccess(settings, 'Global settings updated successfully');
    } catch (error) {
      logger.error('Error updating global settings:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.apiError(`Validation error: ${messages.join(', ')}`, 400);
      }

      return res.apiError('Failed to update global settings', 500);
    }
  }
);

export default router;
