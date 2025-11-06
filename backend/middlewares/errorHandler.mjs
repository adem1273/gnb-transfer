/**
 * Centralized error handling middleware
 * Catches and processes all errors in the application
 */

/**
 * Error handler middleware
 * Handles all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  } else if (err.name === 'CastError') {
    // Invalid ObjectId
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    // Duplicate key error
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response using standardized format
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  errorHandler,
  asyncHandler,
};
