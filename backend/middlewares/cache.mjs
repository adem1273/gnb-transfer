/**
 * Cache middleware using node-cache
 * Provides in-memory caching for frequently accessed data
 */

import NodeCache from 'node-cache';

// Create cache instance with configuration
// stdTTL: default time-to-live in seconds (10 minutes)
// checkperiod: period in seconds to check for expired keys (2 minutes)
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone data for better performance
});

/**
 * Middleware to cache GET and HEAD requests
 * @param {number} duration - Cache duration in seconds (default: 600 = 10 minutes)
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware =
  (duration = 600) =>
  (req, res, next) => {
    // Only cache GET and HEAD requests (HEAD is semantically equivalent to GET)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Return cached response
      return res.json(cachedResponse);
    }

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Cache successful responses (200 OK)
      // Note: We only cache 200 responses. Other 2xx codes (201, 204) are typically
      // for mutations and should not be cached. This is intentional for safety.
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      return originalJson(body);
    };

    return next();
  };

/**
 * Clear cache for a specific key or pattern
 * @param {string|RegExp} keyPattern - Key or pattern to clear
 */
export const clearCache = (keyPattern) => {
  if (keyPattern instanceof RegExp) {
    const keys = cache.keys();
    keys.forEach((key) => {
      if (keyPattern.test(key)) {
        cache.del(key);
      }
    });
  } else {
    cache.del(keyPattern);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => cache.getStats();

export default cache;
