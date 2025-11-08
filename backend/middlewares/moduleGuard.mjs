import AdminSettings from '../models/AdminSettings.mjs';

/**
 * Module Guard Middleware
 *
 * @module middlewares/moduleGuard
 * @description Middleware to check if a module is active before executing route
 *
 * Features:
 * - Checks module status in AdminSettings
 * - Returns 503 Service Unavailable if module is disabled
 * - Caches settings for 5 minutes to reduce DB queries
 */

let cachedSettings = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get admin settings from cache or database
 */
const getSettings = async () => {
  const now = Date.now();
  if (cachedSettings && now - cacheTime < CACHE_DURATION) {
    return cachedSettings;
  }

  let settings = await AdminSettings.findOne();
  if (!settings) {
    // Create default settings if none exist
    settings = await AdminSettings.create({
      activeModules: {
        tours: true,
        users: true,
        bookings: true,
        payments: true,
      },
    });
  }

  cachedSettings = settings;
  cacheTime = now;
  return settings;
};

/**
 * Clear settings cache (useful when settings are updated)
 */
export const clearModuleCache = () => {
  cachedSettings = null;
  cacheTime = 0;
};

/**
 * Middleware to check if a module is active
 *
 * @param {string} moduleName - Name of the module to check (tours, users, bookings, payments)
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/tours', moduleGuard('tours'), tourController);
 */
export const moduleGuard = (moduleName) => async (req, res, next) => {
  try {
    const settings = await getSettings();

    if (!settings.activeModules[moduleName]) {
      return res.status(503).json({
        success: false,
        error: `The ${moduleName} module is currently disabled`,
        code: 'MODULE_DISABLED',
      });
    }

    return next();
  } catch (error) {
    console.error('Module guard error:', error);
    // On error, allow the request through (fail-open for availability)
    return next();
  }
};

export default { moduleGuard, clearModuleCache };
