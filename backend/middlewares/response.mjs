/**
 * Response middleware - provides standardized API response methods
 * Adds res.apiSuccess and res.apiError helper methods to all responses
 */

export function responseMiddleware(req, res, next) {
  res.apiSuccess = (data = null, message = 'OK', status = 200) => {
    return res.status(status).json({ success: true, message, data });
  };
  
  res.apiError = (message = 'Error', status = 500) => {
    return res.status(status).json({ success: false, message, data: null });
  };
  
  next();
}

export default responseMiddleware;
