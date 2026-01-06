/**
 * Session Limit Tests
 * Tests for concurrent session limiting
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../models/User.mjs';
import RefreshToken from '../../models/RefreshToken.mjs';
import { SESSION } from '../../constants/limits.mjs';
import { login } from '../../modules/auth/auth.service.mjs';

describe('Concurrent Session Limit', () => {
  let testUser;

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
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User Sessions',
      email: `test-session-${Date.now()}@example.com`,
      password: 'TestPass123',
      role: 'user',
    });

    // Clean up any existing tokens for this user
    await RefreshToken.deleteMany({ userId: testUser._id });
  });

  describe('Session Limit Enforcement', () => {
    it('should allow up to MAX_CONCURRENT sessions', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Browser',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const tokens = [];

      // Create MAX_CONCURRENT sessions
      for (let i = 0; i < SESSION.MAX_CONCURRENT; i++) {
        const result = await login(testUser.email, 'TestPass123', {
          ...mockReq,
          headers: {
            ...mockReq.headers,
            'user-agent': `Device-${i}`, // Different device for each session
          },
        });
        
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        tokens.push(result);
      }

      // Verify all sessions are active
      const activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      expect(activeCount).toBe(SESSION.MAX_CONCURRENT);
    });

    it('should revoke oldest session when limit exceeded', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Browser',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      // Create MAX_CONCURRENT sessions
      const sessions = [];
      for (let i = 0; i < SESSION.MAX_CONCURRENT; i++) {
        const result = await login(testUser.email, 'TestPass123', {
          ...mockReq,
          headers: {
            ...mockReq.headers,
            'user-agent': `Device-${i}`,
          },
        });
        sessions.push(result);
        
        // Small delay to ensure different createdAt timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Get the first (oldest) session's token ID
      const oldestToken = await RefreshToken.findOne({
        userId: testUser._id,
      }).sort({ createdAt: 1 });
      const oldestTokenId = oldestToken._id;

      // Create one more session (should exceed limit)
      await login(testUser.email, 'TestPass123', {
        ...mockReq,
        headers: {
          ...mockReq.headers,
          'user-agent': 'Device-New',
        },
      });

      // Check that oldest session was revoked
      const revokedSession = await RefreshToken.findById(oldestTokenId);
      expect(revokedSession.revoked).toBe(true);
      expect(revokedSession.revokedReason).toBe('max_sessions_exceeded');

      // Check total active sessions is still MAX_CONCURRENT
      const activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });
      expect(activeCount).toBe(SESSION.MAX_CONCURRENT);
    });

    it('should not revoke sessions if under limit', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Browser',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      // Create sessions under the limit
      const sessionsToCreate = SESSION.MAX_CONCURRENT - 1;
      
      for (let i = 0; i < sessionsToCreate; i++) {
        await login(testUser.email, 'TestPass123', {
          ...mockReq,
          headers: {
            ...mockReq.headers,
            'user-agent': `Device-${i}`,
          },
        });
      }

      // Check no sessions were revoked
      const revokedCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: true
      });
      expect(revokedCount).toBe(0);

      // Check active count is correct
      const activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false
      });
      expect(activeCount).toBe(sessionsToCreate);
    });

    it('should only count non-revoked sessions for limit', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Browser',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        },
        socket: { remoteAddress: '192.168.1.1' },
      };

      // Create and immediately revoke some sessions
      for (let i = 0; i < 3; i++) {
        await login(testUser.email, 'TestPass123', {
          ...mockReq,
          headers: {
            ...mockReq.headers,
            'user-agent': `Old-Device-${i}`,
          },
        });
      }

      // Revoke all existing sessions
      await RefreshToken.updateMany(
        { userId: testUser._id },
        { $set: { revoked: true, revokedReason: 'test' } }
      );

      // Create MAX_CONCURRENT new sessions
      for (let i = 0; i < SESSION.MAX_CONCURRENT; i++) {
        const result = await login(testUser.email, 'TestPass123', {
          ...mockReq,
          headers: {
            ...mockReq.headers,
            'user-agent': `New-Device-${i}`,
          },
        });
        expect(result.accessToken).toBeDefined();
      }

      // Check only MAX_CONCURRENT active sessions exist
      const activeCount = await RefreshToken.countDocuments({
        userId: testUser._id,
        revoked: false
      });
      expect(activeCount).toBe(SESSION.MAX_CONCURRENT);
    });
  });

  describe('Session Limit Configuration', () => {
    it('should have SESSION.MAX_CONCURRENT defined', () => {
      expect(SESSION.MAX_CONCURRENT).toBeDefined();
      expect(typeof SESSION.MAX_CONCURRENT).toBe('number');
      expect(SESSION.MAX_CONCURRENT).toBeGreaterThan(0);
    });

    it('should have SESSION.CLEANUP_INTERVAL defined', () => {
      expect(SESSION.CLEANUP_INTERVAL).toBeDefined();
      expect(typeof SESSION.CLEANUP_INTERVAL).toBe('number');
      expect(SESSION.CLEANUP_INTERVAL).toBeGreaterThan(0);
    });
  });
});
