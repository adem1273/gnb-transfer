import featureToggleService from '../services/featureToggleService.mjs';

/**
 * Middleware to check if a feature is enabled
 * Returns 503 Service Unavailable if feature is disabled
 *
 * @param {string} featureId - Feature identifier to check
 * @returns {Function} Express middleware
 */
export const requireFeatureEnabled = (featureId) => async (req, res, next) => {
  try {
    const isEnabled = await featureToggleService.isEnabled(featureId);

    if (!isEnabled) {
      return res.status(503).json({
        success: false,
        error: 'Feature not available',
        message: `The feature '${featureId}' is currently disabled`,
      });
    }

    next();
  } catch (error) {
    console.error(`Error checking feature toggle ${featureId}:`, error);
    return res.status(503).json({
      success: false,
      error: 'Feature availability check failed',
    });
  }
};

/**
 * Middleware to attach enabled features to request
 * Useful for frontend to know which features are available
 */
export const attachEnabledFeatures = async (req, res, next) => {
  try {
    const enabledFeatures = await featureToggleService.getEnabledFeatures();
    req.enabledFeatures = enabledFeatures.map((f) => ({
      id: f.id,
      name: f.name,
      route: f.route,
    }));
    next();
  } catch (error) {
    console.error('Error attaching enabled features:', error);
    req.enabledFeatures = [];
    next();
  }
};

export default {
  requireFeatureEnabled,
  attachEnabledFeatures,
};
