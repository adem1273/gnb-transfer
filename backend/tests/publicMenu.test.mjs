/**
 * Public Menu Routes Test
 *
 * Tests for public menu/navigation endpoints
 *
 * Test Coverage:
 * - Fetching menus by location
 * - Active menu filtering
 * - Page validation (published only)
 * - External URL handling
 * - Missing/unpublished page handling
 * - Caching headers
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Menu from '../models/Menu.mjs';
import Page from '../models/Page.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import publicMenuRoutes from '../routes/publicMenuRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/menus', publicMenuRoutes);

  return app;
};

describe('Public Menu Routes', () => {
  let app;
  let publishedPage;
  let unpublishedPage;

  beforeAll(async () => {
    app = createTestApp();

    // Create test pages
    publishedPage = await Page.create({
      slug: 'published-page',
      title: 'Published Page',
      sections: [],
      published: true,
    });

    unpublishedPage = await Page.create({
      slug: 'unpublished-page',
      title: 'Unpublished Page',
      sections: [],
      published: false,
    });
  });

  afterAll(async () => {
    // Cleanup
    await Page.deleteMany({});
  });

  beforeEach(async () => {
    // Clear menu collection before each test
    await Menu.deleteMany({});
  });

  describe('GET /api/menus/:location - Get Menu by Location', () => {
    it('should return active header menu', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Home', pageSlug: 'published-page', order: 0 },
          { label: 'Google', externalUrl: 'https://google.com', order: 1 },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location).toBe('header');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0].label).toBe('Home');
      expect(response.body.data.items[0].url).toBe('/pages/published-page');
      expect(response.body.data.items[0].type).toBe('internal');
      expect(response.body.data.items[1].url).toBe('https://google.com');
      expect(response.body.data.items[1].type).toBe('external');
    });

    it('should filter out unpublished pages', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Published', pageSlug: 'published-page', order: 0 },
          { label: 'Unpublished', pageSlug: 'unpublished-page', order: 1 },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].label).toBe('Published');
    });

    it('should return empty items for inactive menu', async () => {
      await Menu.create({
        name: 'Inactive Menu',
        location: 'header',
        items: [{ label: 'Home', pageSlug: 'published-page', order: 0 }],
        isActive: false,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return empty items when no menu exists', async () => {
      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location).toBe('header');
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should reject invalid location', async () => {
      const response = await request(app).get('/api/menus/sidebar').expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('header or footer');
    });

    it('should set caching headers', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [],
        isActive: true,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=300');
    });

    it('should handle menu items with missing pages', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Valid', pageSlug: 'published-page', order: 0 },
          { label: 'Missing', pageSlug: 'non-existent-page', order: 1 },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].label).toBe('Valid');
    });
  });

  describe('GET /api/menus - Get All Menus', () => {
    it('should return both header and footer menus', async () => {
      await Menu.create([
        {
          name: 'Header Menu',
          location: 'header',
          items: [{ label: 'Home', pageSlug: 'published-page', order: 0 }],
          isActive: true,
        },
        {
          name: 'Footer Menu',
          location: 'footer',
          items: [{ label: 'Contact', externalUrl: 'https://example.com', order: 0 }],
          isActive: true,
        },
      ]);

      const response = await request(app).get('/api/menus').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.header).toBeDefined();
      expect(response.body.data.footer).toBeDefined();
      expect(response.body.data.header.items).toHaveLength(1);
      expect(response.body.data.footer.items).toHaveLength(1);
    });

    it('should return empty items for locations without menus', async () => {
      const response = await request(app).get('/api/menus').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.header.items).toHaveLength(0);
      expect(response.body.data.footer.items).toHaveLength(0);
    });

    it('should handle mixed published/unpublished pages', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Published', pageSlug: 'published-page', order: 0 },
          { label: 'Unpublished', pageSlug: 'unpublished-page', order: 1 },
          { label: 'External', externalUrl: 'https://example.com', order: 2 },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/menus').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.header.items).toHaveLength(2);
      expect(response.body.data.header.items[0].label).toBe('Published');
      expect(response.body.data.header.items[1].label).toBe('External');
    });

    it('should set caching headers', async () => {
      const response = await request(app).get('/api/menus').expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=300');
    });

    it('should sort menu items by order', async () => {
      await Menu.create({
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Third', pageSlug: 'published-page', order: 2 },
          { label: 'First', externalUrl: 'https://example.com', order: 0 },
          { label: 'Second', externalUrl: 'https://google.com', order: 1 },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/menus/header').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items[0].label).toBe('First');
      expect(response.body.data.items[1].label).toBe('Second');
      expect(response.body.data.items[2].label).toBe('Third');
    });
  });
});
