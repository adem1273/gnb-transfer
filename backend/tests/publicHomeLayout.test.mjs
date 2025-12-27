/**
 * Public HomeLayout Routes Test
 *
 * Tests for public homepage layout endpoint
 *
 * Test Coverage:
 * - Active layout retrieval
 * - Active sections filtering
 * - Section ordering
 * - Caching headers
 * - SEO metadata
 * - 404 handling
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import HomeLayout from '../models/HomeLayout.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import publicHomeLayoutRoutes from '../routes/publicHomeLayoutRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/home-layout', publicHomeLayoutRoutes);

  return app;
};

describe('Public HomeLayout Routes', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await HomeLayout.deleteMany({});
  });

  describe('GET /api/home-layout', () => {
    it('should return active homepage layout with active sections only', async () => {
      await HomeLayout.create({
        name: 'Main Layout',
        description: 'Main homepage layout',
        sections: [
          {
            type: 'hero',
            data: { title: 'Welcome', subtitle: 'to our site' },
            order: 0,
            isActive: true,
          },
          {
            type: 'features',
            data: { features: [{ title: 'Feature 1', description: 'Desc 1' }] },
            order: 1,
            isActive: false, // This should be filtered out
          },
          {
            type: 'cta',
            data: { title: 'Get Started', buttonText: 'Sign Up' },
            order: 2,
            isActive: true,
          },
        ],
        isActive: true,
        seo: {
          title: 'Home Page',
          description: 'Welcome to our site',
          keywords: ['home', 'welcome'],
        },
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Main Layout');
      expect(response.body.data.sections).toHaveLength(2); // Only active sections
      expect(response.body.data.seo.title).toBe('Home Page');
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return sections in correct order', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [
          {
            type: 'cta',
            data: { title: 'CTA' },
            order: 2,
            isActive: true,
          },
          {
            type: 'hero',
            data: { title: 'Hero' },
            order: 0,
            isActive: true,
          },
          {
            type: 'features',
            data: { features: [] },
            order: 1,
            isActive: true,
          },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.sections[0].type).toBe('hero'); // order: 0
      expect(response.body.data.sections[1].type).toBe('features'); // order: 1
      expect(response.body.data.sections[2].type).toBe('cta'); // order: 2
    });

    it('should set cache headers', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });

    it('should return 404 when no active layout exists', async () => {
      // Create an inactive layout
      await HomeLayout.create({
        name: 'Inactive Layout',
        sections: [],
        isActive: false,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No active homepage layout found');
    });

    it('should return 404 when no layouts exist', async () => {
      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include SEO metadata', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
        isActive: true,
        seo: {
          title: 'Test SEO Title',
          description: 'Test SEO description for the homepage',
          keywords: ['test', 'homepage', 'seo'],
        },
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.seo).toBeDefined();
      expect(response.body.data.seo.title).toBe('Test SEO Title');
      expect(response.body.data.seo.description).toBe('Test SEO description for the homepage');
      expect(response.body.data.seo.keywords).toEqual(['test', 'homepage', 'seo']);
    });

    it('should not expose internal fields', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.__v).toBeUndefined();
      expect(response.body.data._id).toBeUndefined();
    });

    it('should handle layouts with empty sections', async () => {
      await HomeLayout.create({
        name: 'Empty Layout',
        sections: [],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.sections).toEqual([]);
    });

    it('should filter out sections with isActive: false', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [
          {
            type: 'hero',
            data: { title: 'Active Hero' },
            order: 0,
            isActive: true,
          },
          {
            type: 'features',
            data: { features: [] },
            order: 1,
            isActive: false,
          },
          {
            type: 'testimonials',
            data: { testimonials: [] },
            order: 2,
            // isActive defaults to true
          },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.sections.find((s) => s.type === 'features')).toBeUndefined();
    });

    it('should handle various section types', async () => {
      await HomeLayout.create({
        name: 'Multi-Section Layout',
        sections: [
          { type: 'hero', data: { title: 'Hero' }, order: 0, isActive: true },
          { type: 'features', data: { features: [] }, order: 1, isActive: true },
          { type: 'tours', data: { limit: 6 }, order: 2, isActive: true },
          { type: 'testimonials', data: { testimonials: [] }, order: 3, isActive: true },
          { type: 'cta', data: { title: 'CTA', buttonText: 'Click' }, order: 4, isActive: true },
          { type: 'stats', data: { stats: [] }, order: 5, isActive: true },
          { type: 'gallery', data: { images: [] }, order: 6, isActive: true },
          { type: 'text', data: { content: 'Text' }, order: 7, isActive: true },
          { type: 'faq', data: { faqs: [] }, order: 8, isActive: true },
        ],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.sections).toHaveLength(9);
    });

    it('should include Organization and WebSite structured data', async () => {
      await HomeLayout.create({
        name: 'Main Layout',
        sections: [],
        isActive: true,
        seo: {
          title: 'GNB Transfer - Premium Services',
          description: 'Premium tourism and transfer services',
        },
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      expect(response.body.data.structuredData).toBeDefined();
      expect(Array.isArray(response.body.data.structuredData)).toBe(true);
      expect(response.body.data.structuredData.length).toBeGreaterThan(0);

      // Check for Organization schema
      const orgSchema = response.body.data.structuredData.find(
        (schema) => schema['@type'] === 'Organization'
      );
      expect(orgSchema).toBeDefined();
      expect(orgSchema['@context']).toBe('https://schema.org');
      expect(orgSchema.name).toBeDefined();

      // Check for WebSite schema
      const webSiteSchema = response.body.data.structuredData.find(
        (schema) => schema['@type'] === 'WebSite'
      );
      expect(webSiteSchema).toBeDefined();
      expect(webSiteSchema['@context']).toBe('https://schema.org');
      expect(webSiteSchema.potentialAction).toBeDefined();
      expect(webSiteSchema.potentialAction['@type']).toBe('SearchAction');
    });

    it('should include structured data even without global settings', async () => {
      await HomeLayout.create({
        name: 'Simple Layout',
        sections: [],
        isActive: true,
      });

      const response = await request(app).get('/api/home-layout');

      expect(response.status).toBe(200);
      // Should still have structured data with defaults
      expect(response.body.data.structuredData).toBeDefined();
      expect(Array.isArray(response.body.data.structuredData)).toBe(true);
    });
  });
});
