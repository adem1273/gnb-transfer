/**
 * Advanced Rate Limiting Middleware
 * Redis-backed token bucket algorithm with distributed support
 * 
 * Features:
 * - Multi-tier rate limits (anonymous vs authenticated)
 * - Endpoint-specific limits
 * - Gradual penalty system
 * - Suspicious pattern detection
 * - Bot detection
 * - Request size limits
 * - Whitelist support
 */

import { getRedisClient, isRedisConnected } from '../config/redis.mjs';
import { RateLimitViolation } from '../models/RateLimitViolation.mjs';
import logger from '../config/logger.mjs';

// Configuration constants
const RATE_LIMITS = {
  anonymous: {
    window: 15 * 60, // 15 minutes in seconds
    maxRequests: 100,
  },
  authenticated: {
    window: 15 * 60, // 15 minutes in seconds
    maxRequests: 500,
  },
  endpoints: {
    '/api/auth': {
      window: 15 * 60, // 15 minutes
      maxRequests: 5,
    },
    '/api/bookings': {
      window: 15 * 60, // 15 minutes
      maxRequests: 20,
    },
    '/api/export': {
      window: 60 * 60, // 1 hour
      maxRequests: 3,
    },
  },
};

// Request size limit (10MB)
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;

// Suspicious bot user agents (partial matches)
const SUSPICIOUS_BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'scraper',
  'curl',
  'wget',
  'python-requests',
  'scrapy',
];

// Whitelist for internal services (health checks, monitoring)
const WHITELISTED_PATHS = [
  '/health',
  '/metrics',
  '/api/health',
];

/**
 * In-memory fallback when Redis is unavailable
 */
class InMemoryRateLimiter {
  constructor() {
    this.store = new Map();
    this.cleanup();
  }

  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.store.entries()) {
        if (data.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  async consume(key, limit, windowSeconds) {
    const now = Date.now();
    const resetTime = now + windowSeconds * 1000;
    
    if (!this.store.has(key)) {
      this.store.set(key, {
        count: 1,
        resetTime,
      });
      return { success: true, remaining: limit - 1, resetTime };
    }
    
    const data = this.store.get(key);
    
    if (data.resetTime < now) {
      // Window expired, reset
      this.store.set(key, {
        count: 1,
        resetTime,
      });
      return { success: true, remaining: limit - 1, resetTime };
    }
    
    if (data.count >= limit) {
      return { success: false, remaining: 0, resetTime: data.resetTime };
    }
    
    data.count += 1;
    return { success: true, remaining: limit - data.count, resetTime: data.resetTime };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Redis-backed token bucket rate limiter
 */
async function consumeTokens(key, limit, windowSeconds) {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    // Fallback to in-memory limiter
    return inMemoryLimiter.consume(key, limit, windowSeconds);
  }
  
  try {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Remove old entries outside the window
    const windowStart = now - windowMs;
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    pipeline.zcard(key);
    
    // Add current request timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration on the key
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    
    // results[1] contains the count before adding the new request
    const count = results[1][1] || 0;
    
    if (count >= limit) {
      // Remove the request we just added since we're over the limit
      await redis.zrem(key, `${now}-${Math.random()}`);
      
      // Get TTL for reset time
      const ttl = await redis.ttl(key);
      const resetTime = now + (ttl * 1000);
      
      return { success: false, remaining: 0, resetTime };
    }
    
    const remaining = limit - count - 1;
    const resetTime = now + windowMs;
    
    return { success: true, remaining, resetTime };
  } catch (error) {
    logger.error('Redis rate limit error:', { error: error.message });
    // Fallback to in-memory on Redis error
    return inMemoryLimiter.consume(key, limit, windowSeconds);
  }
}

/**
 * Get rate limit configuration for a request
 */
function getRateLimitConfig(req) {
  // Check for endpoint-specific limits
  for (const [pattern, config] of Object.entries(RATE_LIMITS.endpoints)) {
    if (req.path.startsWith(pattern)) {
      return {
        ...config,
        type: 'endpoint',
        pattern,
      };
    }
  }
  
  // Check if user is authenticated
  if (req.user && req.user.id) {
    return {
      ...RATE_LIMITS.authenticated,
      type: 'authenticated',
    };
  }
  
  // Default to anonymous limits
  return {
    ...RATE_LIMITS.anonymous,
    type: 'anonymous',
  };
}

/**
 * Get identifier for rate limiting
 */
function getIdentifier(req) {
  if (req.user && req.user.id) {
    return {
      value: `user:${req.user.id}`,
      type: 'userId',
    };
  }
  
  return {
    value: `ip:${req.ip}`,
    type: 'ip',
  };
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousBot(userAgent) {
  if (!userAgent) return true; // No user agent is suspicious
  
  const lowerUA = userAgent.toLowerCase();
  return SUSPICIOUS_BOT_PATTERNS.some((pattern) => lowerUA.includes(pattern));
}

/**
 * Detect suspicious patterns
 */
async function detectSuspiciousPatterns(req, identifier) {
  const patterns = {
    rapidRequests: false,
    largePayload: false,
    suspiciousBot: false,
  };
  
  // Check user agent
  const userAgent = req.get('user-agent') || '';
  patterns.suspiciousBot = isSuspiciousBot(userAgent);
  
  // Check payload size
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  patterns.largePayload = contentLength > MAX_PAYLOAD_SIZE;
  
  // Check for rapid requests (more than 10 requests in 1 second)
  const redis = getRedisClient();
  if (redis && isRedisConnected()) {
    try {
      const rapidKey = `gnb:ratelimit:rapid:${identifier.value}`;
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      
      await redis.zadd(rapidKey, now, `${now}`);
      await redis.expire(rapidKey, 2);
      
      const count = await redis.zcount(rapidKey, oneSecondAgo, now);
      patterns.rapidRequests = count > 10;
    } catch (error) {
      logger.error('Error detecting rapid requests:', { error: error.message });
    }
  }
  
  return patterns;
}

/**
 * Handle rate limit violation
 */
async function handleViolation(req, identifier, config) {
  try {
    const endpoint = config.pattern || req.path;
    const userAgent = req.get('user-agent') || '';
    
    // Detect suspicious patterns
    const patterns = await detectSuspiciousPatterns(req, identifier);
    
    // Find or create violation record
    const violation = await RateLimitViolation.findOrCreate(
      identifier.value,
      identifier.type,
      endpoint
    );
    
    // Update violation metadata
    violation.userAgent = userAgent;
    violation.requestMetadata = {
      method: req.method,
      path: req.path,
      payloadSize: parseInt(req.get('content-length') || '0', 10),
    };
    violation.suspiciousPatterns = patterns;
    
    // Apply penalty
    await violation.applyPenalty();
    
    logger.warn('Rate limit violation', {
      identifier: identifier.value,
      endpoint,
      violationCount: violation.violationCount,
      penaltyLevel: violation.penaltyLevel,
      patterns,
    });
    
    return violation;
  } catch (error) {
    logger.error('Error handling rate limit violation:', { error: error.message });
    return null;
  }
}

/**
 * Check if request is whitelisted
 */
function isWhitelisted(req) {
  // Check path whitelist
  if (WHITELISTED_PATHS.some((path) => req.path === path)) {
    return true;
  }
  
  // Check IP whitelist from environment
  const whitelist = process.env.RATE_LIMIT_WHITELIST;
  if (whitelist) {
    const whitelistedIPs = whitelist.split(',').map((ip) => ip.trim());
    if (whitelistedIPs.includes(req.ip)) {
      return true;
    }
  }
  
  // Skip in development if configured
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Advanced rate limiting middleware
 */
export const advancedRateLimiter = async (req, res, next) => {
  try {
    // Check whitelist
    if (isWhitelisted(req)) {
      return next();
    }
    
    // Check payload size
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return res.status(413).json({
        success: false,
        error: 'Payload too large',
        message: `Request size exceeds maximum allowed size of ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB`,
      });
    }
    
    // Get identifier and rate limit config
    const identifier = getIdentifier(req);
    const config = getRateLimitConfig(req);
    
    // Check for existing ban
    const endpoint = config.pattern || req.path;
    const existingBan = await RateLimitViolation.checkBan(identifier.value, endpoint);
    
    if (existingBan) {
      const retryAfter = existingBan.banExpiresAt
        ? Math.ceil((existingBan.banExpiresAt - new Date()) / 1000)
        : 3600; // Default to 1 hour if no expiration
      
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'You have been temporarily banned due to excessive requests. Please try again later.',
        banExpiresAt: existingBan.banExpiresAt,
        penaltyLevel: existingBan.penaltyLevel,
      });
    }
    
    // Generate Redis key
    const redisKey = `gnb:ratelimit:${identifier.value}:${endpoint}`;
    
    // Consume tokens
    const result = await consumeTokens(redisKey, config.maxRequests, config.window);
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', config.maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    res.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.success) {
      // Handle violation
      const violation = await handleViolation(req, identifier, config);
      
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
        limit: config.maxRequests,
        window: config.window,
        violationCount: violation?.violationCount || 1,
      });
    }
    
    next();
  } catch (error) {
    logger.error('Rate limiter error:', { error: error.message });
    // On error, allow the request to proceed (fail open)
    next();
  }
};

/**
 * Create endpoint-specific rate limiter
 */
export const createEndpointLimiter = (maxRequests, windowSeconds) => {
  return async (req, res, next) => {
    try {
      if (isWhitelisted(req)) {
        return next();
      }
      
      const identifier = getIdentifier(req);
      const redisKey = `gnb:ratelimit:${identifier.value}:${req.path}`;
      
      const result = await consumeTokens(redisKey, maxRequests, windowSeconds);
      
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
      res.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        });
      }
      
      next();
    } catch (error) {
      logger.error('Endpoint rate limiter error:', { error: error.message });
      next();
    }
  };
};

export default advancedRateLimiter;
