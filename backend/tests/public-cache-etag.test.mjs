/**
 * Public Cache and ETag Tests
 *
 * Tests for HTTP caching with ETag support on public endpoints
 *
 * Test Coverage:
 * - ETag generation
 * - 304 Not Modified responses
 * - Cache-Control headers
 * - Public vs admin route caching
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import Page from '../models/Page.mjs';
import HomeLayout from '../models/HomeLayout.mjs';
import Menu from '../models/Menu.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import { publicCacheMiddleware } from '../middlewares/publicCacheMiddleware.mjs';
import publicPageRoutes from '../routes/publicPageRoutes.mjs';
import publicHomeLayoutRoutes from '../routes/publicHomeLayoutRoutes.mjs';
import publicMenuRoutes from '../routes/publicMenuRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  
  // Public routes with cache middleware
  app.use('/api/pages', publicPageRoutes);
  app.use('/api/home-layout', publicHomeLayoutRoutes);
  app.use('/api/menus', publicMenuRoutes);
  
  return app;
};

describe('Public Cache and ETag Support', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Page.deleteMany({});
    await HomeLayout.deleteMany({});
    await Menu.deleteMany({});
  });

  afterAll(async () => {
    // Final cleanup
    await Page.deleteMany({});
    await HomeLayout.deleteMany({});
    await Menu.deleteMany({});
  });

  describe('ETag Generation and 304 Not Modified', () => {
    it('should generate ETag for published page', async () => {
      await Page.create({
        slug: 'test-page',
        title: 'Test Page',
        sections: [{ type: 'text', content: 'Test content' }],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/test-page')
        .expect(200);

      expect(response.headers.etag).toBeDefined();
      expect(response.headers.etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should return 304 Not Modified when ETag matches', async () => {
      await Page.create({
        slug: 'cached-page',
        title: 'Cached Page',
        sections: [{ type: 'text', content: 'Cached content' }],
        published: true,
      });

      // First request - get ETag
      const firstResponse = await request(app)
        .get('/api/pages/cached-page')
        .expect(200);

      const etag = firstResponse.headers.etag;
      expect(etag).toBeDefined();

      // Second request with If-None-Match header
      const secondResponse = await request(app)
        .get('/api/pages/cached-page')
        .set('If-None-Match', etag)
        .expect(304);

      // 304 response should have no body
      expect(secondResponse.text).toBe('');
    });

    it('should return full response when ETag does not match', async () => {
      await Page.create({
        slug: 'modified-page',
        title: 'Modified Page',
        sections: [{ type: 'text', content: 'Original content' }],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/modified-page')
        .set('If-None-Match', '"different-etag"')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Modified Page');
    });

    it('should generate different ETags for different content', async () => {
      await Page.create({
        slug: 'page-1',
        title: 'Page 1',
        sections: [{ type: 'text', content: 'Content 1' }],
        published: true,
      });

      await Page.create({
        slug: 'page-2',
        title: 'Page 2',
        sections: [{ type: 'text', content: 'Content 2' }],
        published: true,
      });

      const response1 = await request(app).get('/api/pages/page-1').expect(200);
      const response2 = await request(app).get('/api/pages/page-2').expect(200);

      expect(response1.headers.etag).toBeDefined();
      expect(response2.headers.etag).toBeDefined();
      expect(response1.headers.etag).not.toBe(response2.headers.etag);
    });
  });

  describe('Cache-Control Headers', () => {
    it('should set Cache-Control header for public pages', async () => {
      await Page.create({
        slug: 'public-page',
        title: 'Public Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/public-page')
        .expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toMatch(/max-age=\d+/);
    });

    it('should set max-age to 300 seconds (5 minutes) for pages', async () => {
      await Page.create({
        slug: 'timed-page',
        title: 'Timed Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/timed-page')
        .expect(200);

      expect(response.headers['cache-control']).toContain('max-age=300');
    });

    it('should set Vary header for proper caching', async () => {
      await Page.create({
        slug: 'vary-page',
        title: 'Vary Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/vary-page')
        .expect(200);

      expect(response.headers.vary).toContain('Accept-Encoding');
    });

    it('should cache homepage layout with appropriate headers', async () => {
      await HomeLayout.create({
        name: 'Main Layout',
        sections: [
          {
            type: 'hero',
            order: 0,
            isActive: true,
            data: { title: 'Welcome' },
          },
        ],
        isActive: true,
      });

      const response = await request(app)
        .get('/api/home-layout')
        .expect(200);

      expect(response.headers.etag).toBeDefined();
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=300');
    });

    it('should cache menu items with appropriate headers', async () => {
      await Menu.create({
        location: 'header',
        items: [
          { label: 'Home', externalUrl: '/', order: 0 },
        ],
        isActive: true,
      });

      const response = await request(app)
        .get('/api/menus/header')
        .expect(200);

      expect(response.headers.etag).toBeDefined();
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=300');
    });
  });

  describe('Cache Behavior for Different Response Codes', () => {
    it('should not cache 404 responses', async () => {
      const response = await request(app)
        .get('/api/pages/non-existent')
        .expect(404);

      expect(response.headers.etag).toBeUndefined();
    });

    it('should not cache unpublished pages', async () => {
      await Page.create({
        slug: 'draft-page',
        title: 'Draft Page',
        sections: [],
        published: false,
      });

      const response = await request(app)
        .get('/api/pages/draft-page')
        .expect(404);

      expect(response.headers.etag).toBeUndefined();
    });

    it('should not set cache headers for error responses', async () => {
      const response = await request(app)
        .get('/api/pages/error-page')
        .expect(404);

      expect(response.headers['cache-control']).toBeUndefined();
    });
  });

  describe('ETag Validation with Content Changes', () => {
    it('should generate same ETag for identical content', async () => {
      await Page.create({
        slug: 'stable-page',
        title: 'Stable Page',
        sections: [{ type: 'text', content: 'Stable content' }],
        published: true,
      });

      const response1 = await request(app).get('/api/pages/stable-page').expect(200);
      const response2 = await request(app).get('/api/pages/stable-page').expect(200);

      expect(response1.headers.etag).toBe(response2.headers.etag);
    });

    it('should handle multiple requests with ETag efficiently', async () => {
      await Page.create({
        slug: 'popular-page',
        title: 'Popular Page',
        sections: [{ type: 'text', content: 'Popular content' }],
        published: true,
      });

      // First request
      const first = await request(app).get('/api/pages/popular-page').expect(200);
      const etag = first.headers.etag;

      // Multiple subsequent requests with ETag
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/pages/popular-page')
          .set('If-None-Match', etag)
          .expect(304)
      );

      const responses = await Promise.all(requests);
      
      // All should return 304
      responses.forEach(res => {
        expect(res.status).toBe(304);
        expect(res.text).toBe('');
      });
    });
  });

  describe('Menu Caching', () => {
    it('should cache both header and footer menus', async () => {
      await Menu.create({
        location: 'header',
        items: [{ label: 'Home', externalUrl: '/', order: 0 }],
        isActive: true,
      });

      await Menu.create({
        location: 'footer',
        items: [{ label: 'About', externalUrl: '/about', order: 0 }],
        isActive: true,
      });

      const headerResponse = await request(app).get('/api/menus/header').expect(200);
      const footerResponse = await request(app).get('/api/menus/footer').expect(200);

      expect(headerResponse.headers.etag).toBeDefined();
      expect(footerResponse.headers.etag).toBeDefined();
      expect(headerResponse.headers['cache-control']).toContain('public');
      expect(footerResponse.headers['cache-control']).toContain('public');
    });

    it('should return 304 for unchanged menus', async () => {
      await Menu.create({
        location: 'header',
        items: [{ label: 'Home', externalUrl: '/', order: 0 }],
        isActive: true,
      });

      const first = await request(app).get('/api/menus/header').expect(200);
      const etag = first.headers.etag;

      const second = await request(app)
        .get('/api/menus/header')
        .set('If-None-Match', etag)
        .expect(304);

      expect(second.text).toBe('');
    });
  });
});
