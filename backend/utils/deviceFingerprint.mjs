/**
 * Device Fingerprinting Utility
 * 
 * @module utils/deviceFingerprint
 * @description Generates unique device fingerprints for token binding
 * 
 * Security features:
 * - SHA-256 hashing of device components
 * - Proxy-aware IP detection
 * - Browser and OS fingerprinting
 * - Non-reversible hash generation
 */

import crypto from 'crypto';

/**
 * Generate device fingerprint from request headers
 * 
 * @param {object} req - Express request object
 * @returns {string} SHA-256 hash of device components
 * 
 * @example
 * const fingerprint = generateDeviceFingerprint(req);
 * // Returns: 'a3d5f8b2c1e9...' (64-char hex string)
 * 
 * Components used:
 * - User-Agent header (browser, OS, device info)
 * - Accept-Language (user's language preferences)
 * - Accept-Encoding (compression support)
 * - Client IP address (with proxy support)
 * 
 * Security note:
 * - Hash is non-reversible (SHA-256)
 * - Does not store PII directly
 * - Changes if user switches devices/browsers
 */
export const generateDeviceFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    getClientIP(req),
  ].join('|');
  
  return crypto.createHash('sha256').update(components).digest('hex');
};

/**
 * Get client IP address (supports proxies and load balancers)
 * 
 * @param {object} req - Express request object
 * @returns {string} Client IP address
 * 
 * Handles various proxy headers in priority order:
 * 1. X-Forwarded-For (standard proxy header)
 * 2. X-Real-IP (nginx and similar)
 * 3. Direct socket connection
 * 
 * @example
 * const ip = getClientIP(req);
 * // Returns: '192.168.1.1' or 'unknown'
 */
const getClientIP = (req) => {
  // Handle X-Forwarded-For (can contain multiple IPs: client, proxy1, proxy2)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  
  // Fallback to other headers/connection info
  return (
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

export default { generateDeviceFingerprint };
