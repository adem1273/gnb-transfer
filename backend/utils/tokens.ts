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

import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { ITokenPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

type TokenPayload = Omit<ITokenPayload, 'iat' | 'exp'>;

/**
 * Generate JWT access token with configurable TTL
 *
 * @param payload - Token payload (id, email, role)
 * @param ttl - Time to live (default: ACCESS_TOKEN_TTL from env)
 * @returns Signed JWT token
 *
 * @example
 * const token = generateAccessToken({ id: '123', email: 'user@example.com', role: 'user' });
 */
export const generateAccessToken = (
  payload: TokenPayload,
  ttl: SignOptions['expiresIn'] = ACCESS_TOKEN_TTL as SignOptions['expiresIn']
): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ttl });
};

/**
 * Generate secure random refresh token string
 *
 * @returns 128-character hex string
 *
 * Security: Uses crypto.randomBytes for cryptographically secure randomness
 */
export const generateRefreshTokenString = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash refresh token using SHA-256
 *
 * @param plain - Plain text refresh token
 * @returns SHA-256 hash of the token
 *
 * Security: Tokens are stored hashed in database for additional security
 */
export const hashRefreshToken = (plain: string): string => {
  return crypto.createHash('sha256').update(plain).digest('hex');
};

/**
 * Verify JWT access token
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log(payload.id, payload.email, payload.role);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export const verifyAccessToken = (token: string): ITokenPayload => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, JWT_SECRET) as ITokenPayload;
};

/**
 * Get refresh token TTL in milliseconds
 *
 * @returns TTL in milliseconds
 * @throws Error if TTL format is invalid
 */
export const getRefreshTokenTTL = (): number => {
  const ttl = REFRESH_TOKEN_TTL;

  if (!ttl || ttl.length < 2) {
    throw new Error('Invalid REFRESH_TOKEN_TTL format');
  }

  const unit = ttl.slice(-1);
  const value = parseInt(ttl.slice(0, -1), 10);

  if (isNaN(value) || value <= 0) {
    throw new Error('Invalid REFRESH_TOKEN_TTL value: must be a positive number');
  }

  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  if (!units[unit]) {
    throw new Error(`Invalid REFRESH_TOKEN_TTL unit: ${unit}. Must be one of: s, m, h, d`);
  }

  return value * units[unit];
};

export default {
  generateAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
  verifyAccessToken,
  getRefreshTokenTTL,
};
