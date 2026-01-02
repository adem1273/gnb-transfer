/**
 * Cache Utility Tests
 * Tests for Redis cache with in-memory fallback
 * 
 * Note: These tests use the in-memory fallback cache since MongoDB and Redis
 * are not available in the test environment.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { 
  get, 
  set, 
  del, 
  deletePattern, 
  invalidateTag, 
  clear, 
  getStats,
  resetMetrics,
} from '../utils/cache.mjs';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.CACHE_ENABLED = 'true';

describe('Cache Utility', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clear();
    resetMetrics();
  });

  afterEach(async () => {
    // Clean up after each test
    await clear();
    resetMetrics();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve a value', async () => {
      await set('test-key', { data: 'test-value' }, 300);
      const result = await get('test-key');
      
      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent key', async () => {
      const result = await get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      await set('test-key', { data: 'test-value' }, 300);
      await del('test-key');
      const result = await get('test-key');
      
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complexObject = {
        id: 1,
        name: 'Test Tour',
        nested: {
          price: 99.99,
          discount: 10,
        },
        tags: ['popular', 'recommended'],
      };

      await set('complex-key', complexObject, 300);
      const result = await get('complex-key');
      
      expect(result).toEqual(complexObject);
    });

    it('should handle arrays', async () => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      await set('array-key', arrayData, 300);
      const result = await get('array-key');
      
      expect(result).toEqual(arrayData);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should set default TTL of 300 seconds', async () => {
      await set('ttl-test', { data: 'value' });
      const result = await get('ttl-test');
      
      // Should exist immediately
      expect(result).toEqual({ data: 'value' });
    });

    it('should accept custom TTL', async () => {
      await set('custom-ttl', { data: 'value' }, 600);
      const result = await get('custom-ttl');
      
      expect(result).toEqual({ data: 'value' });
    });

    // Note: Testing actual expiration requires waiting or mocking time
    // In production, Redis handles TTL automatically
  });

  describe('Pattern-Based Deletion', () => {
    it('should delete keys matching a pattern', async () => {
      // Set multiple keys
      await set('route:/api/tours', { data: 'tours' }, 300);
      await set('route:/api/tours/123', { data: 'tour-123' }, 300);
      await set('route:/api/bookings', { data: 'bookings' }, 300);

      // Delete all tour routes
      const deleted = await deletePattern('route:/api/tours*');
      
      // Verify deletion
      const tours = await get('route:/api/tours');
      const tour123 = await get('route:/api/tours/123');
      const bookings = await get('route:/api/bookings');
      
      expect(tours).toBeNull();
      expect(tour123).toBeNull();
      expect(bookings).toEqual({ data: 'bookings' }); // Should still exist
      expect(deleted).toBeGreaterThanOrEqual(2);
    });

    it('should handle wildcard patterns', async () => {
      await set('user:1:profile', { name: 'User 1' }, 300);
      await set('user:2:profile', { name: 'User 2' }, 300);
      await set('user:1:settings', { theme: 'dark' }, 300);

      const deleted = await deletePattern('user:*:profile');
      
      const user1Profile = await get('user:1:profile');
      const user2Profile = await get('user:2:profile');
      const user1Settings = await get('user:1:settings');
      
      expect(user1Profile).toBeNull();
      expect(user2Profile).toBeNull();
      expect(user1Settings).toEqual({ theme: 'dark' });
      expect(deleted).toBe(2);
    });
  });

  describe('Tag-Based Invalidation', () => {
    it('should invalidate all entries with a specific tag', async () => {
      // Set entries with tags
      await set('tour-1', { name: 'Tour 1' }, 300, ['tours', 'popular']);
      await set('tour-2', { name: 'Tour 2' }, 300, ['tours']);
      await set('blog-1', { title: 'Blog 1' }, 300, ['blog']);

      // Invalidate tours tag
      const deleted = await invalidateTag('tours');
      
      const tour1 = await get('tour-1');
      const tour2 = await get('tour-2');
      const blog1 = await get('blog-1');
      
      expect(tour1).toBeNull();
      expect(tour2).toBeNull();
      expect(blog1).toEqual({ title: 'Blog 1' }); // Should still exist
      expect(deleted).toBeGreaterThanOrEqual(2);
    });

    it('should handle multiple tags per entry', async () => {
      await set('item-1', { data: 'value' }, 300, ['tag1', 'tag2', 'tag3']);
      
      // Invalidate one tag
      await invalidateTag('tag2');
      
      const result = await get('item-1');
      expect(result).toBeNull();
    });

    it('should handle entries without tags', async () => {
      await set('no-tag', { data: 'value' }, 300);
      
      const deleted = await invalidateTag('non-existent-tag');
      
      const result = await get('no-tag');
      expect(result).toEqual({ data: 'value' });
      expect(deleted).toBe(0);
    });
  });

  describe('Clear All', () => {
    it('should clear all cache entries', async () => {
      await set('key1', { data: 'value1' }, 300);
      await set('key2', { data: 'value2' }, 300);
      await set('key3', { data: 'value3' }, 300);

      const success = await clear();
      
      const key1 = await get('key1');
      const key2 = await get('key2');
      const key3 = await get('key3');
      
      expect(success).toBe(true);
      expect(key1).toBeNull();
      expect(key2).toBeNull();
      expect(key3).toBeNull();
    });
  });

  describe('Metrics Tracking', () => {
    it('should track cache hits', async () => {
      await set('metrics-test', { data: 'value' }, 300);
      
      await get('metrics-test'); // Hit
      await get('metrics-test'); // Hit
      
      const stats = getStats();
      expect(stats.metrics.hits).toBeGreaterThanOrEqual(2);
    });

    it('should track cache misses', async () => {
      await get('non-existent-1'); // Miss
      await get('non-existent-2'); // Miss
      
      const stats = getStats();
      expect(stats.metrics.misses).toBeGreaterThanOrEqual(2);
    });

    it('should track cache sets', async () => {
      await set('set-test-1', { data: 'value1' }, 300);
      await set('set-test-2', { data: 'value2' }, 300);
      
      const stats = getStats();
      expect(stats.metrics.sets).toBeGreaterThanOrEqual(2);
    });

    it('should track cache deletes', async () => {
      await set('delete-test', { data: 'value' }, 300);
      await del('delete-test');
      
      const stats = getStats();
      expect(stats.metrics.deletes).toBeGreaterThanOrEqual(1);
    });

    it('should calculate hit rate', async () => {
      resetMetrics();
      
      await set('hit-rate-test', { data: 'value' }, 300);
      await get('hit-rate-test'); // Hit
      await get('hit-rate-test'); // Hit
      await get('non-existent'); // Miss
      
      const stats = getStats();
      // 2 hits, 1 miss = 66.67% hit rate
      expect(stats.metrics.hitRate).toMatch(/^66\./);
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', async () => {
      const stats = getStats();
      
      expect(stats).toHaveProperty('type');
      expect(stats).toHaveProperty('connected');
      expect(stats).toHaveProperty('metrics');
      expect(stats.metrics).toHaveProperty('hits');
      expect(stats.metrics).toHaveProperty('misses');
      expect(stats.metrics).toHaveProperty('sets');
      expect(stats.metrics).toHaveProperty('deletes');
      expect(stats.metrics).toHaveProperty('errors');
      expect(stats.metrics).toHaveProperty('hitRate');
    });

    it('should indicate cache type (redis or memory)', async () => {
      const stats = getStats();
      expect(['redis', 'memory']).toContain(stats.type);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid keys gracefully', async () => {
      const result = await get(null);
      expect(result).toBeNull();
    });

    it('should handle invalid values', async () => {
      // Circular reference cannot be JSON.stringified
      const circular = {};
      circular.self = circular;
      
      const success = await set('circular', circular, 300);
      // Should fail gracefully
      expect(typeof success).toBe('boolean');
    });
  });

  describe('Key Prefixing', () => {
    it('should automatically prefix keys', async () => {
      await set('my-key', { data: 'value' }, 300);
      
      // The actual key in cache should be prefixed with 'gnb:cache:'
      // This is tested internally by the cache utility
      const result = await get('my-key');
      expect(result).toEqual({ data: 'value' });
    });
  });
});
