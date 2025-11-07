import logger from '../config/logger.mjs';
import { trackRequest } from './metrics.mjs';

/**
 * Middleware to log HTTP requests and responses
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const responseTime = Date.now() - startTime;

    // Track metrics
    trackRequest(req.method, req.originalUrl, res.statusCode, responseTime);

    // Log response
    logger.info('Outgoing response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return originalSend.call(res, data);
  };

  next();
}

/**
 * Middleware to log errors
 */
export function errorLogger(err, req, res, next) {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  next(err);
}
