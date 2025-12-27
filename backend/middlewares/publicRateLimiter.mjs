/**
 * Public Route Rate Limiter
 * 
 * Separate rate limiter for public-facing endpoints with more lenient limits.
 * Admin and authenticated routes use the global rate limiter.
 * 
 * Configuration:
 * - Higher limits than global rate limiter
 * - Prevents abuse of public APIs
 * - Does NOT affect admin routes
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Read configuration from environment variables
const PUBLIC_RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '60000', // 1 minute default
  10
);

const PUBLIC_RATE_LIMIT_MAX = parseInt(
  process.env.PUBLIC_RATE_LIMIT_MAX || '30', // 30 requests per minute
  10
);

/**
 * Key generator for rate limiting
 * Uses ipKeyGenerator from express-rate-limit
 */
const keyGenerator = ipKeyGenerator();

/**
 * Skip rate limiting for certain conditions
 */
const skip = (req) => {
  // Skip in development if SKIP_RATE_LIMIT=true
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return true;
  }

  // Optional: Whitelist specific IPs
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST
    ? process.env.RATE_LIMIT_WHITELIST.split(',').map((ip) => ip.trim())
    : [];

  if (whitelistedIPs.length > 0 && whitelistedIPs.includes(req.ip)) {
    return true;
  }

  return false;
};

/**
 * Public route rate limiter
 * Applied ONLY to public-facing endpoints:
 * - /api/pages/:slug
 * - /api/home-layout
 * - /api/menus/:location
 * - /api/sitemap
 * - /robots.txt
 */
export const publicRateLimiter = rateLimit({
  windowMs: PUBLIC_RATE_LIMIT_WINDOW_MS,
  max: PUBLIC_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip,
  handler: (req, res) => {
    console.warn(`Public rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      data: null,
    });
  },
});
