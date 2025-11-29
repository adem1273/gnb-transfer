import { cacheGet, cacheSet, cacheDelPattern } from '../services/cacheService.mjs';

export const cacheResponse = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : `route:${req.originalUrl}`;

    // Try to get from cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(cacheKey, data, ttlSeconds);
      }
      return originalJson(data);
    };

    next();
  };
};

export const clearCacheOnMutation = (patterns) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Clear cache patterns on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await cacheDelPattern(pattern);
        }
      }
      return originalJson(data);
    };

    next();
  };
};
