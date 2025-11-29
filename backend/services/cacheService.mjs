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

export const cacheDelPattern = async (pattern) => {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.delete(key);
          memoryCacheTTL.delete(key);
        }
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
