/**
 * Error Handler Utility
 *
 * Centralized error handling for consistent error messages and UX
 */

/**
 * Maps API error codes to user-friendly messages
 * @param {object} error - Error object from API
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
  // Handle network errors
  if (!error) {
    return 'An unexpected error occurred';
  }

  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your internet connection.';
  }

  // Handle HTTP errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return error.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return error.message || 'Conflict. This resource already exists.';
      case 422:
        return error.message || 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        if (error.status >= 500) {
          return 'Server error. Please try again later.';
        }
        if (error.status >= 400) {
          return error.message || 'Request failed. Please try again.';
        }
    }
  }

  // Return the error message if available
  return error.message || 'An unexpected error occurred';
}

/**
 * Handles error and returns both user message and console message
 * @param {object} error - Error object
 * @param {string} context - Context description (e.g., 'deleting user')
 * @returns {object} { userMessage, consoleMessage }
 */
export function handleError(error, context = 'performing this action') {
  const userMessage = getUserFriendlyMessage(error);
  const consoleMessage = `Error ${context}: ${error.message || JSON.stringify(error)}`;

  // Log to console for debugging
  console.error(consoleMessage, error);

  return {
    userMessage,
    consoleMessage,
  };
}

/**
 * Extracts validation errors from API response
 * @param {object} error - Error object with validation errors
 * @returns {object} Field-level error messages
 */
export function extractValidationErrors(error) {
  if (error?.data?.errors && Array.isArray(error.data.errors)) {
    // Express-validator format: [{ msg, param, location }]
    return error.data.errors.reduce((acc, err) => {
      acc[err.param] = err.msg;
      return acc;
    }, {});
  }

  if (error?.data?.validationErrors) {
    // Custom validation format: { field: message }
    return error.data.validationErrors;
  }

  return {};
}

/**
 * Checks if error requires authentication
 * @param {object} error - Error object
 * @returns {boolean} True if auth required
 */
export function isAuthError(error) {
  return error?.status === 401;
}

/**
 * Checks if error is a permission error
 * @param {object} error - Error object
 * @returns {boolean} True if permission denied
 */
export function isPermissionError(error) {
  return error?.status === 403;
}

/**
 * Checks if error is a network error
 * @param {object} error - Error object
 * @returns {boolean} True if network error
 */
export function isNetworkError(error) {
  return error?.code === 'NETWORK_ERROR' || !error?.status;
}

export default {
  getUserFriendlyMessage,
  handleError,
  extractValidationErrors,
  isAuthError,
  isPermissionError,
  isNetworkError,
};
