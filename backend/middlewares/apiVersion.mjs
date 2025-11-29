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

// Set of valid API versions for validation
const VALID_VERSIONS = new Set(Object.values(API_VERSIONS));

/**
 * Validates if a version string is a known API version
 * @param {string} version - Version string to validate
 * @returns {boolean} True if version is valid
 */
const isValidVersion = (version) => {
  return version && VALID_VERSIONS.has(version);
};

/**
 * API Version Middleware
 * Detects and sets API version from URL path or header
 *
 * Priority: URL > Header > Default
 * Only accepts known API versions from API_VERSIONS
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const apiVersionMiddleware = (req, res, next) => {
  // Check header for version (only if it's a valid known version)
  const headerVersion = req.headers['api-version'];
  const validHeaderVersion = isValidVersion(headerVersion) ? headerVersion : null;

  // Check URL for version (only matches v1, v2, etc.)
  const urlMatch = req.path.match(/^\/api\/(v\d+)/);
  const urlVersion = urlMatch ? urlMatch[1] : null;
  const validUrlVersion = isValidVersion(urlVersion) ? urlVersion : null;

  // Priority: URL > Header > Default
  // Only accept validated versions to prevent header injection
  req.apiVersion = validUrlVersion || validHeaderVersion || API_VERSIONS.CURRENT;

  // Add version to response header (always a validated version)
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
