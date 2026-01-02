/**
 * Cache Utility Module
 * 
 * Provides comprehensive caching functionality with:
 * - Redis primary storage with in-memory fallback
 * - Tag-based cache invalidation
 * - Cache hit/miss metrics
 * - TTL management
 * - Pattern-based deletion
 */

import { getRedisClient, isRedisConnected } from '../config/redis.mjs';
import logger from '../config/logger.mjs';

// In-memory fallback cache
const memoryCache = new Map();
const memoryCacheTTL = new Map();
const memoryCacheTags = new Map(); // key -> Set of tags

// Metrics tracking
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

// Cache key prefix
const KEY_PREFIX = 'gnb:cache:';
const TAG_PREFIX = 'gnb:tag:';
const TAG_TTL_BUFFER = 60; // Tag expires 60 seconds after cache entry

// Cleanup configuration
const CLEANUP_INTERVAL_MS = parseInt(process.env.CACHE_CLEANUP_INTERVAL_MS || '120000', 10);

/**
 * Generate cache key with prefix
 */
const getCacheKey = (key) => `${KEY_PREFIX}${key}`;

/**
 * Generate tag key with prefix
 */
const getTagKey = (tag) => `${TAG_PREFIX}${tag}`;

/**
 * Check if status code indicates success (2xx range)
 */
const isSuccessStatusCode = (statusCode) => statusCode >= 200 && statusCode < 300;

/**
 * Convert Redis-style pattern to a matcher function
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

/**
 * Cleanup expired entries from memory cache
 */
const cleanupExpiredMemoryCache = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, expiryTime] of memoryCacheTTL.entries()) {
    if (expiryTime < now) {
      memoryCache.delete(key);
      memoryCacheTTL.delete(key);
      memoryCacheTags.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Memory cache cleanup', { entriesRemoved: cleaned });
  }
};

// Run cleanup using configured interval
let cleanupInterval = setInterval(cleanupExpiredMemoryCache, CLEANUP_INTERVAL_MS);
cleanupInterval.unref(); // Don't block process exit

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
export const get = async (key) => {
  const cacheKey = getCacheKey(key);
  const redis = getRedisClient();

  try {
    if (redis && isRedisConnected()) {
      // Try Redis first
      const data = await redis.get(cacheKey);
      
      if (data) {
        metrics.hits++;
        logger.debug('Cache hit (Redis)', { key });
        return JSON.parse(data);
      }
      
      metrics.misses++;
      logger.debug('Cache miss (Redis)', { key });
      return null;
    }

    // Fallback to memory cache
    if (memoryCacheTTL.has(cacheKey)) {
      const expiryTime = memoryCacheTTL.get(cacheKey);
      
      if (expiryTime < Date.now()) {
        // Expired
        memoryCache.delete(cacheKey);
        memoryCacheTTL.delete(cacheKey);
        memoryCacheTags.delete(cacheKey);
        metrics.misses++;
        logger.debug('Cache miss (Memory - expired)', { key });
        return null;
      }
      
      metrics.hits++;
      logger.debug('Cache hit (Memory)', { key });
      return memoryCache.get(cacheKey);
    }

    metrics.misses++;
    logger.debug('Cache miss (Memory)', { key });
    return null;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
};

/**
 * Set value in cache with optional TTL and tags
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 300)
 * @param {string[]} tags - Optional tags for grouped invalidation
 * @returns {Promise<boolean>}
 */
export const set = async (key, value, ttlSeconds = 300, tags = []) => {
  const cacheKey = getCacheKey(key);
  const redis = getRedisClient();

  try {
    const serialized = JSON.stringify(value);

    if (redis && isRedisConnected()) {
      // Store in Redis
      await redis.setex(cacheKey, ttlSeconds, serialized);
      
      // Store tags if provided
      if (tags && tags.length > 0) {
        const multi = redis.multi();
        
        for (const tag of tags) {
          const tagKey = getTagKey(tag);
          multi.sadd(tagKey, cacheKey);
          multi.expire(tagKey, ttlSeconds + TAG_TTL_BUFFER); // Tag expires slightly later
        }
        
        await multi.exec();
      }
      
      metrics.sets++;
      logger.debug('Cache set (Redis)', { key, ttl: ttlSeconds, tags });
      return true;
    }

    // Fallback to memory cache
    memoryCache.set(cacheKey, value);
    memoryCacheTTL.set(cacheKey, Date.now() + ttlSeconds * 1000);
    
    // Store tags in memory
    if (tags && tags.length > 0) {
      memoryCacheTags.set(cacheKey, new Set(tags));
    }
    
    metrics.sets++;
    logger.debug('Cache set (Memory)', { key, ttl: ttlSeconds, tags });
    return true;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete a specific cache entry
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
export const del = async (key) => {
  const cacheKey = getCacheKey(key);
  const redis = getRedisClient();

  try {
    if (redis && isRedisConnected()) {
      await redis.del(cacheKey);
      metrics.deletes++;
      logger.debug('Cache delete (Redis)', { key });
      return true;
    }

    // Fallback to memory cache
    memoryCache.delete(cacheKey);
    memoryCacheTTL.delete(cacheKey);
    memoryCacheTags.delete(cacheKey);
    metrics.deletes++;
    logger.debug('Cache delete (Memory)', { key });
    return true;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete cache entries matching a pattern
 * @param {string} pattern - Pattern to match (Redis glob pattern)
 * @returns {Promise<number>} Number of keys deleted
 */
export const deletePattern = async (pattern) => {
  const fullPattern = getCacheKey(pattern);
  const redis = getRedisClient();

  try {
    if (redis && isRedisConnected()) {
      // Use SCAN for safer pattern matching in production
      const keys = [];
      let cursor = '0';
      
      do {
        const [newCursor, matchedKeys] = await redis.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        cursor = newCursor;
        keys.push(...matchedKeys);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await redis.del(...keys);
        metrics.deletes += keys.length;
        logger.info('Cache pattern delete (Redis)', { pattern, keysDeleted: keys.length });
        return keys.length;
      }
      
      return 0;
    }

    // Fallback to memory cache
    let deleted = 0;
    for (const key of memoryCache.keys()) {
      if (matchesRedisPattern(key, fullPattern)) {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        memoryCacheTags.delete(key);
        deleted++;
      }
    }

    metrics.deletes += deleted;
    logger.info('Cache pattern delete (Memory)', { pattern, keysDeleted: deleted });
    return deleted;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache pattern delete error', { pattern, error: error.message });
    return 0;
  }
};

/**
 * Invalidate all cache entries with a specific tag
 * @param {string} tag - Tag to invalidate
 * @returns {Promise<number>} Number of keys invalidated
 */
export const invalidateTag = async (tag) => {
  const tagKey = getTagKey(tag);
  const redis = getRedisClient();

  try {
    if (redis && isRedisConnected()) {
      // Get all keys with this tag
      const keys = await redis.smembers(tagKey);
      
      if (keys.length > 0) {
        // Delete all tagged keys and the tag set itself
        await redis.del(...keys, tagKey);
        metrics.deletes += keys.length;
        logger.info('Cache tag invalidated (Redis)', { tag, keysDeleted: keys.length });
        return keys.length;
      }
      
      return 0;
    }

    // Fallback to memory cache
    let deleted = 0;
    for (const [key, tags] of memoryCacheTags.entries()) {
      if (tags.has(tag)) {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        memoryCacheTags.delete(key);
        deleted++;
      }
    }

    metrics.deletes += deleted;
    logger.info('Cache tag invalidated (Memory)', { tag, keysDeleted: deleted });
    return deleted;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache tag invalidation error', { tag, error: error.message });
    return 0;
  }
};

/**
 * Clear all cache entries
 * @returns {Promise<boolean>}
 */
export const clear = async () => {
  const redis = getRedisClient();

  try {
    if (redis && isRedisConnected()) {
      // Delete all keys matching our prefix
      const pattern = `${KEY_PREFIX}*`;
      let cursor = '0';
      let totalDeleted = 0;
      
      do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = newCursor;
        
        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      // Also clear tag keys
      const tagPattern = `${TAG_PREFIX}*`;
      cursor = '0';
      
      do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', tagPattern, 'COUNT', 100);
        cursor = newCursor;
        
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');

      logger.info('Cache cleared (Redis)', { keysDeleted: totalDeleted });
      return true;
    }

    // Fallback to memory cache
    const size = memoryCache.size;
    memoryCache.clear();
    memoryCacheTTL.clear();
    memoryCacheTags.clear();
    logger.info('Cache cleared (Memory)', { keysDeleted: size });
    return true;
  } catch (error) {
    metrics.errors++;
    logger.error('Cache clear error', { error: error.message });
    return false;
  }
};

/**
 * Get cache statistics and metrics
 * @returns {Object}
 */
export const getStats = () => {
  const redis = getRedisClient();
  const hitRate = metrics.hits + metrics.misses > 0
    ? (metrics.hits / (metrics.hits + metrics.misses) * 100).toFixed(2)
    : 0;

  return {
    type: redis && isRedisConnected() ? 'redis' : 'memory',
    connected: redis && isRedisConnected(),
    metrics: {
      hits: metrics.hits,
      misses: metrics.misses,
      sets: metrics.sets,
      deletes: metrics.deletes,
      errors: metrics.errors,
      hitRate: `${hitRate}%`,
    },
    memory: {
      entries: memoryCache.size,
      taggedEntries: memoryCacheTags.size,
    },
  };
};

/**
 * Reset metrics (useful for testing)
 */
export const resetMetrics = () => {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.sets = 0;
  metrics.deletes = 0;
  metrics.errors = 0;
};

export default {
  get,
  set,
  del,
  delete: del,
  deletePattern,
  invalidateTag,
  clear,
  getStats,
  resetMetrics,
};
