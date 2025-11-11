import NodeCache from 'node-cache';
import FeatureToggle from '../models/FeatureToggle.mjs';
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
      const feature = await FeatureToggle.findOneAndUpdate(
        { id: featureId },
        { enabled },
        { new: true }
      );

      if (!feature) {
        throw new Error(`Feature ${featureId} not found`);
      }

      // Invalidate cache
      this.cache.del(this.CACHE_KEY);

      logger.info(`Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`);
      
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
}

// Export singleton instance
export default new FeatureToggleService();
