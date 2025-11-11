import express from 'express';
import featureToggleService from '../services/featureToggleService.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/features
 * @desc    Get all feature toggles
 * @access  Private (admin only)
 */
router.get('/', requireAuth(['admin']), async (req, res) => {
  try {
    const features = await featureToggleService.getAllFeatures();
    return res.apiSuccess(features, 'Features retrieved successfully');
  } catch (error) {
    console.error('Error fetching features:', error);
    return res.apiError('Failed to fetch features', 500);
  }
});

/**
 * @route   GET /api/admin/features/enabled
 * @desc    Get enabled feature toggles only
 * @access  Private (requires view_features permission)
 */
router.get('/enabled', requireAuth(), requirePermission('settings.view'), async (req, res) => {
  try {
    const features = await featureToggleService.getEnabledFeatures();
    return res.apiSuccess(features, 'Enabled features retrieved successfully');
  } catch (error) {
    console.error('Error fetching enabled features:', error);
    return res.apiError('Failed to fetch enabled features', 500);
  }
});

/**
 * @route   POST /api/admin/features/toggle
 * @desc    Toggle a feature on or off
 * @access  Private (admin only)
 */
router.post(
  '/toggle',
  requireAuth(['admin']),
  logAdminAction('FEATURE_TOGGLE', (req) => ({
    type: 'FeatureToggle',
    name: req.body.featureId,
    enabled: req.body.enabled,
  })),
  async (req, res) => {
    try {
      const { featureId, enabled } = req.body;

      if (!featureId || typeof enabled !== 'boolean') {
        return res.apiError('featureId and enabled (boolean) are required', 400);
      }

      const feature = await featureToggleService.toggleFeature(featureId, enabled);
      
      return res.apiSuccess(
        feature,
        `Feature ${enabled ? 'enabled' : 'disabled'} successfully`
      );
    } catch (error) {
      console.error('Error toggling feature:', error);
      return res.apiError(error.message || 'Failed to toggle feature', 500);
    }
  }
);

/**
 * @route   GET /api/admin/features/:id
 * @desc    Get a specific feature by ID
 * @access  Private (requires settings.view permission)
 */
router.get('/:id', requireAuth(), requirePermission('settings.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const features = await featureToggleService.getAllFeatures();
    const feature = features.find((f) => f.id === id);

    if (!feature) {
      return res.apiError('Feature not found', 404);
    }

    return res.apiSuccess(feature, 'Feature retrieved successfully');
  } catch (error) {
    console.error('Error fetching feature:', error);
    return res.apiError('Failed to fetch feature', 500);
  }
});

export default router;
