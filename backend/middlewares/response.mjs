/**
 * Unified response middleware
 * Standardizes API responses to { success, message, data }
 */
export const responseMiddleware = (req, res, next) => {
  res.apiSuccess = (data, message = 'Success') => {
    res.json({
      success: true,
      message,
      data
    });
  };

  res.apiError = (message = 'Error', statusCode = 500, data = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      data
    });
  };

  next();
};
