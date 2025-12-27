/**
 * Super Admin Routes
 *
 * @module routes/superAdminRoutes
 * @description Super admin only endpoints for system-wide controls
 *
 * All endpoints require super admin authentication
 * All actions are logged for audit trail
 *
 * Endpoints:
 * - GET /api/v1/super-admin/system-settings - Get system settings
 * - PUT /api/v1/super-admin/system-settings - Update system settings
 * - POST /api/v1/super-admin/kill-switch - Emergency kill switch
 * - POST /api/v1/super-admin/restore - Restore system after kill switch
 */

import express from 'express';
import GlobalSettings from '../models/GlobalSettings.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requireSuperAdmin } from '../middlewares/adminGuard.mjs';
import { logAdminAction } from '../middlewares/auditLogger.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/v1/super-admin/system-settings
 * @desc    Get system settings
 * @access  Super Admin only
 */
router.get(
  '/system-settings',
  requireAuth(),
  requireSuperAdmin,
  async (req, res) => {
    try {
      const settings = await GlobalSettings.getGlobalSettings();

      // Return only system control fields
      const systemSettings = {
        siteStatus: settings.siteStatus,
        maintenanceMessage: settings.maintenanceMessage,
        bookingEnabled: settings.bookingEnabled,
        paymentEnabled: settings.paymentEnabled,
        registrationsEnabled: settings.registrationsEnabled,
        forceLogoutAll: settings.forceLogoutAll,
        updatedAt: settings.updatedAt,
      };

      return res.apiSuccess(systemSettings, 'System settings retrieved successfully');
    } catch (error) {
      logger.error('Error getting system settings:', error);
      return res.apiError('Failed to retrieve system settings', 500);
    }
  }
);

/**
 * @route   PUT /api/v1/super-admin/system-settings
 * @desc    Update system settings
 * @access  Super Admin only
 */
router.put(
  '/system-settings',
  requireAuth(),
  requireSuperAdmin,
  logAdminAction('SYSTEM_SETTINGS_UPDATE', 'SystemSettings'),
  async (req, res) => {
    try {
      const {
        siteStatus,
        maintenanceMessage,
        bookingEnabled,
        paymentEnabled,
        registrationsEnabled,
        forceLogoutAll,
      } = req.body;

      // Build update object with only provided fields
      const updates = {};
      if (siteStatus !== undefined) updates.siteStatus = siteStatus;
      if (maintenanceMessage !== undefined) updates.maintenanceMessage = maintenanceMessage;
      if (bookingEnabled !== undefined) updates.bookingEnabled = bookingEnabled;
      if (paymentEnabled !== undefined) updates.paymentEnabled = paymentEnabled;
      if (registrationsEnabled !== undefined) updates.registrationsEnabled = registrationsEnabled;
      if (forceLogoutAll !== undefined) updates.forceLogoutAll = forceLogoutAll;

      const settings = await GlobalSettings.updateGlobalSettings(updates);

      logger.info(`System settings updated by super admin ${req.user.email}`, {
        userId: req.user.id,
        updates,
      });

      // Return only system control fields
      const systemSettings = {
        siteStatus: settings.siteStatus,
        maintenanceMessage: settings.maintenanceMessage,
        bookingEnabled: settings.bookingEnabled,
        paymentEnabled: settings.paymentEnabled,
        registrationsEnabled: settings.registrationsEnabled,
        forceLogoutAll: settings.forceLogoutAll,
        updatedAt: settings.updatedAt,
      };

      return res.apiSuccess(systemSettings, 'System settings updated successfully');
    } catch (error) {
      logger.error('Error updating system settings:', error);
      return res.apiError('Failed to update system settings', 500);
    }
  }
);

/**
 * @route   POST /api/v1/super-admin/kill-switch
 * @desc    Emergency kill switch - immediately disable critical features
 * @access  Super Admin only
 */
router.post(
  '/kill-switch',
  requireAuth(),
  requireSuperAdmin,
  logAdminAction('KILL_SWITCH_ACTIVATED', 'SystemSettings'),
  async (req, res) => {
    try {
      const updates = {
        siteStatus: 'maintenance',
        bookingEnabled: false,
        paymentEnabled: false,
        maintenanceMessage:
          req.body.message || 'Emergency maintenance in progress. We apologize for the inconvenience.',
      };

      const settings = await GlobalSettings.updateGlobalSettings(updates);

      logger.warn(`🚨 KILL SWITCH ACTIVATED by super admin ${req.user.email}`, {
        userId: req.user.id,
        reason: req.body.reason || 'Not specified',
      });

      return res.apiSuccess(
        {
          siteStatus: settings.siteStatus,
          bookingEnabled: settings.bookingEnabled,
          paymentEnabled: settings.paymentEnabled,
          maintenanceMessage: settings.maintenanceMessage,
        },
        'Kill switch activated successfully'
      );
    } catch (error) {
      logger.error('Error activating kill switch:', error);
      return res.apiError('Failed to activate kill switch', 500);
    }
  }
);

/**
 * @route   POST /api/v1/super-admin/restore
 * @desc    Deactivate kill switch - restore normal operations
 * @access  Super Admin only
 */
router.post(
  '/restore',
  requireAuth(),
  requireSuperAdmin,
  logAdminAction('SYSTEM_SETTINGS_UPDATE', 'SystemSettings'),
  async (req, res) => {
    try {
      const updates = {
        siteStatus: 'online',
        bookingEnabled: true,
        paymentEnabled: true,
        maintenanceMessage: '', // Clear emergency message when restoring
      };

      const settings = await GlobalSettings.updateGlobalSettings(updates);

      logger.info(`System restored to normal operations by super admin ${req.user.email}`, {
        userId: req.user.id,
      });

      return res.apiSuccess(
        {
          siteStatus: settings.siteStatus,
          bookingEnabled: settings.bookingEnabled,
          paymentEnabled: settings.paymentEnabled,
        },
        'System restored successfully'
      );
    } catch (error) {
      logger.error('Error restoring system:', error);
      return res.apiError('Failed to restore system', 500);
    }
  }
);

export default router;
