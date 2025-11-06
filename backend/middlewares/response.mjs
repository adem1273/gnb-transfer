/**
 * Response middleware to standardize all API responses
 * Adds res.apiSuccess and res.apiError helper methods
 */

export const responseMiddleware = (req, res, next) => {
  /**
   * Standard success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  res.apiSuccess = (data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };

  /**
   * Standard error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {*} data - Additional error data (optional)
   */
  res.apiError = (message = 'An error occurred', statusCode = 500, data = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data
    });
  };

  next();
};
