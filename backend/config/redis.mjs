/**
 * Redis Configuration and Connection Manager
 * 
 * Provides Redis connection with:
 * - Automatic retry logic
 * - Comprehensive error handling
 * - Connection state monitoring
 * - Graceful degradation
 */

import Redis from 'ioredis';
import logger from './logger.mjs';

let redisClient = null;
let isConnected = false;
let connectionAttempts = 0;

const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt) => {
  const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Initialize Redis connection
 * @returns {Redis|null} Redis client instance or null if connection fails
 */
export const initializeRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  const cacheEnabled = process.env.CACHE_ENABLED !== 'false';
  const isProduction = process.env.NODE_ENV === 'production';

  // Skip Redis in development if CACHE_ENABLED is false
  if (!cacheEnabled && !isProduction) {
    logger.info('Cache disabled via CACHE_ENABLED flag. Using in-memory fallback.');
    return null;
  }

  if (!redisUrl) {
    const message = isProduction 
      ? 'REDIS_URL not configured. Cache will use in-memory fallback.'
      : 'REDIS_URL not set. Using in-memory cache for development.';
    logger.warn(message);
    return null;
  }

  try {
    // Parse Redis URL to extract configuration
    const redisConfig = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        connectionAttempts = times;
        
        if (times > MAX_RETRY_ATTEMPTS) {
          logger.error('Redis max retry attempts reached. Giving up.', {
            attempts: times,
          });
          return null; // Stop retrying
        }
        
        const delay = getRetryDelay(times - 1);
        logger.warn('Redis connection retry', {
          attempt: times,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          retryDelayMs: Math.round(delay),
        });
        
        return delay;
      },
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
        if (targetErrors.some(targetError => err.message.includes(targetError))) {
          logger.warn('Reconnecting to Redis due to error', { error: err.message });
          return true; // Reconnect
        }
        return false;
      },
      lazyConnect: false, // Connect immediately
    };

    redisClient = new Redis(redisUrl, redisConfig);

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis connection established', {
        url: redisUrl.replace(/:[^:@]+@/, ':****@'), // Hide password in logs
      });
    });

    redisClient.on('ready', () => {
      isConnected = true;
      connectionAttempts = 0;
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.error('Redis client error', {
        error: err.message,
        stack: err.stack,
      });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', (delay) => {
      logger.info('Redis reconnecting', { delayMs: delay });
    });

    redisClient.on('end', () => {
      isConnected = false;
      logger.warn('Redis connection ended');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null}
 */
export const getRedisClient = () => redisClient;

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
export const isRedisConnected = () => isConnected && redisClient && redisClient.status === 'ready';

/**
 * Get Redis connection statistics
 * @returns {Object}
 */
export const getRedisStats = () => {
  if (!redisClient) {
    return {
      enabled: false,
      connected: false,
      type: 'none',
    };
  }

  return {
    enabled: true,
    connected: isConnected,
    status: redisClient.status,
    connectionAttempts,
    type: 'redis',
  };
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message });
      // Force disconnect if graceful shutdown fails
      redisClient.disconnect();
    }
  }
};

/**
 * Ping Redis to check connectivity
 * @returns {Promise<boolean>}
 */
export const pingRedis = async () => {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    const response = await redisClient.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', { error: error.message });
    return false;
  }
};

export default {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  getRedisStats,
  closeRedis,
  pingRedis,
};
