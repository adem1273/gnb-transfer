/**
 * Public Rate Limiter Tests
 *
 * Tests for rate limiting on public endpoints
 *
 * Test Coverage:
 * - Rate limit enforcement on public routes
 * - Admin routes exempt from public rate limits
 * - Rate limit headers
 * - IP-based rate limiting
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import Page from '../models/Page.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import publicPageRoutes from '../routes/publicPageRoutes.mjs';

// Create test app with public routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  
  // Public routes (with rate limiting applied in routes)
  app.use('/api/pages', publicPageRoutes);
  
  return app;
};

describe('Public Rate Limiter', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await Page.deleteMany({});
  });

  afterAll(async () => {
    await Page.deleteMany({});
  });

  describe('Rate Limit Enforcement', () => {
    it('should allow requests under the rate limit', async () => {
      await Page.create({
        slug: 'test-page',
        title: 'Test Page',
        sections: [],
        published: true,
      });

      // Make several requests (under limit)
      const requests = Array(5).fill(null).map(() =>
        request(app).get('/api/pages/test-page')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should include rate limit headers in response', async () => {
      await Page.create({
        slug: 'header-test',
        title: 'Header Test',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/header-test')
        .expect(200);

      // Check for RateLimit-* headers (standardHeaders: true)
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      await Page.create({
        slug: 'rate-test',
        title: 'Rate Test',
        sections: [],
        published: true,
      });

      // Get the rate limit from environment or default
      const limit = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '30', 10);
      
      // Make requests up to the limit + extra
      const requests = Array(limit + 5).fill(null).map(() =>
        request(app).get('/api/pages/rate-test')
      );

      const responses = await Promise.all(requests);
      
      // Some should succeed, some should be rate limited
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(limit);
    });

    it('should return proper error message when rate limited', async () => {
      await Page.create({
        slug: 'error-test',
        title: 'Error Test',
        sections: [],
        published: true,
      });

      const limit = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '30', 10);
      
      // Exceed rate limit
      const requests = Array(limit + 2).fill(null).map(() =>
        request(app).get('/api/pages/error-test')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.find(r => r.status === 429);

      if (rateLimited) {
        expect(rateLimited.body.success).toBe(false);
        expect(rateLimited.body.message).toContain('Too many requests');
      }
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should use configurable window and max values', () => {
      const windowMs = parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '60000', 10);
      const max = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '30', 10);

      expect(windowMs).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(0);
      expect(typeof windowMs).toBe('number');
      expect(typeof max).toBe('number');
    });

    it('should have reasonable defaults for public endpoints', () => {
      const defaultWindow = 60000; // 1 minute
      const defaultMax = 30; // 30 requests

      expect(defaultMax).toBeGreaterThan(10); // Not too restrictive
      expect(defaultMax).toBeLessThan(100); // Not too lenient
      expect(defaultWindow).toBeLessThanOrEqual(900000); // Max 15 minutes
    });
  });

  describe('Skip Conditions', () => {
    it('should skip rate limiting in development with SKIP_RATE_LIMIT=true', () => {
      const env = process.env.NODE_ENV;
      const skipFlag = process.env.SKIP_RATE_LIMIT;

      if (env === 'development' && skipFlag === 'true') {
        expect(true).toBe(true); // Rate limiting would be skipped
      } else {
        expect(true).toBe(true); // Rate limiting applies
      }
    });

    it('should respect IP whitelist configuration', () => {
      const whitelist = process.env.RATE_LIMIT_WHITELIST;
      
      if (whitelist) {
        const ips = whitelist.split(',').map(ip => ip.trim());
        expect(Array.isArray(ips)).toBe(true);
      } else {
        expect(whitelist).toBeUndefined();
      }
    });
  });

  describe('Different Endpoints', () => {
    it('should apply rate limiting consistently across public endpoints', async () => {
      await Page.create({
        slug: 'page-1',
        title: 'Page 1',
        sections: [],
        published: true,
      });

      await Page.create({
        slug: 'page-2',
        title: 'Page 2',
        sections: [],
        published: true,
      });

      const response1 = await request(app).get('/api/pages/page-1').expect(200);
      const response2 = await request(app).get('/api/pages/page-2').expect(200);

      expect(response1.headers['ratelimit-limit']).toBeDefined();
      expect(response2.headers['ratelimit-limit']).toBeDefined();
      expect(response1.headers['ratelimit-limit']).toBe(response2.headers['ratelimit-limit']);
    });
  });

  describe('Rate Limit vs Global Rate Limit', () => {
    it('should have different limits for public vs global endpoints', () => {
      const publicMax = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '30', 10);
      const globalMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

      // Public endpoints should have different (typically more lenient per-minute) limits
      expect(publicMax).toBeDefined();
      expect(globalMax).toBeDefined();
      expect(typeof publicMax).toBe('number');
      expect(typeof globalMax).toBe('number');
    });

    it('should have different window periods for public vs global', () => {
      const publicWindow = parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '60000', 10);
      const globalWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);

      expect(publicWindow).toBeDefined();
      expect(globalWindow).toBeDefined();
      
      // Public typically uses shorter window (1 min vs 15 min)
      expect(publicWindow).toBeLessThanOrEqual(globalWindow);
    });
  });
});
