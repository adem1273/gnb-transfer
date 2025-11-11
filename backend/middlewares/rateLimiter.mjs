/**
 * Rate limiting middleware
 * Limits the number of requests from a single IP address
 *
 * Security considerations:
 * - Uses req.ip for key generation (respects trust proxy setting)
 * - Configurable via environment variables
 * - Prevents brute force attacks and DoS
 */

import rateLimit from 'express-rate-limit';

// Read configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || '900000', // 15 minutes default
  10
);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const STRICT_RATE_LIMIT_MAX = parseInt(process.env.STRICT_RATE_LIMIT_MAX || '5', 10);

/**
 * Key generator function for rate limiting
 * Uses req.ip which respects Express's "trust proxy" setting
 *
 * When "trust proxy" is enabled:
 * - req.ip will be the leftmost IP in X-Forwarded-For header
 * - Prevents proxy bypass attacks
 *
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
const keyGenerator = (req) => {
  // req.ip respects trust proxy setting
  // Fallback to req.connection.remoteAddress for safety
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Skip rate limiting for certain conditions
 * Can be used to whitelist IPs or bypass in development
 *
 * @param {object} req - Express request object
 * @returns {boolean} - True to skip rate limiting
 */
const skip = (req) => {
  // Skip in development if SKIP_RATE_LIMIT=true
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return true;
  }

  // Optional: Whitelist specific IPs (e.g., internal services)
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST
    ? process.env.RATE_LIMIT_WHITELIST.split(',').map((ip) => ip.trim())
    : [];

  if (whitelistedIPs.length > 0 && whitelistedIPs.includes(req.ip)) {
    return true;
  }

  return false;
};

/**
 * Global rate limiter - 100 requests per 15 minutes (configurable)
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  skip,
  // Handler for when rate limit is exceeded
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      data: null,
    });
  },
});

/**
 * Strict rate limiter for sensitive operations (e.g., login, registration)
 * Default: 5 requests per 15 minutes (configurable)
 */
export const strictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: STRICT_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many attempts, please try again later.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip,
  handler: (req, res) => {
    console.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many attempts, please try again later.',
      data: null,
    });
  },
});
