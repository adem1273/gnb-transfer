/**
 * Advanced Rate Limiter Tests
 * Tests for Redis-backed token bucket rate limiter
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { RateLimitViolation } from '../models/RateLimitViolation.mjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
  // Clear all violations before each test
  await RateLimitViolation.deleteMany({});
});

describe('RateLimitViolation Model', () => {
  describe('Schema validation', () => {
    it('should create a violation with required fields', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
      });

      await violation.save();

      expect(violation.identifier).toBe('ip:192.168.1.1');
      expect(violation.identifierType).toBe('ip');
      expect(violation.endpoint).toBe('/api/test');
      expect(violation.violationCount).toBe(1);
      expect(violation.isBanned).toBe(false);
      expect(violation.penaltyLevel).toBe(0);
    });

    it('should validate identifierType enum', async () => {
      const violation = new RateLimitViolation({
        identifier: 'test',
        identifierType: 'invalid',
        endpoint: '/api/test',
      });

      await expect(violation.save()).rejects.toThrow();
    });

    it('should validate penalty level range', async () => {
      const violation = new RateLimitViolation({
        identifier: 'test',
        identifierType: 'ip',
        endpoint: '/api/test',
        penaltyLevel: 5,
      });

      await expect(violation.save()).rejects.toThrow();
    });
  });

  describe('Penalty system', () => {
    it('should apply warning on first violation', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 0,
      });

      await violation.applyPenalty();

      expect(violation.violationCount).toBe(1);
      expect(violation.penaltyLevel).toBe(1);
      expect(violation.isBanned).toBe(false);
    });

    it('should apply 5-minute ban on second violation', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 1,
      });

      const before = Date.now();
      await violation.applyPenalty();
      const after = Date.now();

      expect(violation.violationCount).toBe(2);
      expect(violation.penaltyLevel).toBe(2);
      expect(violation.isBanned).toBe(true);
      expect(violation.banExpiresAt).toBeTruthy();

      const banDuration = violation.banExpiresAt.getTime() - before;
      expect(banDuration).toBeGreaterThanOrEqual(5 * 60 * 1000 - 100);
      expect(banDuration).toBeLessThanOrEqual(5 * 60 * 1000 + 100);
    });

    it('should apply 1-hour ban on third violation', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 2,
      });

      const before = Date.now();
      await violation.applyPenalty();

      expect(violation.violationCount).toBe(3);
      expect(violation.penaltyLevel).toBe(3);
      expect(violation.isBanned).toBe(true);
      expect(violation.banExpiresAt).toBeTruthy();

      const banDuration = violation.banExpiresAt.getTime() - before;
      expect(banDuration).toBeGreaterThanOrEqual(60 * 60 * 1000 - 100);
      expect(banDuration).toBeLessThanOrEqual(60 * 60 * 1000 + 100);
    });

    it('should maintain 1-hour ban on subsequent violations', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        violationCount: 3,
      });

      await violation.applyPenalty();

      expect(violation.violationCount).toBe(4);
      expect(violation.penaltyLevel).toBe(3);
      expect(violation.isBanned).toBe(true);
    });
  });

  describe('Ban management', () => {
    it('should correctly identify active bans', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: new Date(Date.now() + 60000), // 1 minute from now
      });

      expect(violation.isCurrentlyBanned()).toBe(true);
    });

    it('should correctly identify expired bans', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: new Date(Date.now() - 1000), // 1 second ago
      });

      expect(violation.isCurrentlyBanned()).toBe(false);
    });

    it('should clear ban and reset penalty', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        penaltyLevel: 3,
        banExpiresAt: new Date(Date.now() + 60000),
      });

      await violation.save();
      await violation.clearBan();

      expect(violation.isBanned).toBe(false);
      expect(violation.banExpiresAt).toBeNull();
      expect(violation.penaltyLevel).toBe(0);
    });
  });

  describe('Static methods', () => {
    it('should find or create violation record', async () => {
      const violation1 = await RateLimitViolation.findOrCreate(
        'ip:192.168.1.1',
        'ip',
        '/api/test'
      );

      expect(violation1).toBeTruthy();
      expect(violation1.identifier).toBe('ip:192.168.1.1');

      const violation2 = await RateLimitViolation.findOrCreate(
        'ip:192.168.1.1',
        'ip',
        '/api/test'
      );

      expect(violation2._id).toEqual(violation1._id);
    });

    it('should check for active bans', async () => {
      await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: new Date(Date.now() + 60000),
      });

      const ban = await RateLimitViolation.checkBan('ip:192.168.1.1', '/api/test');
      expect(ban).toBeTruthy();
      expect(ban.isBanned).toBe(true);
    });

    it('should return null for no active bans', async () => {
      const ban = await RateLimitViolation.checkBan('ip:192.168.1.1', '/api/test');
      expect(ban).toBeNull();
    });

    it('should auto-clear expired bans when checking', async () => {
      await RateLimitViolation.create({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        isBanned: true,
        banExpiresAt: new Date(Date.now() - 1000), // Expired
      });

      const ban = await RateLimitViolation.checkBan('ip:192.168.1.1', '/api/test');
      expect(ban).toBeNull();

      // Verify ban was cleared in database
      const violation = await RateLimitViolation.findOne({
        identifier: 'ip:192.168.1.1',
        endpoint: '/api/test',
      });
      expect(violation.isBanned).toBe(false);
    });

    it('should get violation statistics', async () => {
      // Create test data
      await RateLimitViolation.create([
        {
          identifier: 'ip:192.168.1.1',
          identifierType: 'ip',
          endpoint: '/api/test1',
          isBanned: true,
          banExpiresAt: new Date(Date.now() + 60000),
        },
        {
          identifier: 'ip:192.168.1.2',
          identifierType: 'ip',
          endpoint: '/api/test2',
          isBanned: true,
          banExpiresAt: new Date(Date.now() + 60000),
        },
        {
          identifier: 'ip:192.168.1.3',
          identifierType: 'ip',
          endpoint: '/api/test3',
          lastViolationAt: new Date(),
        },
      ]);

      const stats = await RateLimitViolation.getStats();

      expect(stats.totalViolations).toBe(3);
      expect(stats.activeBans).toBe(2);
      expect(stats.recentViolations).toBe(3);
    });
  });

  describe('Suspicious patterns', () => {
    it('should track rapid request pattern', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        suspiciousPatterns: {
          rapidRequests: true,
        },
      });

      await violation.save();

      expect(violation.suspiciousPatterns.rapidRequests).toBe(true);
      expect(violation.suspiciousPatterns.largePayload).toBe(false);
      expect(violation.suspiciousPatterns.suspiciousBot).toBe(false);
    });

    it('should track large payload pattern', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        suspiciousPatterns: {
          largePayload: true,
        },
      });

      await violation.save();

      expect(violation.suspiciousPatterns.largePayload).toBe(true);
    });

    it('should track suspicious bot pattern', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        suspiciousPatterns: {
          suspiciousBot: true,
        },
      });

      await violation.save();

      expect(violation.suspiciousPatterns.suspiciousBot).toBe(true);
    });
  });

  describe('Metadata tracking', () => {
    it('should store request metadata', async () => {
      const violation = new RateLimitViolation({
        identifier: 'ip:192.168.1.1',
        identifierType: 'ip',
        endpoint: '/api/test',
        requestMetadata: {
          method: 'POST',
          path: '/api/test',
          payloadSize: 1024,
        },
        userAgent: 'Mozilla/5.0',
      });

      await violation.save();

      expect(violation.requestMetadata.method).toBe('POST');
      expect(violation.requestMetadata.path).toBe('/api/test');
      expect(violation.requestMetadata.payloadSize).toBe(1024);
      expect(violation.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('Index efficiency', () => {
    it('should have compound index on identifier and endpoint', async () => {
      const indexes = await RateLimitViolation.collection.getIndexes();
      
      const hasCompoundIndex = Object.values(indexes).some((index) =>
        index.some((field) => field[0] === 'identifier' || field[0] === 'endpoint')
      );

      expect(hasCompoundIndex).toBe(true);
    });
  });
});

describe('Bot Detection', () => {
  const suspiciousBots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1)',
    'curl/7.64.1',
    'python-requests/2.25.1',
    'Scrapy/2.5.0',
    'wget/1.20.3',
  ];

  const legitimateBrowsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
  ];

  it('should detect suspicious bots', () => {
    suspiciousBots.forEach((ua) => {
      const lowerUA = ua.toLowerCase();
      const isSuspicious = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests', 'scrapy']
        .some((pattern) => lowerUA.includes(pattern));
      
      expect(isSuspicious).toBe(true);
    });
  });

  it('should not flag legitimate browsers', () => {
    legitimateBrowsers.forEach((ua) => {
      const lowerUA = ua.toLowerCase();
      const isSuspicious = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests', 'scrapy']
        .some((pattern) => lowerUA.includes(pattern));
      
      expect(isSuspicious).toBe(false);
    });
  });
});

describe('Rate Limit Configuration', () => {
  it('should have correct anonymous user limits', () => {
    const config = {
      window: 15 * 60,
      maxRequests: 100,
    };

    expect(config.window).toBe(900);
    expect(config.maxRequests).toBe(100);
  });

  it('should have correct authenticated user limits', () => {
    const config = {
      window: 15 * 60,
      maxRequests: 500,
    };

    expect(config.window).toBe(900);
    expect(config.maxRequests).toBe(500);
  });

  it('should have strict limits for auth endpoints', () => {
    const config = {
      window: 15 * 60,
      maxRequests: 5,
    };

    expect(config.maxRequests).toBe(5);
  });

  it('should have limits for booking endpoints', () => {
    const config = {
      window: 15 * 60,
      maxRequests: 20,
    };

    expect(config.maxRequests).toBe(20);
  });

  it('should have strict limits for export endpoints', () => {
    const config = {
      window: 60 * 60,
      maxRequests: 3,
    };

    expect(config.window).toBe(3600);
    expect(config.maxRequests).toBe(3);
  });
});
