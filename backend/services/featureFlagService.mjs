import FeatureToggle from '../models/FeatureToggle.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';
import logger from '../config/logger.mjs';

/**
 * Feature Flag Service
 * 
 * Provides safe access to feature flags from multiple sources:
 * - FeatureToggle model (admin panel toggles)
 * - GlobalSettings model (global feature flags)
 * 
 * This service handles errors gracefully and provides fallback values
 * to ensure features don't break due to database issues.
 */

// Flag name constants for consistency
const SYSTEM_FLAGS = {
  BOOKING_ENABLED: 'bookingEnabled',
  PAYMENT_ENABLED: 'paymentEnabled',
  REGISTRATIONS_ENABLED: 'registrationsEnabled',
};

const GLOBAL_FLAGS = {
  ENABLE_BOOKINGS: 'enableBookings',
  ENABLE_PAYMENTS: 'enablePayments',
};

/**
 * Check if a feature flag is enabled in FeatureToggle model
 * 
 * @param {string} featureId - Feature identifier
 * @returns {Promise<boolean>} - True if enabled, false otherwise
 */
export const isFeatureEnabled = async (featureId) => {
  try {
    const feature = await FeatureToggle.findOne({ id: featureId });
    return feature ? feature.enabled : false;
  } catch (error) {
    logger.error(`Error checking feature flag ${featureId}:`, error);
    return false;
  }
};

/**
 * Check if a global feature flag is enabled in GlobalSettings
 * 
 * @param {string} flagName - Global flag name (e.g., 'enableBookings')
 * @returns {Promise<boolean>} - True if enabled, false if disabled or error
 */
export const isGlobalFlagEnabled = async (flagName) => {
  try {
    const settings = await GlobalSettings.getGlobalSettings();
    if (!settings || !settings.featureFlags) {
      return true; // Default to enabled if settings don't exist (backward compatibility)
    }
    // Return true if flag is not set (backward compatibility) or explicitly true
    const flagValue = settings.featureFlags.get(flagName);
    return flagValue === undefined || flagValue === true;
  } catch (error) {
    logger.error(`Error checking global flag ${flagName}:`, error);
    return true; // Default to enabled on error (fail open for backward compatibility)
  }
};

/**
 * Check system settings flags (bookingEnabled, paymentEnabled, etc.)
 * 
 * @param {string} settingName - Setting name (e.g., 'bookingEnabled')
 * @returns {Promise<boolean>} - True if enabled, false otherwise
 */
export const isSystemSettingEnabled = async (settingName) => {
  try {
    const settings = await GlobalSettings.getGlobalSettings();
    if (!settings) {
      return false;
    }
    return settings[settingName] === true;
  } catch (error) {
    logger.error(`Error checking system setting ${settingName}:`, error);
    return false;
  }
};

/**
 * Get site status
 * 
 * @returns {Promise<{status: string, message: string}>}
 */
export const getSiteStatus = async () => {
  try {
    const settings = await GlobalSettings.getGlobalSettings();
    if (!settings) {
      return { status: 'online', message: '' };
    }
    return {
      status: settings.siteStatus || 'online',
      message: settings.maintenanceMessage || '',
    };
  } catch (error) {
    logger.error('Error getting site status:', error);
    return { status: 'online', message: '' };
  }
};

/**
 * Check if bookings are enabled (combines both flags)
 * 
 * @returns {Promise<boolean>}
 */
export const areBookingsEnabled = async () => {
  try {
    const [systemEnabled, flagEnabled] = await Promise.all([
      isSystemSettingEnabled(SYSTEM_FLAGS.BOOKING_ENABLED),
      isGlobalFlagEnabled(GLOBAL_FLAGS.ENABLE_BOOKINGS),
    ]);
    return systemEnabled && flagEnabled;
  } catch (error) {
    logger.error('Error checking if bookings enabled:', error);
    return false;
  }
};

/**
 * Check if payments are enabled (combines both flags)
 * 
 * @returns {Promise<boolean>}
 */
export const arePaymentsEnabled = async () => {
  try {
    const [systemEnabled, flagEnabled] = await Promise.all([
      isSystemSettingEnabled(SYSTEM_FLAGS.PAYMENT_ENABLED),
      isGlobalFlagEnabled(GLOBAL_FLAGS.ENABLE_PAYMENTS),
    ]);
    return systemEnabled && flagEnabled;
  } catch (error) {
    logger.error('Error checking if payments enabled:', error);
    return false;
  }
};

/**
 * Check if registrations are enabled
 * 
 * @returns {Promise<boolean>}
 */
export const areRegistrationsEnabled = async () => {
  try {
    return await isSystemSettingEnabled(SYSTEM_FLAGS.REGISTRATIONS_ENABLED);
  } catch (error) {
    logger.error('Error checking if registrations enabled:', error);
    return false;
  }
};

export default {
  isFeatureEnabled,
  isGlobalFlagEnabled,
  isSystemSettingEnabled,
  getSiteStatus,
  areBookingsEnabled,
  arePaymentsEnabled,
  areRegistrationsEnabled,
};
