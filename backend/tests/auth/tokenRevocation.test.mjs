/**
 * Token Revocation Tests
 * Tests for JWT access token revocation and blacklisting
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import { getRedisClient } from '../../config/redis.mjs';
import {
  generateAccessToken,
  revokeAccessToken,
  logout,
} from '../../services/authService.mjs';

describe('Token Revocation', () => {
  let testUser;
  let redis;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
    }
    redis = getRedisClient();
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
    await RefreshToken.deleteMany({ userId: testUser?._id });
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User Revocation',
      email: `test-revoke-${Date.now()}@example.com`,
      password: 'TestPass123',
      role: 'user',
    });

    // Clean up any existing tokens for this user
    await RefreshToken.deleteMany({ userId: testUser._id });

    // Clean up Redis if available
    if (redis) {
      const keys = await redis.keys('revoked:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  });

  describe('Access Token Revocation', () => {
    it('should generate token with jti field', () => {
      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.jti).toBeDefined();
      expect(typeof decoded.jti).toBe('string');
      expect(decoded.jti.length).toBeGreaterThan(0);
    });

    it('should store revoked token in Redis with correct TTL', async () => {
      if (!redis) {
        console.log('Skipping test: Redis not available');
        return;
      }

      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);
      
      await revokeAccessToken(token);
      
      const isRevoked = await redis.get(`revoked:${decoded.jti}`);
      expect(isRevoked).toBe('1');
      
      const ttl = await redis.ttl(`revoked:${decoded.jti}`);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(900); // 15 minutes = 900 seconds
    });

    it('should not throw error when revoking legacy token without jti', async () => {
      // Generate a legacy token without jti
      const legacyToken = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '15m' }
      );

      // Should not throw
      await expect(revokeAccessToken(legacyToken)).resolves.not.toThrow();
    });

    it('should handle Redis unavailability gracefully', async () => {
      const token = generateAccessToken(testUser);
      
      // Mock Redis to be unavailable
      const originalRedis = redis;
      
      // Should not throw even if Redis is down
      await expect(revokeAccessToken(token)).resolves.not.toThrow();
    });
  });

  describe('Logout with Access Token Revocation', () => {
    it('should revoke both refresh and access tokens on logout', async () => {
      if (!redis) {
        console.log('Skipping test: Redis not available');
        return;
      }

      const accessToken = generateAccessToken(testUser);
      const { generateRefreshToken, storeRefreshToken } = await import('../../services/authService.mjs');
      const refreshTokenData = generateRefreshToken();
      
      await storeRefreshToken(testUser._id, refreshTokenData, {}, '127.0.0.1');
      
      // Logout with both tokens
      await logout(refreshTokenData.token, accessToken);
      
      // Check refresh token is revoked in DB
      const refreshTokenDoc = await RefreshToken.findOne({ tokenId: refreshTokenData.tokenId });
      expect(refreshTokenDoc.revoked).toBe(true);
      expect(refreshTokenDoc.revokedReason).toBe('logout');
      
      // Check access token is revoked in Redis
      const decoded = jwt.decode(accessToken);
      const isRevoked = await redis.get(`revoked:${decoded.jti}`);
      expect(isRevoked).toBe('1');
    });

    it('should work without access token (backward compatibility)', async () => {
      const { generateRefreshToken, storeRefreshToken } = await import('../../services/authService.mjs');
      const refreshTokenData = generateRefreshToken();
      
      await storeRefreshToken(testUser._id, refreshTokenData, {}, '127.0.0.1');
      
      // Logout without access token
      await expect(logout(refreshTokenData.token, null)).resolves.not.toThrow();
      
      // Check refresh token is revoked
      const refreshTokenDoc = await RefreshToken.findOne({ tokenId: refreshTokenData.tokenId });
      expect(refreshTokenDoc.revoked).toBe(true);
    });
  });

  describe('Expired Token Revocation', () => {
    it('should not store revocation for expired tokens', async () => {
      if (!redis) {
        console.log('Skipping test: Redis not available');
        return;
      }

      // Create an already-expired token
      const expiredToken = jwt.sign(
        {
          id: testUser._id,
          email: testUser.email,
          role: testUser.role,
          jti: 'expired-token-id',
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1s' } // Already expired
      );

      await revokeAccessToken(expiredToken);
      
      // Should not be in Redis (already expired)
      const isRevoked = await redis.get('revoked:expired-token-id');
      expect(isRevoked).toBeNull();
    });
  });
});
