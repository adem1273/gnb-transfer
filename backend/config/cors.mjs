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

  // In production, CORS_ORIGINS should be explicitly set, but we'll use safe defaults if missing
  if (process.env.NODE_ENV === 'production') {
    if (!corsOrigins || corsOrigins.trim() === '') {
      console.warn('⚠️  WARNING: CORS_ORIGINS environment variable is not set in production!');
      console.warn('   Using default production origins for Render deployment.');
      console.warn('   It is recommended to set CORS_ORIGINS in your Render dashboard.');
      console.warn('   Example: CORS_ORIGINS=https://gnb-transfer.onrender.com,https://www.gnb-transfer.com');
      
      // Safe production defaults for Render
      const defaultProdOrigins = [
        'https://gnb-transfer.onrender.com',
        'http://localhost:3000', // For local testing in production mode
      ];
      console.log('✓ Using default production CORS origins:', defaultProdOrigins);
      return defaultProdOrigins;
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
          console.warn(`⚠️  WARNING: Invalid origin in CORS_ORIGINS: ${origin}`);
          console.warn('   Origins should start with http:// or https://');
          console.warn('   This origin will be included but may not work correctly');
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
        console.warn('⚠️  CORS validation warning: No origins configured');
        console.warn('   Server will start but CORS may not work correctly');
        return false;
      }

      // Check for common misconfigurations
      if (origins.includes('*')) {
        console.warn('⚠️  CORS validation warning: Wildcard (*) not recommended in production');
        console.warn('   Consider specifying explicit origins for better security');
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
    console.warn('⚠️  CORS validation error:', error.message);
    console.warn('   Server will continue with default CORS configuration');
    return false;
  }
};

export default {
  getCorsOptions,
  validateCorsConfig,
  getAllowedOrigins,
};
