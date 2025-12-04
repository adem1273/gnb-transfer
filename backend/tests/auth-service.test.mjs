/**
 * Authentication Service Tests
 * Tests for refresh token rotation and revocation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import RefreshToken from '../models/RefreshToken.mjs';
import User from '../models/User.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/authService.mjs';

describe('Authentication Service - Refresh Tokens', () => {
  let testUser;
  let testRefreshToken;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
    }
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
    await RefreshToken.deleteMany({ userId: testUser?._id });
    // Don't close connection as it might be used by other tests
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123',
      role: 'user',
    });

    // Clean up any existing tokens for this user
    await RefreshToken.deleteMany({ userId: testUser._id });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should throw error if JWT_SECRET not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => generateAccessToken(testUser)).toThrow('JWT_SECRET is not configured');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random refresh token', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      
      expect(token1).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(50); // Should be long
      expect(token1).not.toBe(token2); // Should be unique
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in database (hashed)', async () => {
      testRefreshToken = generateRefreshToken();
      const deviceInfo = {
        userAgent: 'Test Agent',
        browser: 'Chrome',
        os: 'Windows',
      };
      const ipAddress = '192.168.1.1';

      const tokenDoc = await storeRefreshToken(
        testUser._id,
        testRefreshToken,
        deviceInfo,
        ipAddress
      );

      expect(tokenDoc).toBeDefined();
      expect(tokenDoc.userId.toString()).toBe(testUser._id.toString());
      expect(tokenDoc.tokenHash).toBeDefined();
      expect(tokenDoc.tokenHash).not.toBe(testRefreshToken); // Should be hashed
      expect(tokenDoc.deviceInfo.browser).toBe('Chrome');
      expect(tokenDoc.ipAddress).toBe('192.168.1.1');
      expect(tokenDoc.revoked).toBe(false);
      expect(tokenDoc.expiresAt).toBeInstanceOf(Date);
    });

    it('should verify stored token', async () => {
      testRefreshToken = generateRefreshToken();
      const tokenDoc = await storeRefreshToken(testUser._id, testRefreshToken);

      const isValid = await tokenDoc.verifyToken(testRefreshToken);
      expect(isValid).toBe(true);

      const isInvalid = await tokenDoc.verifyToken('wrong-token');
      expect(isInvalid).toBe(false);
    });
  });

  describe('verifyAndRotateRefreshToken', () => {
    beforeEach(async () => {
      // Store a valid refresh token
      testRefreshToken = generateRefreshToken();
      await storeRefreshToken(testUser._id, testRefreshToken);
    });

    it('should rotate refresh token successfully', async () => {
      const result = await verifyAndRotateRefreshToken(testRefreshToken, '192.168.1.1');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(testRefreshToken); // New token
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);

      // Old token should be revoked
      const oldTokens = await RefreshToken.find({
        userId: testUser._id,
        revoked: true,
        revokedReason: 'refresh',
      });
      expect(oldTokens.length).toBe(1);

      // New token should exist
      const newTokens = await RefreshToken.find({
        userId: testUser._id,
        revoked: false,
      });
      expect(newTokens.length).toBe(1);
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        verifyAndRotateRefreshToken('invalid-token', '192.168.1.1')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should reject revoked refresh token', async () => {
      // Revoke the token
      await revokeRefreshToken(testRefreshToken);

      await expect(
        verifyAndRotateRefreshToken(testRefreshToken, '192.168.1.1')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('revokeRefreshToken', () => {
    beforeEach(async () => {
      testRefreshToken = generateRefreshToken();
      await storeRefreshToken(testUser._id, testRefreshToken);
    });

    it('should revoke a specific refresh token', async () => {
      const result = await revokeRefreshToken(testRefreshToken, 'logout');
      expect(result).toBe(true);

      // Token should be revoked in database
      const tokenDoc = await RefreshToken.findOne({ userId: testUser._id });
      expect(tokenDoc.revoked).toBe(true);
      expect(tokenDoc.revokedReason).toBe('logout');
      expect(tokenDoc.revokedAt).toBeInstanceOf(Date);
    });

    it('should return false for non-existent token', async () => {
      const result = await revokeRefreshToken('non-existent-token');
      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    beforeEach(async () => {
      // Create multiple refresh tokens for the user
      for (let i = 0; i < 3; i++) {
        const token = generateRefreshToken();
        await storeRefreshToken(testUser._id, token);
      }
    });

    it('should revoke all refresh tokens for a user', async () => {
      const result = await revokeAllUserTokens(testUser._id, 'password_change');

      expect(result.modifiedCount).toBe(3);

      // All tokens should be revoked
      const revokedTokens = await RefreshToken.find({
        userId: testUser._id,
        revoked: true,
      });
      expect(revokedTokens.length).toBe(3);

      revokedTokens.forEach((token) => {
        expect(token.revokedReason).toBe('password_change');
      });
    });

    it('should return 0 if no active tokens exist', async () => {
      // Revoke all tokens first
      await revokeAllUserTokens(testUser._id);

      // Try revoking again
      const result = await revokeAllUserTokens(testUser._id);
      expect(result.modifiedCount).toBe(0);
    });
  });

  describe('RefreshToken Model Methods', () => {
    it('should get active token count for user', async () => {
      // Create 2 active tokens
      await storeRefreshToken(testUser._id, generateRefreshToken());
      await storeRefreshToken(testUser._id, generateRefreshToken());

      const count = await RefreshToken.getActiveCountForUser(testUser._id);
      expect(count).toBe(2);

      // Revoke one
      const tokens = await RefreshToken.find({ userId: testUser._id });
      await tokens[0].revoke();

      const newCount = await RefreshToken.getActiveCountForUser(testUser._id);
      expect(newCount).toBe(1);
    });
  });
});
