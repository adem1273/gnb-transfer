/**
 * Token Utilities
 *
 * @module utils/tokens
 * @description JWT token generation and verification utilities
 *
 * This module provides centralized token management for:
 * - Access token generation (short-lived JWT)
 * - Refresh token generation (secure random strings)
 * - Token hashing (SHA-256)
 * - Token verification
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getJwtSecret } from '../config/env.mjs';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

/**
 * Generate JWT access token with configurable TTL
 *
 * @param {object} payload - Token payload (id, email, role)
 * @param {string} [ttl] - Time to live (default: ACCESS_TOKEN_TTL from env)
 * @returns {string} - Signed JWT token
 *
 * @example
 * const token = generateAccessToken({ id: '123', email: 'user@example.com', role: 'user' });
 */
export const generateAccessToken = (payload, ttl = ACCESS_TOKEN_TTL) => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: ttl });
};

/**
 * Generate secure random refresh token string
 *
 * @returns {string} - 128-character hex string
 *
 * Security: Uses crypto.randomBytes for cryptographically secure randomness
 */
export const generateRefreshTokenString = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash refresh token using SHA-256
 *
 * @param {string} plain - Plain text refresh token
 * @returns {string} - SHA-256 hash of the token
 *
 * Security: Tokens are stored hashed in database for additional security
 */
export const hashRefreshToken = (plain) => {
  return crypto.createHash('sha256').update(plain).digest('hex');
};

/**
 * Verify JWT access token
 *
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log(payload.id, payload.email, payload.role);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export const verifyAccessToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

/**
 * Get refresh token TTL in milliseconds
 *
 * @returns {number} - TTL in milliseconds
 */
export const getRefreshTokenTTL = () => {
  const ttl = REFRESH_TOKEN_TTL;
  const unit = ttl.slice(-1);
  const value = parseInt(ttl.slice(0, -1), 10);

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (units[unit] || units.d);
};

export default {
  generateAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
  verifyAccessToken,
  getRefreshTokenTTL,
};
