/**
 * NoSQL Injection Protection Middleware
 *
 * @module middlewares/sanitize
 * @description Protects against NoSQL injection attacks by sanitizing user input
 *
 * Security measures:
 * - Removes MongoDB operators ($ne, $gt, $where, etc.) from user input
 * - Sanitizes query parameters, body, and params
 * - Uses mongo-sanitize for deep object sanitization
 * - Validates input types to prevent injection
 */

import mongoSanitize from 'mongo-sanitize';

/**
 * List of dangerous MongoDB operators that should be blocked in user input
 */
const dangerousOperators = [
  '$where',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$and',
  '$or',
  '$not',
  '$nor',
  '$exists',
  '$type',
  '$expr',
  '$jsonSchema',
  '$mod',
  '$regex',
  '$text',
  '$geoIntersects',
  '$geoWithin',
  '$near',
  '$nearSphere',
];

/**
 * Check if an object contains dangerous MongoDB operators
 *
 * @param {any} obj - Object to check
 * @returns {boolean} - True if dangerous operators found
 */
export const containsDangerousOperators = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const keys = Object.keys(obj);
  for (const key of keys) {
    // Check if key is a MongoDB operator
    if (dangerousOperators.includes(key)) {
      return true;
    }

    // Recursively check nested objects
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (containsDangerousOperators(obj[key])) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Sanitize request data middleware
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 *
 * Sanitizes:
 * - req.body
 * - req.query
 * - req.params
 *
 * Blocks requests containing dangerous MongoDB operators
 */
export const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      if (containsDangerousOperators(req.body)) {
        console.warn('NoSQL injection attempt detected in request body:', req.body);
        return res.apiError('Invalid input detected', 400);
      }
      req.body = mongoSanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      if (containsDangerousOperators(req.query)) {
        console.warn('NoSQL injection attempt detected in query params:', req.query);
        return res.apiError('Invalid query parameters', 400);
      }
      req.query = mongoSanitize(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      if (containsDangerousOperators(req.params)) {
        console.warn('NoSQL injection attempt detected in URL params:', req.params);
        return res.apiError('Invalid URL parameters', 400);
      }
      req.params = mongoSanitize(req.params);
    }

    next();
  } catch (error) {
    console.error('Error in sanitize middleware:', error);
    return res.apiError('Request validation failed', 500);
  }
};

/**
 * Sanitize a specific value (utility function)
 *
 * @param {any} value - Value to sanitize
 * @returns {any} - Sanitized value
 *
 * Can be used in route handlers for extra safety
 */
export const sanitizeValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    if (containsDangerousOperators(value)) {
      throw new Error('Dangerous operators detected in value');
    }
  }
  return mongoSanitize(value);
};

/**
 * Validate MongoDB ObjectId format (prevents injection via invalid IDs)
 *
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  // MongoDB ObjectId is 24 character hex string
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export default {
  sanitizeRequest,
  sanitizeValue,
  isValidObjectId,
  containsDangerousOperators,
};
