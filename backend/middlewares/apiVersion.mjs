/**
 * API Version Middleware
 *
 * @module middlewares/apiVersion
 * @description Handles API versioning through URL path and headers
 */

export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  CURRENT: 'v1',
};

/**
 * API Version Middleware
 * Detects and sets API version from URL path or header
 *
 * Priority: URL > Header > Default
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const apiVersionMiddleware = (req, res, next) => {
  // Check header for version
  const headerVersion = req.headers['api-version'];

  // Check URL for version
  const urlMatch = req.path.match(/^\/api\/(v\d+)/);
  const urlVersion = urlMatch ? urlMatch[1] : null;

  // Priority: URL > Header > Default
  req.apiVersion = urlVersion || headerVersion || API_VERSIONS.CURRENT;

  // Add version to response header
  res.setHeader('X-API-Version', req.apiVersion);

  next();
};

/**
 * Deprecation Warning Middleware
 * Adds deprecation headers for deprecated API versions
 *
 * @param {string} version - The deprecated version
 * @param {string} sunsetDate - ISO 8601 date when version will be removed
 * @returns {function} Express middleware function
 */
export const deprecationWarning = (version, sunsetDate) => {
  return (req, res, next) => {
    if (req.apiVersion === version) {
      res.setHeader('Deprecation', `date="${sunsetDate}"`);
      res.setHeader('Sunset', sunsetDate);
      res.setHeader('Link', '</api/v2>; rel="successor-version"');
    }
    next();
  };
};
