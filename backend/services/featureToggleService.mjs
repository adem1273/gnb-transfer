import NodeCache from 'node-cache';
import FeatureToggle from '../models/FeatureToggle.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';
import logger from '../config/logger.mjs';

/**
 * Feature Toggle Service
 * 
 * Manages feature toggles with in-memory caching for performance
 * Cache TTL: 60 seconds
 */
class FeatureToggleService {
  constructor() {
    // Initialize cache with 60 second TTL
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
    this.CACHE_KEY = 'feature_toggles';
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureId - Feature identifier
   * @returns {Promise<boolean>} - True if enabled, false otherwise
   */
  async isEnabled(featureId) {
    try {
      // Try to get from cache first
      const cachedFeatures = this.cache.get(this.CACHE_KEY);
      
      if (cachedFeatures) {
        const feature = cachedFeatures.find((f) => f.id === featureId);
        return feature ? feature.enabled : false;
      }

      // Cache miss - fetch from database
      const features = await FeatureToggle.find().lean();
      this.cache.set(this.CACHE_KEY, features);

      const feature = features.find((f) => f.id === featureId);
      return feature ? feature.enabled : false;
    } catch (error) {
      logger.error(`Error checking feature toggle ${featureId}:`, error);
      return false; // Fail closed - feature disabled on error
    }
  }

  /**
   * Get all feature toggles
   * @returns {Promise<Array>} - Array of all features
   */
  async getAllFeatures() {
    try {
      const cachedFeatures = this.cache.get(this.CACHE_KEY);
      
      if (cachedFeatures) {
        return cachedFeatures;
      }

      const features = await FeatureToggle.find().lean();
      this.cache.set(this.CACHE_KEY, features);
      
      return features;
    } catch (error) {
      logger.error('Error fetching all feature toggles:', error);
      return [];
    }
  }

  /**
   * Get enabled features only
   * @returns {Promise<Array>} - Array of enabled features
   */
  async getEnabledFeatures() {
    try {
      const features = await this.getAllFeatures();
      return features.filter((f) => f.enabled);
    } catch (error) {
      logger.error('Error fetching enabled features:', error);
      return [];
    }
  }

  /**
   * Toggle a feature on or off
   * @param {string} featureId - Feature identifier
   * @param {boolean} enabled - New enabled state
   * @returns {Promise<Object>} - Updated feature
   */
  async toggleFeature(featureId, enabled) {
    try {
      // Sanitize feature ID (simple validation since we control the values)
      const sanitizedFeatureId = String(featureId).trim();

      const feature = await FeatureToggle.findOneAndUpdate(
        { id: sanitizedFeatureId },
        { enabled },
        { new: true }
      );

      if (!feature) {
        throw new Error(`Feature ${sanitizedFeatureId} not found`);
      }

      // Invalidate cache
      this.cache.del(this.CACHE_KEY);

      logger.info(`Feature ${sanitizedFeatureId} ${enabled ? 'enabled' : 'disabled'}`);

      return feature;
    } catch (error) {
      logger.error(`Error toggling feature ${featureId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a feature toggle
   * @param {Object} featureData - Feature data
   * @returns {Promise<Object>} - Created/updated feature
   */
  async createOrUpdateFeature(featureData) {
    try {
      const feature = await FeatureToggle.findOneAndUpdate(
        { id: featureData.id },
        featureData,
        { new: true, upsert: true }
      );

      // Invalidate cache
      this.cache.del(this.CACHE_KEY);

      return feature;
    } catch (error) {
      logger.error('Error creating/updating feature:', error);
      throw error;
    }
  }

  /**
   * Initialize default features
   * @param {Array} features - Array of feature definitions
   */
  async initializeFeatures(features) {
    try {
      await FeatureToggle.initializeFeatures(features);
      
      // Invalidate cache
      this.cache.del(this.CACHE_KEY);
      
      logger.info(`Initialized ${features.length} feature toggles`);
    } catch (error) {
      logger.error('Error initializing features:', error);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.del(this.CACHE_KEY);
  }

  /**
   * Check if a global feature flag is enabled in GlobalSettings
   * 
   * @param {string} flagName - Global flag name (e.g., 'enableBookings')
   * @returns {Promise<boolean>} - True if enabled, false if disabled or error
   */
  async isGlobalFlagEnabled(flagName) {
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
  }

  /**
   * Check system settings flags (bookingEnabled, paymentEnabled, etc.)
   * 
   * @param {string} settingName - Setting name (e.g., 'bookingEnabled')
   * @returns {Promise<boolean>} - True if enabled, false otherwise
   */
  async isSystemSettingEnabled(settingName) {
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
  }

  /**
   * Get site status
   * 
   * @returns {Promise<{status: string, message: string}>}
   */
  async getSiteStatus() {
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
  }

  /**
   * Check if bookings are enabled (combines both flags)
   * 
   * @returns {Promise<boolean>}
   */
  async areBookingsEnabled() {
    try {
      const [systemEnabled, flagEnabled] = await Promise.all([
        this.isSystemSettingEnabled('bookingEnabled'),
        this.isGlobalFlagEnabled('enableBookings'),
      ]);
      return systemEnabled && flagEnabled;
    } catch (error) {
      logger.error('Error checking if bookings enabled:', error);
      return false;
    }
  }

  /**
   * Check if payments are enabled (combines both flags)
   * 
   * @returns {Promise<boolean>}
   */
  async arePaymentsEnabled() {
    try {
      const [systemEnabled, flagEnabled] = await Promise.all([
        this.isSystemSettingEnabled('paymentEnabled'),
        this.isGlobalFlagEnabled('enablePayments'),
      ]);
      return systemEnabled && flagEnabled;
    } catch (error) {
      logger.error('Error checking if payments enabled:', error);
      return false;
    }
  }

  /**
   * Check if registrations are enabled
   * 
   * @returns {Promise<boolean>}
   */
  async areRegistrationsEnabled() {
    try {
      return await this.isSystemSettingEnabled('registrationsEnabled');
    } catch (error) {
      logger.error('Error checking if registrations enabled:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new FeatureToggleService();
