/**
 * Environment Configuration Module
 *
 * @module config/env
 * @description Centralized environment variable validation and management
 *
 * Features:
 * - Runtime validation of required environment variables
 * - Auto-generation of JWT_SECRET if not provided (development only)
 * - Clear error messages for missing configuration
 * - Type-safe environment variable access
 */

import crypto from 'crypto';

/**
 * Required environment variables for production
 * Server will fail to start if these are missing in production
 */
const REQUIRED_PRODUCTION_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'CORS_ORIGINS',
];

/**
 * Optional environment variables with their defaults
 */
const OPTIONAL_VARS_WITH_DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '10000',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '7d',
  BCRYPT_ROUNDS: '10',
  LOG_LEVEL: 'info',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
  STRICT_RATE_LIMIT_MAX: '5',
  TRUST_PROXY: 'false',
  CORS_REQUIRE_ORIGIN: 'false',
  ENABLE_FILE_LOGGING: 'true',
  ENABLE_AI_FEATURES: 'true',
  ENABLE_ANALYTICS: 'true',
  ENABLE_PAYMENT: 'true',
  DEBUG: 'false',
  API_VERSION: 'v1',
  TZ: 'UTC',
  CACHE_TTL: '3600',
  CACHE_CHECK_PERIOD: '600',
  MAX_FILE_SIZE: '5242880',
  UPLOAD_DIR: './uploads',
  SOCKET_PORT: '3001',
};

/**
 * Sensitive environment variables that should never be logged
 */
const SENSITIVE_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'MONGO_URI',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'APPLE_CLIENT_ID',
  'APPLE_CLIENT_SECRET',
  'APPLE_TEAM_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
  'EMAIL_PASSWORD',
  'MAILTRAP_PASSWORD',
  'SMTP_PASSWORD',
  'AWS_SECRET_ACCESS_KEY',
  'BACKUP_ENCRYPTION_KEY',
  'SENTRY_DSN',
];

let generatedJwtSecret = null;

/**
 * Generate a cryptographically secure JWT secret
 *
 * @returns {string} - 64-byte hex string (128 characters)
 */
const generateJwtSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Get a required environment variable
 * Throws error if not found in production
 *
 * @param {string} name - Environment variable name
 * @param {boolean} [required=true] - Whether the variable is required
 * @returns {string|undefined} - Variable value or undefined if optional and missing
 * @throws {Error} - If required variable is missing in production
 */
export const getEnv = (name, required = true) => {
  const value = process.env[name];

  if (value === undefined || value === '') {
    if (required && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    // Return default if available
    if (OPTIONAL_VARS_WITH_DEFAULTS[name] !== undefined) {
      return OPTIONAL_VARS_WITH_DEFAULTS[name];
    }

    return undefined;
  }

  return value;
};

/**
 * Get JWT_SECRET with auto-generation support for development
 *
 * In production: Returns JWT_SECRET from environment (required)
 * In development: Auto-generates a secure secret if not provided
 *
 * @returns {string} - JWT secret
 * @throws {Error} - If JWT_SECRET is missing in production
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim() !== '') {
    return secret;
  }

  // In production, JWT_SECRET is required
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing required environment variable: JWT_SECRET\n' +
      'In production, JWT_SECRET must be set for security.\n' +
      'Generate a strong secret using: openssl rand -base64 64'
    );
  }

  // In development, auto-generate a secret
  if (!generatedJwtSecret) {
    generatedJwtSecret = generateJwtSecret();
    console.warn('⚠️  WARNING: JWT_SECRET not set. Auto-generated a temporary secret for development.');
    console.warn('   This secret will change on server restart, invalidating all tokens.');
    console.warn('   For consistent development, set JWT_SECRET in your .env file.');
  }

  return generatedJwtSecret;
};

/**
 * Validate all required environment variables
 * Call this at server startup
 *
 * @throws {Error} - If any required variable is missing in production
 * @returns {object} - Validation result with warnings and errors
 */
export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // Check required production variables
  if (isProduction) {
    for (const varName of REQUIRED_PRODUCTION_VARS) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }
  }

  // Validate JWT_SECRET specifically
  try {
    getJwtSecret();
  } catch (error) {
    errors.push(error.message);
  }

  // Check for commonly needed variables and warn if missing
  const optionalButRecommended = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
  ];

  for (const varName of optionalButRecommended) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`${varName} is not set. Related features will be disabled.`);
    }
  }

  // Validate MONGO_URI format if provided
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && mongoUri.trim() !== '') {
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      warnings.push('MONGO_URI does not appear to be a valid MongoDB connection string.');
    }
  } else if (!isProduction) {
    warnings.push('MONGO_URI is not set. Database connection will be skipped.');
  }

  // Log results
  if (errors.length > 0) {
    console.error('\n=== ENVIRONMENT CONFIGURATION ERRORS ===');
    errors.forEach((error) => console.error(`❌ ${error}`));
    console.error('==========================================\n');
    throw new Error(`Environment configuration failed:\n${errors.join('\n')}`);
  }

  if (warnings.length > 0) {
    console.warn('\n=== ENVIRONMENT CONFIGURATION WARNINGS ===');
    warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));
    console.warn('============================================\n');
  }

  console.log('✓ Environment configuration validated successfully');

  return {
    isProduction,
    warnings,
    errors,
  };
};

/**
 * Get a masked version of sensitive environment variables for logging
 *
 * @param {string} name - Environment variable name
 * @returns {string} - Masked value or actual value if not sensitive
 */
export const getMaskedEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    return '[NOT SET]';
  }

  if (SENSITIVE_VARS.includes(name)) {
    return '[REDACTED]';
  }

  return value;
};

// Cache for feature flags (populated on first call)
let featureCache = null;

/**
 * Check if a specific feature is enabled based on environment
 * Results are cached after first evaluation since env vars don't change at runtime
 *
 * @param {string} feature - Feature name (e.g., 'ai', 'payment', 'analytics')
 * @returns {boolean} - Whether the feature is enabled
 */
export const isFeatureEnabled = (feature) => {
  // Cache feature flags on first call
  if (featureCache === null) {
    featureCache = {
      ai: process.env.ENABLE_AI_FEATURES !== 'false' && !!process.env.OPENAI_API_KEY,
      payment: process.env.ENABLE_PAYMENT !== 'false' && !!process.env.STRIPE_SECRET_KEY,
      analytics: process.env.ENABLE_ANALYTICS !== 'false',
      email: !!process.env.EMAIL_USER || !!process.env.SMTP_USER || !!process.env.MAILTRAP_USER,
      sentry: !!process.env.SENTRY_DSN,
    };
  }

  return featureCache[feature] ?? false;
};

/**
 * Environment configuration object
 * Provides type-safe access to common environment variables
 */
export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get isProduction() {
    return this.nodeEnv === 'production';
  },
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  get isTest() {
    return this.nodeEnv === 'test';
  },
  get port() {
    return parseInt(process.env.PORT || '10000', 10);
  },
  get jwtSecret() {
    return getJwtSecret();
  },
  get mongoUri() {
    return process.env.MONGO_URI || '';
  },
  get corsOrigins() {
    return process.env.CORS_ORIGINS || '';
  },
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY || '';
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  },
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY || '';
  },
};

export default {
  getEnv,
  getJwtSecret,
  validateEnv,
  getMaskedEnv,
  isFeatureEnabled,
  env,
  SENSITIVE_VARS,
};
