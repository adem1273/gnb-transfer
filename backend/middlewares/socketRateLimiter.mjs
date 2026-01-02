/**
 * Socket.IO Rate Limiter
 * Limits the number of socket connections per IP/user
 * 
 * Configuration: 5 connections per minute
 */

import { getRedisClient, isRedisConnected } from '../config/redis.mjs';
import logger from '../config/logger.mjs';

const CONNECTION_LIMIT = 5; // connections per minute
const WINDOW_SECONDS = 60; // 1 minute

/**
 * In-memory fallback for Socket.IO rate limiting
 */
class InMemorySocketLimiter {
  constructor() {
    this.connections = new Map();
    this.cleanup();
  }

  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.connections.entries()) {
        const filtered = timestamps.filter((ts) => now - ts < WINDOW_SECONDS * 1000);
        if (filtered.length === 0) {
          this.connections.delete(key);
        } else {
          this.connections.set(key, filtered);
        }
      }
    }, 60000); // Cleanup every minute
  }

  checkLimit(identifier) {
    const now = Date.now();
    const windowStart = now - WINDOW_SECONDS * 1000;
    
    if (!this.connections.has(identifier)) {
      this.connections.set(identifier, [now]);
      return { allowed: true, remaining: CONNECTION_LIMIT - 1 };
    }
    
    const timestamps = this.connections.get(identifier);
    const recentConnections = timestamps.filter((ts) => ts > windowStart);
    
    if (recentConnections.length >= CONNECTION_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    
    recentConnections.push(now);
    this.connections.set(identifier, recentConnections);
    
    return { allowed: true, remaining: CONNECTION_LIMIT - recentConnections.length };
  }
}

const inMemorySocketLimiter = new InMemorySocketLimiter();

/**
 * Check Socket.IO connection rate limit
 */
export async function checkSocketRateLimit(identifier) {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return inMemorySocketLimiter.checkLimit(identifier);
  }
  
  try {
    const key = `gnb:ratelimit:socket:${identifier}`;
    const now = Date.now();
    const windowStart = now - WINDOW_SECONDS * 1000;
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count recent connections
    const count = await redis.zcard(key);
    
    if (count >= CONNECTION_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    
    // Add current connection
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, WINDOW_SECONDS);
    
    return { allowed: true, remaining: CONNECTION_LIMIT - count - 1 };
  } catch (error) {
    logger.error('Socket rate limit error:', { error: error.message });
    // Fallback to in-memory
    return inMemorySocketLimiter.checkLimit(identifier);
  }
}

/**
 * Socket.IO rate limiting middleware
 * Apply this to Socket.IO server
 */
export function socketRateLimiter(socket, next) {
  const identifier = socket.handshake.address || 'unknown';
  
  checkSocketRateLimit(identifier)
    .then((result) => {
      if (!result.allowed) {
        const error = new Error('Too many connections. Please try again later.');
        error.data = {
          type: 'RATE_LIMIT_EXCEEDED',
          limit: CONNECTION_LIMIT,
          window: WINDOW_SECONDS,
        };
        return next(error);
      }
      
      logger.info('Socket connection allowed', {
        identifier,
        remaining: result.remaining,
      });
      
      next();
    })
    .catch((error) => {
      logger.error('Socket rate limiter error:', { error: error.message });
      // On error, allow connection (fail open)
      next();
    });
}

export default socketRateLimiter;
