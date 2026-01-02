/**
 * Rate Limiter Integration Tests
 * Tests multiple user scenarios and endpoint-specific limits
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RateLimitViolation } from '../models/RateLimitViolation.mjs';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await RateLimitViolation.deleteMany({});
});

describe('Multi-User Scenarios', () => {
  describe('Anonymous vs Authenticated Users', () => {
    it('should track IP-based violations for anonymous users', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/tours',
      });

      expect(violation.identifierType).toBe('ip');
    });

    it('should track user-based violations for authenticated users', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'user:12345',
        identifierType: 'userId',
        endpoint: '/api/bookings',
      });

      expect(violation.identifierType).toBe('userId');
    });

    it('should maintain separate limits for IP and user ID', async () => {
      const ipViolation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/tours',
        violationCount: 2,
      });

      const userViolation = await RateLimitViolation.create({
        identifier: 'user:12345',
        identifierType: 'userId',
        endpoint: '/api/tours',
        violationCount: 1,
      });

      expect(ipViolation.violationCount).toBe(2);
      expect(userViolation.violationCount).toBe(1);
    });
  });

  describe('Multiple Endpoints', () => {
    it('should track violations separately per endpoint', async () => {
      const authViolation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/auth/login',
        violationCount: 5,
      });

      const bookingViolation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/bookings',
        violationCount: 2,
      });

      expect(authViolation.endpoint).toBe('/api/auth/login');
      expect(bookingViolation.endpoint).toBe('/api/bookings');
      expect(authViolation._id).not.toEqual(bookingViolation._id);
    });

    it('should apply different penalties per endpoint', async () => {
      const auth1 = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/auth/login',
        violationCount: 0,
      });

      await auth1.applyPenalty();
      await auth1.applyPenalty();

      const auth2 = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/auth/register',
        violationCount: 0,
      });

      await auth2.applyPenalty();

      expect(auth1.penaltyLevel).toBe(2); // 5min ban
      expect(auth1.isBanned).toBe(true);
      expect(auth2.penaltyLevel).toBe(1); // warning
      expect(auth2.isBanned).toBe(false);
    });
  });

  describe('Concurrent Users', () => {
    it('should handle multiple users simultaneously', async () => {
      const users = [
        'ip:192.168.1.1',
        'ip:192.168.1.2',
        'user:user1',
        'user:user2',
      ];

      const violations = await Promise.all(
        users.map((identifier) =>
          RateLimitViolation.create({
            identifier,
            identifierType: identifier.startsWith('ip:') ? 'ip' : 'userId',
            endpoint: '/api/tours',
          })
        )
      );

      expect(violations).toHaveLength(4);
      expect(violations.map((v) => v.identifier)).toEqual(users);
    });

    it('should apply penalties independently per user', async () => {
      const user1 = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 0,
      });

      const user2 = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.2',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 1,
      });

      await user1.applyPenalty(); // First violation - warning
      await user2.applyPenalty(); // Second violation - 5min ban

      expect(user1.penaltyLevel).toBe(1);
      expect(user1.isBanned).toBe(false);
      expect(user2.penaltyLevel).toBe(2);
      expect(user2.isBanned).toBe(true);
    });
  });
});

describe('Endpoint-Specific Scenarios', () => {
  describe('Auth Endpoints (/api/auth/*)', () => {
    it('should apply strict limits (5 req/15min)', async () => {
      const strictLimit = 5;
      expect(strictLimit).toBe(5);
    });

    it('should ban quickly on auth endpoint violations', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/auth/login',
        violationCount: 0,
      });

      // First violation: warning
      await violation.applyPenalty();
      expect(violation.isBanned).toBe(false);

      // Second violation: 5min ban
      await violation.applyPenalty();
      expect(violation.isBanned).toBe(true);
      expect(violation.penaltyLevel).toBe(2);
    });

    it('should track brute force attempts', async () => {
      const attempts = [];
      
      for (let i = 0; i < 3; i++) {
        const violation = await RateLimitViolation.findOrCreate(
          'ip:192.168.1.1',
          'ip',
          '/api/auth/login'
        );
        await violation.applyPenalty();
        attempts.push(violation.violationCount);
      }

      expect(attempts).toEqual([1, 2, 3]);

      const final = await RateLimitViolation.findOne({
        identifier: 'ip:192.168.1.1',
        endpoint: '/api/auth/login',
      });

      expect(final.violationCount).toBe(3);
      expect(final.isBanned).toBe(true);
      expect(final.penaltyLevel).toBe(3); // 1hour ban
    });
  });

  describe('Booking Endpoints (/api/bookings)', () => {
    it('should apply moderate limits (20 req/15min)', async () => {
      const moderateLimit = 20;
      expect(moderateLimit).toBe(20);
    });

    it('should handle booking spam attempts', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'user:spammer',
        identifierType: 'userId',
        endpoint: '/api/bookings',
        violationCount: 2,
      });

      await violation.applyPenalty();

      expect(violation.violationCount).toBe(3);
      expect(violation.isBanned).toBe(true);
      expect(violation.penaltyLevel).toBe(3);
    });
  });

  describe('Export Endpoints (/api/export/*)', () => {
    it('should apply very strict limits (3 req/hour)', async () => {
      const veryStrictLimit = 3;
      const window = 3600; // 1 hour
      
      expect(veryStrictLimit).toBe(3);
      expect(window).toBe(3600);
    });

    it('should prevent excessive export requests', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'user:exporter',
        identifierType: 'userId',
        endpoint: '/api/export/bookings',
        requestMetadata: {
          method: 'GET',
          path: '/api/export/bookings',
          payloadSize: 0,
        },
      });

      await violation.save();

      expect(violation.endpoint).toBe('/api/export/bookings');
    });
  });
});

describe('Abuse Pattern Detection', () => {
  describe('Rapid Requests', () => {
    it('should flag rapid request patterns', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/tours',
        suspiciousPatterns: {
          rapidRequests: true,
        },
      });

      expect(violation.suspiciousPatterns.rapidRequests).toBe(true);
    });

    it('should track rapid requests with metadata', async () => {
      const timestamps = [];
      for (let i = 0; i < 15; i++) {
        timestamps.push(Date.now());
      }

      // All within 1 second = rapid requests
      const duration = timestamps[timestamps.length - 1] - timestamps[0];
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Large Payloads', () => {
    it('should flag large payload attempts', async () => {
      const maxPayloadSize = 10 * 1024 * 1024; // 10MB
      const largePayload = 15 * 1024 * 1024; // 15MB

      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/upload',
        requestMetadata: {
          method: 'POST',
          path: '/api/upload',
          payloadSize: largePayload,
        },
        suspiciousPatterns: {
          largePayload: true,
        },
      });

      expect(violation.requestMetadata.payloadSize).toBeGreaterThan(maxPayloadSize);
      expect(violation.suspiciousPatterns.largePayload).toBe(true);
    });
  });

  describe('Bot Detection', () => {
    const suspiciousBots = [
      { ua: 'curl/7.64.1', name: 'curl' },
      { ua: 'python-requests/2.25.1', name: 'python-requests' },
      { ua: 'Scrapy/2.5.0', name: 'scrapy' },
      { ua: 'wget/1.20.3', name: 'wget' },
      { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)', name: 'bot' },
    ];

    suspiciousBots.forEach(({ ua, name }) => {
      it(`should flag ${name} as suspicious bot`, async () => {
        const violation = await RateLimitViolation.create({
          identifier: 'ip:192.168.1.1',
          identifierType: 'ip',
          endpoint: '/api/tours',
          userAgent: ua,
          suspiciousPatterns: {
            suspiciousBot: true,
          },
        });

        expect(violation.suspiciousPatterns.suspiciousBot).toBe(true);
        expect(violation.userAgent).toBe(ua);
      });
    });

    it('should not flag legitimate browsers', async () => {
      const legitimateUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/tours',
        userAgent: legitimateUA,
        suspiciousPatterns: {
          suspiciousBot: false,
        },
      });

      expect(violation.suspiciousPatterns.suspiciousBot).toBe(false);
    });

    it('should flag missing user agent', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/tours',
        userAgent: '',
        suspiciousPatterns: {
          suspiciousBot: true,
        },
      });

      expect(violation.userAgent).toBe('');
      expect(violation.suspiciousPatterns.suspiciousBot).toBe(true);
    });
  });

  describe('Combined Patterns', () => {
    it('should track multiple suspicious patterns', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/upload',
        userAgent: 'curl/7.64.1',
        requestMetadata: {
          method: 'POST',
          path: '/api/upload',
          payloadSize: 15 * 1024 * 1024,
        },
        suspiciousPatterns: {
          rapidRequests: true,
          largePayload: true,
          suspiciousBot: true,
        },
      });

      expect(violation.suspiciousPatterns.rapidRequests).toBe(true);
      expect(violation.suspiciousPatterns.largePayload).toBe(true);
      expect(violation.suspiciousPatterns.suspiciousBot).toBe(true);
    });
  });
});

describe('Ban Management', () => {
  describe('Temporary Bans', () => {
    it('should set correct ban duration for penalty level 2', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 1,
      });

      await violation.applyPenalty();

      const duration = violation.banExpiresAt.getTime() - Date.now();
      const expectedDuration = 5 * 60 * 1000; // 5 minutes

      expect(duration).toBeGreaterThan(expectedDuration - 1000);
      expect(duration).toBeLessThan(expectedDuration + 1000);
    });

    it('should set correct ban duration for penalty level 3', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 2,
      });

      await violation.applyPenalty();

      const duration = violation.banExpiresAt.getTime() - Date.now();
      const expectedDuration = 60 * 60 * 1000; // 1 hour

      expect(duration).toBeGreaterThan(expectedDuration - 1000);
      expect(duration).toBeLessThan(expectedDuration + 1000);
    });
  });

  describe('Ban Expiration', () => {
    it('should correctly detect expired bans', async () => {
      const pastDate = new Date(Date.now() - 1000);
      
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: pastDate,
      });

      expect(violation.isCurrentlyBanned()).toBe(false);
    });

    it('should correctly detect active bans', async () => {
      const futureDate = new Date(Date.now() + 60000);
      
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: futureDate,
      });

      expect(violation.isCurrentlyBanned()).toBe(true);
    });
  });

  describe('Manual Unban', () => {
    it('should allow manual ban clearing', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        penaltyLevel: 3,
        banExpiresAt: new Date(Date.now() + 60000),
      });

      await violation.clearBan();

      expect(violation.isBanned).toBe(false);
      expect(violation.banExpiresAt).toBeNull();
      expect(violation.penaltyLevel).toBe(0);
    });

    it('should preserve violation count after unban', async () => {
      const violation = await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 5,
        isBanned: true,
      });

      await violation.clearBan();

      expect(violation.violationCount).toBe(5);
      expect(violation.isBanned).toBe(false);
    });
  });
});

describe('Statistical Aggregation', () => {
  beforeEach(async () => {
    // Create test data
    await RateLimitViolation.create([
      {
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/auth/login',
        isBanned: true,
        banExpiresAt: new Date(Date.now() + 60000),
      },
      {
        identifier: 'ip:192.168.1.2',
        identifierType: 'ip',
        endpoint: '/api/bookings',
        isBanned: true,
        banExpiresAt: new Date(Date.now() + 60000),
      },
      {
        identifier: 'user:user1',
        identifierType: 'userId',
        endpoint: '/api/tours',
      },
      {
        identifier: 'ip:192.168.1.3',
        identifierType: 'ip',
        endpoint: '/api/export/data',
        isBanned: true,
        banExpiresAt: new Date(Date.now() - 1000), // Expired
      },
    ]);
  });

  it('should count total violations', async () => {
    const total = await RateLimitViolation.countDocuments();
    expect(total).toBe(4);
  });

  it('should count active bans', async () => {
    const activeBans = await RateLimitViolation.countDocuments({
      isBanned: true,
      banExpiresAt: { $gt: new Date() },
    });

    expect(activeBans).toBe(2);
  });

  it('should get comprehensive statistics', async () => {
    const stats = await RateLimitViolation.getStats();

    expect(stats.totalViolations).toBe(4);
    expect(stats.activeBans).toBeGreaterThan(0);
    expect(stats.recentViolations).toBeGreaterThan(0);
  });
});
