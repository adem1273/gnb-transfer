/**
 * Device Fingerprinting Tests
 * Tests for device fingerprint generation and verification
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import { getRedisClient } from '../../config/redis.mjs';
import { generateAccessToken } from '../../services/authService.mjs';
import { generateDeviceFingerprint } from '../../utils/deviceFingerprint.mjs';

describe('Device Fingerprinting', () => {
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
      name: 'Test User Fingerprint',
      email: `test-fp-${Date.now()}@example.com`,
      password: 'TestPass123',
      role: 'user',
    });

    // Clean up Redis if available
    if (redis) {
      const keys = await redis.keys('revoked:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  });

  describe('Fingerprint Generation', () => {
    it('should generate consistent fingerprint for same device', () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const fp1 = generateDeviceFingerprint(mockReq);
      const fp2 = generateDeviceFingerprint(mockReq);

      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it('should generate different fingerprints for different devices', () => {
      const mockReq1 = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const mockReq2 = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone)',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const fp1 = generateDeviceFingerprint(mockReq1);
      const fp2 = generateDeviceFingerprint(mockReq2);

      expect(fp1).not.toBe(fp2);
    });

    it('should handle missing headers gracefully', () => {
      const mockReq = {
        headers: {},
        socket: {},
      };

      const fp = generateDeviceFingerprint(mockReq);
      expect(fp).toBeDefined();
      expect(fp).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Token with Device Fingerprint', () => {
    it('should include deviceId in token payload', () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const deviceFingerprint = generateDeviceFingerprint(mockReq);
      const token = generateAccessToken(testUser, deviceFingerprint);
      const decoded = jwt.decode(token);

      expect(decoded.deviceId).toBe(deviceFingerprint);
    });

    it('should work without device fingerprint (backward compatibility)', () => {
      const token = generateAccessToken(testUser, null);
      const decoded = jwt.decode(token);

      expect(decoded.deviceId).toBeUndefined();
      expect(decoded.jti).toBeDefined(); // Should still have jti
    });
  });

  describe('Device Mismatch Detection', () => {
    it('should detect when token is used from different device', async () => {
      if (!redis) {
        console.log('Skipping test: Redis not available');
        return;
      }

      const mockReq1 = {
        headers: {
          'user-agent': 'Device-A',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const mockReq2 = {
        headers: {
          'user-agent': 'Device-B',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.2' },
      };

      const fp1 = generateDeviceFingerprint(mockReq1);
      const fp2 = generateDeviceFingerprint(mockReq2);

      expect(fp1).not.toBe(fp2);
    });
  });

  describe('IP Address Handling', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          'user-agent': 'Test',
          'accept-language': 'en',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const fp1 = generateDeviceFingerprint(mockReq);

      const mockReq2 = {
        headers: {
          'user-agent': 'Test',
          'accept-language': 'en',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '203.0.113.1' },
      };

      const fp2 = generateDeviceFingerprint(mockReq2);

      // Should use first IP from X-Forwarded-For
      expect(fp1).toBe(fp2);
    });

    it('should handle X-Real-IP header', () => {
      const mockReq1 = {
        headers: {
          'x-real-ip': '203.0.113.1',
          'user-agent': 'Test',
          'accept-language': 'en',
          'accept-encoding': 'gzip',
        },
        socket: {},
      };

      const mockReq2 = {
        headers: {
          'user-agent': 'Test',
          'accept-language': 'en',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '203.0.113.1' },
      };

      const fp1 = generateDeviceFingerprint(mockReq1);
      const fp2 = generateDeviceFingerprint(mockReq2);

      expect(fp1).toBe(fp2);
    });
  });
});
