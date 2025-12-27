/**
 * Sitemap and Robots.txt Routes Test
 *
 * Tests for SEO endpoints
 *
 * Test Coverage:
 * - Sitemap generation with CMS pages
 * - Sitemap includes homepage
 * - Sitemap includes lastmod timestamps
 * - Robots.txt generation from database config
 * - Robots.txt admin configuration endpoints
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Page from '../models/Page.mjs';
import Tour from '../models/Tour.mjs';
import BlogPost from '../models/BlogPost.mjs';
import RobotsConfig from '../models/RobotsConfig.mjs';
import User from '../models/User.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import sitemapRoutes from '../routes/sitemapRoutes.mjs';
import robotsConfigRoutes from '../routes/robotsConfigRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);

  // Mock authentication middleware for admin routes
  app.use((req, res, next) => {
    if (req.headers.authorization === 'Bearer admin-token') {
      req.user = { id: 'admin-id', email: 'admin@test.com', name: 'Admin User', role: 'admin' };
    } else if (req.headers.authorization === 'Bearer manager-token') {
      req.user = {
        id: 'manager-id',
        email: 'manager@test.com',
        name: 'Manager User',
        role: 'manager',
      };
    }
    next();
  });

  app.use('/api/sitemap', sitemapRoutes);
  app.use('/api/admin/robots-config', robotsConfigRoutes);

  return app;
};

describe('Sitemap Routes', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Page.deleteMany({});
    await Tour.deleteMany({});
    await BlogPost.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await Page.deleteMany({});
    await Tour.deleteMany({});
    await BlogPost.deleteMany({});
  });

  describe('GET /api/sitemap - Generate Sitemap', () => {
    it('should generate sitemap with static pages', async () => {
      const response = await request(app).get('/api/sitemap').expect(200);

      expect(response.headers['content-type']).toContain('application/xml');
      expect(response.text).toContain('<?xml');
      expect(response.text).toContain('<urlset');
      expect(response.text).toContain('<loc>');
    });

    it('should include homepage in sitemap', async () => {
      const response = await request(app).get('/api/sitemap').expect(200);

      // Homepage should be included (as "/" or language variants)
      expect(response.text).toContain('<loc>');
      // Should contain priority for homepage
      expect(response.text).toContain('<priority>');
    });

    it('should include published CMS pages in sitemap', async () => {
      // Create published page
      await Page.create({
        slug: 'test-page',
        title: 'Test Page',
        published: true,
      });

      // Create draft page (should not be included)
      await Page.create({
        slug: 'draft-page',
        title: 'Draft Page',
        published: false,
      });

      const response = await request(app).get('/api/sitemap').expect(200);

      expect(response.text).toContain('test-page');
      expect(response.text).not.toContain('draft-page');
    });

    it('should include lastmod timestamps for CMS pages', async () => {
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      await Page.create({
        slug: 'dated-page',
        title: 'Dated Page',
        published: true,
        updatedAt: testDate,
      });

      const response = await request(app).get('/api/sitemap').expect(200);

      expect(response.text).toContain('dated-page');
      expect(response.text).toContain('<lastmod>');
      expect(response.text).toContain('2024-01-15');
    });

    it('should include active tours in sitemap', async () => {
      await Tour.create({
        title: 'Test Tour',
        slug: 'test-tour',
        description: 'Test description',
        price: 100,
        active: true,
      });

      const response = await request(app).get('/api/sitemap').expect(200);

      expect(response.text).toContain('test-tour');
    });

    it('should set proper cache headers', async () => {
      const response = await request(app).get('/api/sitemap').expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age');
    });

    it('should handle errors gracefully', async () => {
      // Temporarily break the database connection to trigger error
      const originalFind = Page.find;
      Page.find = () => {
        throw new Error('Database error');
      };

      const response = await request(app).get('/api/sitemap').expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to generate sitemap');

      // Restore
      Page.find = originalFind;
    });
  });

  describe('GET /api/sitemap/robots.txt - Generate Robots.txt', () => {
    beforeEach(async () => {
      // Clear robots config before each test
      await RobotsConfig.deleteMany({});
    });

    afterAll(async () => {
      await RobotsConfig.deleteMany({});
    });

    it('should generate robots.txt with default configuration', async () => {
      const response = await request(app).get('/api/sitemap/robots.txt').expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('User-agent: *');
      expect(response.text).toContain('Sitemap:');
      expect(response.text).toContain('Disallow: /admin/');
      expect(response.text).toContain('Disallow: /api/');
    });

    it('should set proper cache headers for robots.txt', async () => {
      const response = await request(app).get('/api/sitemap/robots.txt').expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=86400');
    });

    it('should use database configuration when available', async () => {
      // Create custom robots config
      await RobotsConfig.create({
        enabled: true,
        rules: [
          {
            userAgent: 'Googlebot',
            allow: ['/'],
            disallow: ['/private/'],
            crawlDelay: 2,
          },
        ],
      });

      const response = await request(app).get('/api/sitemap/robots.txt').expect(200);

      expect(response.text).toContain('User-agent: Googlebot');
      expect(response.text).toContain('Crawl-delay: 2');
    });

    it('should fallback to default on database error', async () => {
      // Temporarily break the database to trigger fallback
      const originalGetConfig = RobotsConfig.getConfig;
      RobotsConfig.getConfig = async () => {
        throw new Error('Database error');
      };

      const response = await request(app).get('/api/sitemap/robots.txt').expect(200);

      expect(response.text).toContain('User-agent: *');
      expect(response.text).toContain('Disallow: /admin/');

      // Restore
      RobotsConfig.getConfig = originalGetConfig;
    });
  });
});

describe('Robots Config Admin Routes', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    app = createTestApp();

    // Create test user in database
    testUser = await User.create({
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'TestPass123!',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await RobotsConfig.deleteMany({});
  });

  beforeEach(async () => {
    await RobotsConfig.deleteMany({});
  });

  describe('GET /api/admin/robots-config - Get Configuration', () => {
    it('should get default robots configuration', async () => {
      const response = await request(app)
        .get('/api/admin/robots-config')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enabled');
      expect(response.body.data).toHaveProperty('rules');
      expect(response.body.data).toHaveProperty('sitemapUrl');
    });

    it('should allow manager to view config', async () => {
      const response = await request(app)
        .get('/api/admin/robots-config')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/admin/robots-config').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/robots-config - Update Configuration', () => {
    it('should update robots configuration', async () => {
      const updates = {
        enabled: true,
        sitemapUrl: '/custom-sitemap.xml',
        rules: [
          {
            userAgent: 'Googlebot',
            allow: ['/'],
            disallow: ['/admin/'],
            crawlDelay: 2,
          },
        ],
      };

      const response = await request(app)
        .put('/api/admin/robots-config')
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sitemapUrl).toBe('/custom-sitemap.xml');
      expect(response.body.data.rules).toHaveLength(1);
      expect(response.body.data.rules[0].userAgent).toBe('Googlebot');
    });

    it('should validate rules array', async () => {
      const response = await request(app)
        .put('/api/admin/robots-config')
        .set('Authorization', 'Bearer admin-token')
        .send({ rules: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('array');
    });

    it('should validate rule structure', async () => {
      const response = await request(app)
        .put('/api/admin/robots-config')
        .set('Authorization', 'Bearer admin-token')
        .send({
          rules: [{ allow: ['/'] }], // Missing userAgent
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('userAgent');
    });

    it('should validate crawl delay range', async () => {
      const response = await request(app)
        .put('/api/admin/robots-config')
        .set('Authorization', 'Bearer admin-token')
        .send({
          rules: [
            {
              userAgent: '*',
              crawlDelay: 100, // Invalid: > 60
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject manager updates', async () => {
      const response = await request(app)
        .put('/api/admin/robots-config')
        .set('Authorization', 'Bearer manager-token')
        .send({ enabled: false })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/robots-config/preview - Preview Robots.txt', () => {
    it('should generate preview of robots.txt', async () => {
      const response = await request(app)
        .get('/api/admin/robots-config/preview')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.content).toContain('User-agent: *');
    });
  });

  describe('POST /api/admin/robots-config/reset - Reset Configuration', () => {
    it('should reset configuration to defaults', async () => {
      // Create custom config
      await RobotsConfig.create({
        enabled: false,
        rules: [],
      });

      const response = await request(app)
        .post('/api/admin/robots-config/reset')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(true);
      expect(response.body.data.rules.length).toBeGreaterThan(0);
    });

    it('should reject manager reset', async () => {
      const response = await request(app)
        .post('/api/admin/robots-config/reset')
        .set('Authorization', 'Bearer manager-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
