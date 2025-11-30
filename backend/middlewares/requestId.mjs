/**
 * Request ID Middleware
 *
 * @module middlewares/requestId
 * @description Generates or extracts request IDs for request correlation and tracing
 *
 * Features:
 * - Uses existing x-request-id header if present
 * - Generates UUID v4 if not present
 * - Attaches to req.id and res.locals.requestId
 * - Returns x-request-id in response headers
 */

import { randomUUID } from 'crypto';

/**
 * Middleware to handle request ID generation and propagation
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 *
 * Security: Request IDs help with log correlation for security incident investigation
 */
export const requestIdMiddleware = (req, res, next) => {
  // Use existing x-request-id or generate new UUID v4
  const requestId = req.headers['x-request-id'] || randomUUID();

  // Attach to request and response locals
  req.id = requestId;
  res.locals.requestId = requestId;

  // Return in response headers for client-side correlation
  res.setHeader('x-request-id', requestId);

  next();
};

export default requestIdMiddleware;
