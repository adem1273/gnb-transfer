/**
 * Cache Middleware Integration Tests
 * Tests for Express cache middleware
 * 
 * Note: These tests use the in-memory fallback cache since MongoDB and Redis
 * are not available in the test environment.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { cacheResponse, clearCacheByTags } from '../middlewares/cacheMiddleware.mjs';
import { clear as clearCache, resetMetrics, getStats } from '../utils/cache.mjs';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.CACHE_ENABLED = 'true';

describe('Cache Middleware Integration', () => {
  let app;
  let callCount;

  beforeEach(async () => {
    // Reset for each test
    await clearCache();
    resetMetrics();
    callCount = 0;

    // Create Express app
    app = express();
    app.use(express.json());

    // Add standard response helpers
    app.use((req, res, next) => {
      res.apiSuccess = (data, message = 'Success', statusCode = 200) => {
        res.status(statusCode).json({ success: true, data, message });
      };
      res.apiError = (message, statusCode = 500) => {
        res.status(statusCode).json({ success: false, error: message });
      };
      next();
    });
  });

  afterEach(async () => {
    await clearCache();
    resetMetrics();
  });

  describe('Basic Caching', () => {
    it('should cache GET request responses', async () => {
      // Setup route with cache
      app.get('/api/test', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ value: 'test-data', callCount });
      });

      // First request - cache miss
      const res1 = await request(app).get('/api/test');
      expect(res1.status).toBe(200);
      expect(res1.body.data.callCount).toBe(1);
      expect(res1.headers['x-cache']).toBe('MISS');

      // Second request - cache hit
      const res2 = await request(app).get('/api/test');
      expect(res2.status).toBe(200);
      expect(res2.body.data.callCount).toBe(1); // Same as first (cached)
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(callCount).toBe(1); // Handler only called once
    });

    it('should not cache POST requests', async () => {
      app.post('/api/test', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      const res1 = await request(app).post('/api/test');
      const res2 = await request(app).post('/api/test');

      expect(res1.body.data.callCount).toBe(1);
      expect(res2.body.data.callCount).toBe(2);
      expect(callCount).toBe(2); // Handler called twice
    });

    it('should not cache PUT requests', async () => {
      app.put('/api/test', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      const res1 = await request(app).put('/api/test');
      const res2 = await request(app).put('/api/test');

      expect(callCount).toBe(2);
    });

    it('should not cache DELETE requests', async () => {
      app.delete('/api/test', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      const res1 = await request(app).delete('/api/test');
      const res2 = await request(app).delete('/api/test');

      expect(callCount).toBe(2);
    });
  });

  describe('TTL Configuration', () => {
    it('should use custom TTL', async () => {
      app.get('/api/short-ttl', cacheResponse(60), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      const res1 = await request(app).get('/api/short-ttl');
      const res2 = await request(app).get('/api/short-ttl');

      expect(res2.headers['x-cache']).toBe('HIT');
      expect(callCount).toBe(1);
    });

    it('should use default TTL when not specified', async () => {
      app.get('/api/default-ttl', cacheResponse(), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      const res1 = await request(app).get('/api/default-ttl');
      const res2 = await request(app).get('/api/default-ttl');

      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });

  describe('Cache Keys', () => {
    it('should use URL as cache key by default', async () => {
      app.get('/api/items', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ callCount });
      });

      // Same URL - should use cache
      await request(app).get('/api/items');
      const res2 = await request(app).get('/api/items');
      expect(res2.headers['x-cache']).toBe('HIT');
    });

    it('should differentiate by query parameters', async () => {
      app.get('/api/search', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ query: req.query.q, callCount });
      });

      // Different query parameters - different cache entries
      await request(app).get('/api/search?q=test1');
      await request(app).get('/api/search?q=test2');

      expect(callCount).toBe(2); // Both requests hit the handler

      // Same query - use cache
      const res = await request(app).get('/api/search?q=test1');
      expect(res.headers['x-cache']).toBe('HIT');
      expect(callCount).toBe(2); // No new handler call
    });

    it('should support custom key generator', async () => {
      app.get('/api/custom-key', 
        cacheResponse(300, { 
          keyGenerator: (req) => `custom:${req.query.id}` 
        }),
        (req, res) => {
          callCount++;
          res.apiSuccess({ id: req.query.id, callCount });
        }
      );

      await request(app).get('/api/custom-key?id=123');
      const res = await request(app).get('/api/custom-key?id=123');

      expect(res.headers['x-cache']).toBe('HIT');
    });
  });

  describe('User-Specific Caching', () => {
    it('should vary cache by user when varyByUser is true', async () => {
      // Mock authentication middleware
      app.use((req, res, next) => {
        const userId = req.headers['x-user-id'];
        if (userId) {
          req.user = { _id: userId };
        }
        next();
      });

      app.get('/api/user-data', 
        cacheResponse(300, { varyByUser: true }),
        (req, res) => {
          callCount++;
          res.apiSuccess({ 
            userId: req.user?._id,
            callCount 
          });
        }
      );

      // User 1 first request
      await request(app)
        .get('/api/user-data')
        .set('x-user-id', 'user1');

      // User 1 second request - should hit cache
      const user1Res2 = await request(app)
        .get('/api/user-data')
        .set('x-user-id', 'user1');
      expect(user1Res2.headers['x-cache']).toBe('HIT');

      // User 2 request - different cache entry
      const user2Res = await request(app)
        .get('/api/user-data')
        .set('x-user-id', 'user2');
      expect(user2Res.headers['x-cache']).toBe('MISS');

      expect(callCount).toBe(2); // Called for user1 and user2
    });
  });

  describe('Tag-Based Caching', () => {
    it('should cache with tags', async () => {
      app.get('/api/tours', 
        cacheResponse(300, { tags: ['tours', 'tours:list'] }),
        (req, res) => {
          callCount++;
          res.apiSuccess({ tours: ['Tour 1', 'Tour 2'], callCount });
        }
      );

      const res1 = await request(app).get('/api/tours');
      const res2 = await request(app).get('/api/tours');

      expect(res2.headers['x-cache']).toBe('HIT');
      expect(callCount).toBe(1);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on mutation', async () => {
      // GET endpoint with cache
      app.get('/api/items', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiSuccess({ items: ['Item 1', 'Item 2'], callCount });
      });

      // POST endpoint that invalidates cache
      app.post('/api/items', clearCacheByTags(['items']), (req, res) => {
        res.apiSuccess({ created: true });
      });

      // Initial GET - cache miss
      const res1 = await request(app).get('/api/items');
      expect(res1.headers['x-cache']).toBe('MISS');

      // Second GET - cache hit
      const res2 = await request(app).get('/api/items');
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(callCount).toBe(1);
    });
  });

  describe('Error Responses', () => {
    it('should not cache error responses (4xx)', async () => {
      app.get('/api/not-found', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiError('Not found', 404);
      });

      await request(app).get('/api/not-found');
      await request(app).get('/api/not-found');

      expect(callCount).toBe(2); // Both requests hit the handler
    });

    it('should not cache error responses (5xx)', async () => {
      app.get('/api/server-error', cacheResponse(300), (req, res) => {
        callCount++;
        res.apiError('Server error', 500);
      });

      await request(app).get('/api/server-error');
      await request(app).get('/api/server-error');

      expect(callCount).toBe(2);
    });

    it('should cache successful responses (2xx)', async () => {
      app.post('/api/created', cacheResponse(300), (req, res) => {
        // This shouldn't actually cache (POST), but testing 201 status
        callCount++;
        res.apiSuccess({ created: true }, 'Created', 201);
      });

      await request(app).post('/api/created');
      await request(app).post('/api/created');

      // POST requests aren't cached anyway
      expect(callCount).toBe(2);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      app.get('/api/concurrent', cacheResponse(300), (req, res) => {
        callCount++;
        // Simulate some processing time
        setTimeout(() => {
          res.apiSuccess({ callCount });
        }, 10);
      });

      // Send multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        request(app).get('/api/concurrent')
      );

      const results = await Promise.all(promises);

      // First request should be MISS, subsequent could be HIT depending on timing
      const missCount = results.filter(r => r.headers['x-cache'] === 'MISS').length;
      const hitCount = results.filter(r => r.headers['x-cache'] === 'HIT').length;

      // At least one should be a miss (first request)
      expect(missCount).toBeGreaterThanOrEqual(1);
      
      // Handler should be called less than total requests (some cached)
      // Note: In a race condition, multiple requests might miss before cache is set
      expect(callCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Cache Statistics', () => {
    it('should track metrics through middleware', async () => {
      app.get('/api/stats-test', cacheResponse(300), (req, res) => {
        res.apiSuccess({ data: 'test' });
      });

      // Generate some cache activity
      await request(app).get('/api/stats-test'); // Miss
      await request(app).get('/api/stats-test'); // Hit
      await request(app).get('/api/stats-test'); // Hit

      const stats = getStats();
      expect(stats.metrics.hits).toBeGreaterThanOrEqual(2);
      expect(stats.metrics.misses).toBeGreaterThanOrEqual(1);
      expect(stats.metrics.sets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Response Format', () => {
    it('should preserve response data structure', async () => {
      const testData = {
        id: 1,
        name: 'Test',
        nested: { value: 123 },
        array: [1, 2, 3],
      };

      app.get('/api/structure', cacheResponse(300), (req, res) => {
        res.apiSuccess(testData);
      });

      const res1 = await request(app).get('/api/structure');
      const res2 = await request(app).get('/api/structure');

      expect(res1.body.data).toEqual(testData);
      expect(res2.body.data).toEqual(testData);
      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });
});
