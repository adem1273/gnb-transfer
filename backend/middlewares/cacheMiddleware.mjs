/**
 * Cache Middleware
 * 
 * Provides Express middleware for caching HTTP responses with:
 * - Configurable TTL
 * - Custom key generation
 * - Tag-based invalidation
 * - Cache hit/miss metrics
 */

import { get, set, deletePattern, invalidateTag, getStats } from '../utils/cache.mjs';
import logger from '../config/logger.mjs';

/**
 * Check if status code indicates success (2xx range)
 */
const isSuccessStatusCode = (statusCode) => statusCode >= 200 && statusCode < 300;

/**
 * Cache response middleware
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 300 = 5 minutes)
 * @param {Object} options - Additional options
 * @param {Function} options.keyGenerator - Custom key generator function(req)
 * @param {string[]} options.tags - Tags for grouped invalidation
 * @param {boolean} options.varyByUser - Include user ID in cache key (default: false)
 * @returns {Function} Express middleware
 */
export const cacheResponse = (ttlSeconds = 300, options = {}) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const {
      keyGenerator = null,
      tags = [],
      varyByUser = false,
    } = options;

    try {
      // Generate cache key
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        cacheKey = `route:${req.originalUrl}`;
        // Include user ID in key if varyByUser is true
        if (varyByUser && req.user && req.user._id) {
          cacheKey = `${cacheKey}:user:${req.user._id}`;
        }
      }

      // Try to get from cache
      const cached = await get(cacheKey);
      if (cached) {
        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        logger.debug('Cache hit for request', { key: cacheKey, url: req.originalUrl });
        return res.json(cached);
      }

      // Cache miss
      res.setHeader('X-Cache', 'MISS');
      logger.debug('Cache miss for request', { key: cacheKey, url: req.originalUrl });

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (data) => {
        // Only cache successful responses
        if (isSuccessStatusCode(res.statusCode)) {
          set(cacheKey, data, ttlSeconds, tags).catch((err) => {
            logger.error('Failed to cache response', {
              key: cacheKey,
              error: err.message,
            });
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Clear cache on mutation (POST, PUT, PATCH, DELETE)
 * @param {string[]} patterns - Array of cache key patterns to clear
 * @returns {Function} Express middleware
 */
export const clearCacheOnMutation = (patterns) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Clear cache patterns on successful mutations
      if (isSuccessStatusCode(res.statusCode)) {
        try {
          for (const pattern of patterns) {
            await deletePattern(pattern);
          }
          logger.info('Cache invalidated on mutation', {
            patterns,
            method: req.method,
            url: req.originalUrl,
          });
        } catch (error) {
          logger.error('Failed to invalidate cache', {
            patterns,
            error: error.message,
          });
        }
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache by tags on mutation
 * @param {string[]} tags - Array of tags to invalidate
 * @returns {Function} Express middleware
 */
export const clearCacheByTags = (tags) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (isSuccessStatusCode(res.statusCode)) {
        try {
          for (const tag of tags) {
            await invalidateTag(tag);
          }
          logger.info('Cache tags invalidated on mutation', {
            tags,
            method: req.method,
            url: req.originalUrl,
          });
        } catch (error) {
          logger.error('Failed to invalidate cache tags', {
            tags,
            error: error.message,
          });
        }
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Get cache statistics endpoint
 */
export const getCacheStatsEndpoint = (req, res) => {
  const stats = getStats();
  return res.json({
    success: true,
    data: stats,
  });
};

export default {
  cacheResponse,
  clearCacheOnMutation,
  clearCacheByTags,
  getCacheStatsEndpoint,
};
