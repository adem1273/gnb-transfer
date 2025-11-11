/**
 * CORS Configuration
 *
 * @module config/cors
 * @description Secure CORS configuration with production lockdown
 *
 * Security features:
 * - Whitelist-only in production
 * - Fails fast if CORS_ORIGINS not configured in production
 * - Validates origin against whitelist
 * - Supports credentials for authenticated requests
 * - Logs blocked CORS attempts for security monitoring
 */

/**
 * Parse CORS origins from environment variable
 *
 * @returns {string[]} - Array of allowed origins
 */
const getAllowedOrigins = () => {
  const corsOrigins = process.env.CORS_ORIGINS;

  // In production, CORS_ORIGINS must be explicitly set
  if (process.env.NODE_ENV === 'production') {
    if (!corsOrigins || corsOrigins.trim() === '') {
      console.error('❌ FATAL: CORS_ORIGINS environment variable is not set in production!');
      console.error('   Set CORS_ORIGINS to a comma-separated list of allowed origins.');
      console.error('   Example: CORS_ORIGINS=https://example.com,https://www.example.com');
      process.exit(1); // Fail fast in production
    }
  }

  // Parse comma-separated list
  if (corsOrigins) {
    const origins = corsOrigins.split(',').map((origin) => origin.trim());

    // Validate origins format in production
    if (process.env.NODE_ENV === 'production') {
      for (const origin of origins) {
        // Check if origin looks like a valid URL
        if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
          console.error(`❌ FATAL: Invalid origin in CORS_ORIGINS: ${origin}`);
          console.error('   Origins must start with http:// or https://');
          process.exit(1);
        }

        // Warn about http:// in production
        if (origin.startsWith('http://') && !origin.includes('localhost')) {
          console.warn(`⚠️  WARNING: Using insecure http:// origin in production: ${origin}`);
          console.warn('   Consider using https:// for security');
        }
      }
    }

    console.log(`✓ CORS configured with ${origins.length} allowed origin(s):`);
    origins.forEach((origin) => console.log(`  - ${origin}`));

    return origins;
  }

  // Development fallback
  const devOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  console.log('⚠️  Using default development CORS origins:', devOrigins);
  return devOrigins;
};

/**
 * CORS origin validation callback
 *
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {function} - CORS origin callback
 */
const createOriginValidator = (allowedOrigins) => {
  return (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps, Postman)
    // In production, you might want to require origins for browsers
    if (!origin) {
      if (process.env.NODE_ENV === 'production' && process.env.CORS_REQUIRE_ORIGIN === 'true') {
        console.warn('⚠️  CORS: Blocked request with no origin header (production mode)');
        return callback(new Error('Origin header required'), false);
      }
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origin not allowed - log for security monitoring
    console.warn(`⚠️  CORS: Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  };
};

/**
 * Get CORS configuration options
 *
 * @returns {object} - CORS options object for cors middleware
 *
 * Configuration:
 * - origin: Validates request origin against whitelist
 * - credentials: true (allows cookies/auth headers)
 * - optionsSuccessStatus: 200 (some legacy browsers need this)
 * - methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - allowedHeaders: Authorization, Content-Type, etc.
 * - exposedHeaders: X-Total-Count (for pagination), etc.
 * - maxAge: 600 (10 minutes preflight cache)
 */
export const getCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: createOriginValidator(allowedOrigins),

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Some legacy browsers (IE11, various SmartTVs) choke on status code 204
    optionsSuccessStatus: 200,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed request headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-Id',
    ],

    // Exposed response headers (clients can read these)
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
      'X-Request-Id',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ],

    // Preflight request cache duration (seconds)
    // Browsers will cache preflight responses for this duration
    maxAge: 600, // 10 minutes
  };
};

/**
 * Validate CORS configuration
 * Call this at startup to ensure proper configuration
 *
 * @returns {boolean} - True if configuration is valid
 */
export const validateCorsConfig = () => {
  try {
    const origins = getAllowedOrigins();

    if (process.env.NODE_ENV === 'production') {
      // In production, at least one origin must be configured
      if (origins.length === 0) {
        console.error('❌ CORS validation failed: No origins configured');
        return false;
      }

      // Check for common misconfigurations
      if (origins.includes('*')) {
        console.error('❌ CORS validation failed: Wildcard (*) not allowed in production');
        console.error('   Specify explicit origins for security');
        return false;
      }

      if (origins.some((o) => o.includes('localhost'))) {
        console.warn(
          '⚠️  WARNING: localhost origin configured in production - this may be intentional for testing'
        );
      }
    }

    console.log('✓ CORS configuration validated successfully');
    return true;
  } catch (error) {
    console.error('❌ CORS validation error:', error.message);
    return false;
  }
};

export default {
  getCorsOptions,
  validateCorsConfig,
  getAllowedOrigins,
};
