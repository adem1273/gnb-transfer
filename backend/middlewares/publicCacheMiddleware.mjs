/**
 * Public Cache Middleware with ETag Support
 * 
 * Implements HTTP caching with ETag generation and 304 Not Modified responses
 * for public-facing endpoints only.
 * 
 * Features:
 * - ETag generation based on response content
 * - 304 Not Modified responses for unchanged content
 * - Configurable cache TTL
 * - Public cache headers
 * - Safe for published-only content
 */

import crypto from 'crypto';

/**
 * Generate ETag from response data
 * @param {object|string} data - Response data to hash
 * @returns {string} - ETag hash
 */
const generateETag = (data) => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
};

/**
 * Public cache middleware with ETag support
 * 
 * @param {number} maxAge - Cache duration in seconds (default: 300 = 5 minutes)
 * @returns {Function} Express middleware
 */
export const publicCacheMiddleware = (maxAge = 300) => {
  return (req, res, next) => {
    // Only cache GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to add ETag and cache headers
    res.json = (data) => {
      // Only process successful responses
      if (res.statusCode === 200 && data && data.success !== false) {
        // Generate ETag from response data
        const etag = generateETag(data);
        
        // Check if client has cached version (If-None-Match header)
        const clientETag = req.headers['if-none-match'];
        
        if (clientETag === etag) {
          // Client has the same version - return 304 Not Modified
          res.status(304);
          res.removeHeader('Content-Type');
          res.removeHeader('Content-Length');
          return res.end();
        }
        
        // Set ETag header
        res.setHeader('ETag', etag);
        
        // Set Cache-Control for public caching
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        
        // Add Vary header to ensure proper caching
        res.setHeader('Vary', 'Accept-Encoding');
      }
      
      return originalJson(data);
    };

    next();
  };
};

/**
 * No-cache middleware for admin/authenticated routes
 * Ensures private data is never cached
 */
export const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
