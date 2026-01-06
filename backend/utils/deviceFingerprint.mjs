/**
 * Device Fingerprinting Utility
 * 
 * @module utils/deviceFingerprint
 * @description Generates device fingerprints for enhanced token security
 * 
 * Security features:
 * - Creates unique fingerprint from user-agent, language, and IP
 * - Uses SHA-256 for consistent hashing
 * - Helps detect token theft/reuse from different devices
 */

import crypto from 'crypto';

/**
 * Generate a device fingerprint from request headers and IP
 * 
 * @param {object} req - Express request object
 * @returns {string} - SHA-256 hash of device components
 * 
 * @example
 * const fingerprint = generateDeviceFingerprint(req);
 * // Returns: "a1b2c3d4e5f6..."
 * 
 * Note: This is a basic fingerprint. In production, consider using
 * more sophisticated methods or libraries for device detection.
 */
export const generateDeviceFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.socket?.remoteAddress || req.ip || ''
  ].join('|');
  
  return crypto.createHash('sha256').update(components).digest('hex');
};

export default { generateDeviceFingerprint };
