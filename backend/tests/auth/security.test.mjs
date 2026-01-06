/**
 * JWT Security Features Tests
 * Tests for token revocation, device fingerprinting, and session limits
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  logout,
} from '../../services/authService.mjs';
import { login } from '../../modules/auth/auth.service.mjs';
import { getRedisClient, initializeRedis } from '../../config/redis.mjs';
import { getJwtSecret } from '../../config/env.mjs';
import { SESSION } from '../../constants/limits.mjs';

describe('JWT Security Features', () => {
  let testUser;
  let redisClient;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
    }

    // Initialize Redis for testing
    redisClient = initializeRedis();
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await RefreshToken.deleteMany({ userId: testUser._id });
    }

    // Clean up Redis
    if (redisClient) {
      const keys = await redisClient.keys('revoked:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Security Test User',
      email: `security-test-${Date.now()}@example.com`,
      password: 'SecurePassword123',
      role: 'user',
    });

    // Clean up any existing tokens and Redis keys
    await RefreshToken.deleteMany({ userId: testUser._id });
    if (redisClient) {
      const keys = await redisClient.keys('revoked:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (testUser) {
      await RefreshToken.deleteMany({ userId: testUser._id });
    }
    if (redisClient) {
      const keys = await redisClient.keys('revoked:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  });

  describe('Token Revocation (Redis Blacklist)', () => {
    it('should include jti in generated access token', () => {
      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded).toBeDefined();
      expect(decoded.jti).toBeDefined();
      expect(typeof decoded.jti).toBe('string');
      expect(decoded.jti.length).toBeGreaterThan(0);
    });

    it('should blacklist access token on logout', async () => {
      if (!redisClient) {
        console.log('Skipping test - Redis not available');
        return;
      }

      const accessToken = generateAccessToken(testUser);
      const refreshTokenData = generateRefreshToken();
      await storeRefreshToken(testUser._id, refreshTokenData);

      // Logout should blacklist the access token
      await logout(refreshTokenData.token, accessToken);

      // Check if token is in Redis blacklist
      const decoded = jwt.decode(accessToken);
      const isBlacklisted = await redisClient.get(`revoked:${decoded.jti}`);
      
      expect(isBlacklisted).toBe('1');
    });

    it('should set correct TTL for blacklisted token', async () => {
      if (!redisClient) {
        console.log('Skipping test - Redis not available');
        return;
      }

      const accessToken = generateAccessToken(testUser);
      const refreshTokenData = generateRefreshToken();
      await storeRefreshToken(testUser._id, refreshTokenData);

      await logout(refreshTokenData.token, accessToken);

      const decoded = jwt.decode(accessToken);
      const ttl = await redisClient.ttl(`revoked:${decoded.jti}`);
      
      // TTL should be positive and less than token expiry
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(15 * 60); // 15 minutes max
    });

    it('should handle logout gracefully when Redis is unavailable', async () => {
      const accessToken = generateAccessToken(testUser);
      const refreshTokenData = generateRefreshToken();
      await storeRefreshToken(testUser._id, refreshTokenData);

      // Should not throw error even if Redis fails
      await expect(logout(refreshTokenData.token, accessToken)).resolves.toBeTruthy();
    });

    it('should handle tokens without jti (backward compatibility)', async () => {
      // Create token without jti manually
      const tokenWithoutJti = jwt.sign(
        {
          id: testUser._id,
          email: testUser.email,
          role: testUser.role,
        },
        getJwtSecret(),
        { expiresIn: '15m' }
      );

      const refreshTokenData = generateRefreshToken();
      await storeRefreshToken(testUser._id, refreshTokenData);

      // Should not throw error for old tokens
      await expect(logout(refreshTokenData.token, tokenWithoutJti)).resolves.toBeTruthy();
    });
  });

  describe('Device Fingerprinting', () => {
    it('should include deviceId in access token when fingerprint provided', () => {
      const deviceFingerprint = 'test-device-fingerprint-hash';
      const token = generateAccessToken(testUser, deviceFingerprint);
      const decoded = jwt.decode(token);

      expect(decoded.deviceId).toBe(deviceFingerprint);
    });

    it('should generate token without deviceId when not provided', () => {
      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded.deviceId).toBeNull();
    });

    it('should bind token to device on login', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      const result = await login(testUser.email, 'SecurePassword123', mockReq);
      const decoded = jwt.decode(result.accessToken);

      expect(decoded.deviceId).toBeDefined();
      expect(typeof decoded.deviceId).toBe('string');
      expect(decoded.deviceId.length).toBeGreaterThan(0);
    });

    it('should generate consistent fingerprint for same device', async () => {
      const { generateDeviceFingerprint } = await import('../../utils/deviceFingerprint.mjs');
      
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      const fingerprint1 = generateDeviceFingerprint(mockReq);
      const fingerprint2 = generateDeviceFingerprint(mockReq);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different devices', async () => {
      const { generateDeviceFingerprint } = await import('../../utils/deviceFingerprint.mjs');
      
      const mockReq1 = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Chrome)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
      };

      const mockReq2 = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Firefox)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
      };

      const fingerprint1 = generateDeviceFingerprint(mockReq1);
      const fingerprint2 = generateDeviceFingerprint(mockReq2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe('Session Limit', () => {
    it('should enforce maximum concurrent sessions', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      // Create SESSION.MAX_CONCURRENT sessions
      for (let i = 0; i < SESSION.MAX_CONCURRENT; i++) {
        await login(testUser.email, 'SecurePassword123', mockReq);
      }

      // Verify we have exactly MAX_CONCURRENT active sessions
      let activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      expect(activeCount).toBe(SESSION.MAX_CONCURRENT);

      // Create one more session - should revoke the oldest
      await login(testUser.email, 'SecurePassword123', mockReq);

      // Should still have only MAX_CONCURRENT active sessions
      activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      expect(activeCount).toBe(SESSION.MAX_CONCURRENT);
    });

    it('should revoke oldest session when limit exceeded', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      // Create MAX_CONCURRENT sessions with delays to ensure order
      const sessions = [];
      for (let i = 0; i < SESSION.MAX_CONCURRENT; i++) {
        const result = await login(testUser.email, 'SecurePassword123', mockReq);
        sessions.push(result);
        // Small delay to ensure different createdAt timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Get the first (oldest) session's token
      const oldestToken = await RefreshToken.findOne({
        userId: testUser._id,
        revoked: false
      }).sort({ createdAt: 1 });

      const oldestTokenId = oldestToken.tokenId;

      // Create one more session
      await login(testUser.email, 'SecurePassword123', mockReq);

      // The oldest token should now be revoked
      const revokedToken = await RefreshToken.findOne({ tokenId: oldestTokenId });
      
      expect(revokedToken.revoked).toBe(true);
      expect(revokedToken.revokedReason).toBe('max_sessions');
    });

    it('should allow login when under session limit', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      // Create fewer sessions than the limit
      for (let i = 0; i < SESSION.MAX_CONCURRENT - 1; i++) {
        await login(testUser.email, 'SecurePassword123', mockReq);
      }

      const activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      expect(activeCount).toBe(SESSION.MAX_CONCURRENT - 1);

      // One more login should work without revoking any
      await login(testUser.email, 'SecurePassword123', mockReq);

      const newActiveCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      expect(newActiveCount).toBe(SESSION.MAX_CONCURRENT);

      // Verify no tokens were revoked yet
      const revokedCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: true
      });

      expect(revokedCount).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should create fully secured token on login', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      const result = await login(testUser.email, 'SecurePassword123', mockReq);
      const decoded = jwt.decode(result.accessToken);

      // Verify all security features are present
      expect(decoded.jti).toBeDefined(); // Token revocation support
      expect(decoded.deviceId).toBeDefined(); // Device binding
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should handle full logout flow with all security features', async () => {
      if (!redisClient) {
        console.log('Skipping test - Redis not available');
        return;
      }

      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'accept-language': 'en-US',
        },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      };

      const result = await login(testUser.email, 'SecurePassword123', mockReq);
      
      // Verify refresh token is active
      const activeTokensBefore = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false
      });
      expect(activeTokensBefore).toBe(1);

      // Logout
      await logout(result.refreshToken, result.accessToken);

      // Verify refresh token is revoked
      const activeTokensAfter = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false
      });
      expect(activeTokensAfter).toBe(0);

      // Verify access token is blacklisted in Redis
      const decoded = jwt.decode(result.accessToken);
      const isBlacklisted = await redisClient.get(`revoked:${decoded.jti}`);
      expect(isBlacklisted).toBe('1');
    });
  });
});
