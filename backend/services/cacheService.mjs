import Redis from 'ioredis';
import logger from '../config/logger.mjs';

let redis = null;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not set. Using in-memory cache fallback.');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.error('Redis error:', { error: err.message }));

    return redis;
  } catch (error) {
    logger.error('Redis init failed:', { error: error.message });
    return null;
  }
};

// In-memory fallback cache
const memoryCache = new Map();
const memoryCacheTTL = new Map();

// Periodic cleanup for expired entries (runs every 2 minutes)
const CLEANUP_INTERVAL_MS = 120000;
let cleanupInterval = null;

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, expiryTime] of memoryCacheTTL.entries()) {
    if (expiryTime < now) {
      memoryCache.delete(key);
      memoryCacheTTL.delete(key);
    }
  }
};

// Start cleanup interval if not already running
const startCleanupInterval = () => {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
    // Don't block process from exiting
    cleanupInterval.unref();
  }
};

export const cacheGet = async (key) => {
  try {
    if (redis) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }

    // Fallback to memory cache
    if (memoryCacheTTL.has(key) && memoryCacheTTL.get(key) < Date.now()) {
      memoryCache.delete(key);
      memoryCacheTTL.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  } catch (error) {
    logger.error('Cache get error:', { key, error: error.message });
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      memoryCache.set(key, value);
      memoryCacheTTL.set(key, Date.now() + ttlSeconds * 1000);
      // Start cleanup interval when first entry is added
      startCleanupInterval();
    }
    return true;
  } catch (error) {
    logger.error('Cache set error:', { key, error: error.message });
    return false;
  }
};

export const cacheDel = async (key) => {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
      memoryCacheTTL.delete(key);
    }
    return true;
  } catch (error) {
    logger.error('Cache del error:', { key, error: error.message });
    return false;
  }
};

/**
 * Convert Redis-style pattern to a matcher function.
 * Redis patterns use * to match any characters (including /),
 * which differs from file glob patterns.
 */
const matchesRedisPattern = (key, pattern) => {
  // Convert Redis pattern to regex:
  // * matches any characters (including /)
  // ? matches exactly one character
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
    .replace(/\*/g, '.*') // * -> .* (match any characters)
    .replace(/\?/g, '.'); // ? -> . (match one character)

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(key);
};

export const cacheDelPattern = async (pattern) => {
  try {
    if (redis) {
      // Note: redis.keys() can be slow on large datasets. For production
      // with many keys, consider using redis.scan() or a key tracking mechanism.
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Use Redis-compatible pattern matching for memory cache
      const keysToDelete = [];
      for (const key of memoryCache.keys()) {
        if (matchesRedisPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
      }
    }
    return true;
  } catch (error) {
    logger.error('Cache del pattern error:', { pattern, error: error.message });
    return false;
  }
};

export const getRedisStats = () => {
  if (redis) {
    return { type: 'redis', connected: redis.status === 'ready' };
  }
  return { type: 'memory', size: memoryCache.size };
};

export default { initRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern, getRedisStats };
