/**
 * Authentication Service
 *
 * @module services/authService
 * @description Handles JWT token generation, refresh token rotation, and token revocation
 *
 * Security features:
 * - Short-lived access tokens (15 minutes)
 * - Long-lived refresh tokens (30 days)
 * - Refresh token rotation on each use
 * - Token revocation and blacklisting
 * - Device fingerprinting for security
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.mjs';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d'; // 30 days

// Convert expiry string to milliseconds
const getExpiryMs = (expiry) => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  
  return value * (units[unit] || units.m);
};

/**
 * Generate access token (short-lived JWT)
 *
 * @param {object} user - User object with id, email, role
 * @returns {string} - Signed JWT access token
 *
 * Access tokens are short-lived and contain user claims
 * They are verified on each protected route request
 */
export const generateAccessToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate refresh token (long-lived, hashed in DB)
 *
 * @returns {string} - Random refresh token (not a JWT)
 *
 * Refresh tokens are stored hashed in database
 * They're used to obtain new access tokens without re-authentication
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Store refresh token in database (hashed)
 *
 * @param {ObjectId} userId - User ID
 * @param {string} refreshToken - Plain text refresh token
 * @param {object} deviceInfo - Browser/device information
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<object>} - Created RefreshToken document
 *
 * Security:
 * - Token is hashed before storage (bcrypt)
 * - Expires after REFRESH_TOKEN_EXPIRY duration
 * - Stores device info for auditing
 */
export const storeRefreshToken = async (userId, refreshToken, deviceInfo = {}, ipAddress = null) => {
  const expiresAt = new Date(Date.now() + getExpiryMs(REFRESH_TOKEN_EXPIRY));

  const tokenDoc = new RefreshToken({
    userId,
    expiresAt,
    deviceInfo,
    ipAddress,
  });

  await tokenDoc.hashToken(refreshToken);
  await tokenDoc.save();

  return tokenDoc;
};

/**
 * Verify and rotate refresh token
 *
 * @param {string} refreshToken - Plain text refresh token to verify
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<object>} - Object with new tokens and user ID
 * @throws {Error} - If token is invalid, revoked, or expired
 *
 * Security - Refresh Token Rotation:
 * 1. Verify the provided refresh token
 * 2. Check if it's not revoked and not expired
 * 3. Revoke the old refresh token
 * 4. Generate new access token and refresh token
 * 5. Store new refresh token
 * 6. Return new tokens
 *
 * This prevents token reuse attacks
 */
export const verifyAndRotateRefreshToken = async (refreshToken, ipAddress = null) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Find all non-revoked tokens and check each one
  // We can't query by hash, so we fetch all and verify in memory
  // For better performance, consider using Redis or token ID approach
  const tokens = await RefreshToken.find({
    revoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId', 'id email role name');

  let matchedToken = null;
  for (const tokenDoc of tokens) {
    const isValid = await tokenDoc.verifyToken(refreshToken);
    if (isValid) {
      matchedToken = tokenDoc;
      break;
    }
  }

  if (!matchedToken) {
    throw new Error('Invalid or expired refresh token');
  }

  // Additional security: Check if IP changed dramatically (optional)
  // This is a basic check - in production, use more sophisticated geolocation
  if (ipAddress && matchedToken.ipAddress && ipAddress !== matchedToken.ipAddress) {
    // Log suspicious activity but don't block (IP can change legitimately)
    console.warn(`Refresh token used from different IP: ${matchedToken.ipAddress} -> ${ipAddress}`);
  }

  const user = matchedToken.userId;

  // Revoke the old refresh token (rotation)
  await matchedToken.revoke('refresh');

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  // Store new refresh token
  const deviceInfo = matchedToken.deviceInfo || {};
  await storeRefreshToken(user._id, newRefreshToken, deviceInfo, ipAddress);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
};

/**
 * Revoke a specific refresh token
 *
 * @param {string} refreshToken - Plain text refresh token to revoke
 * @param {string} reason - Reason for revocation
 * @returns {Promise<boolean>} - True if revoked, false if not found
 *
 * Use case: User logs out from current device
 */
export const revokeRefreshToken = async (refreshToken, reason = 'logout') => {
  if (!refreshToken) {
    return false;
  }

  // Find and revoke the token
  const tokens = await RefreshToken.find({
    revoked: false,
  });

  for (const tokenDoc of tokens) {
    const isValid = await tokenDoc.verifyToken(refreshToken);
    if (isValid) {
      await tokenDoc.revoke(reason);
      return true;
    }
  }

  return false;
};

/**
 * Revoke all refresh tokens for a user
 *
 * @param {ObjectId} userId - User ID
 * @param {string} reason - Reason for revocation
 * @returns {Promise<object>} - Result of revocation
 *
 * Use cases:
 * - User logs out from all devices
 * - Password change
 * - Account compromise detected
 */
export const revokeAllUserTokens = async (userId, reason = 'logout') => {
  return RefreshToken.revokeAllForUser(userId, reason);
};

/**
 * Get device/browser information from request
 *
 * @param {object} req - Express request object
 * @returns {object} - Device information
 *
 * Extracts user-agent, platform, etc. for security auditing
 */
export const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Basic parsing - in production, use a library like 'ua-parser-js'
  const deviceInfo = {
    userAgent,
    platform: req.headers['sec-ch-ua-platform'] || 'unknown',
    browser: 'unknown',
    os: 'unknown',
  };

  // Simple browser detection
  if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
  else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
  else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

  // Simple OS detection
  if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
  else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
  else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
  else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
  else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

  return deviceInfo;
};

/**
 * Get client IP address from request
 *
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 *
 * Handles X-Forwarded-For header for proxied requests
 */
export const getClientIP = (req) => {
  // Handle proxied requests (e.g., behind nginx, CloudFlare)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Handle other proxy headers
  return (
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

export default {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getDeviceInfo,
  getClientIP,
};
