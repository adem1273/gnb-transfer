/**
 * Public Page Routes Test
 *
 * Tests for public CMS page endpoints (no authentication required)
 *
 * Test Coverage:
 * - Published page access
 * - Unpublished page access (should return 404)
 * - Non-existent page access (should return 404)
 * - SEO fields inclusion
 * - Caching headers
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

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/pages', publicPageRoutes);
  return app;
};

describe('Public Page Routes', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear pages before each test
    await Page.deleteMany({});
  });

  afterAll(async () => {
    // Final cleanup
    await Page.deleteMany({});
  });

  describe('GET /api/pages/:slug - Get Published Page', () => {
    it('should return a published page with all fields including SEO', async () => {
      // Create a published page
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
        sections: [
          { type: 'text', content: 'Hello World' },
          { type: 'markdown', content: '# Heading' },
          { type: 'image', content: 'https://example.com/image.jpg' },
        ],
        seo: {
          title: 'Test Page SEO Title',
          description: 'Test page SEO description',
        },
        published: true,
      };

      await Page.create(pageData);

      const response = await request(app)
        .get('/api/pages/test-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        slug: 'test-page',
        title: 'Test Page',
        seo: {
          title: 'Test Page SEO Title',
          description: 'Test page SEO description',
        },
      });
      expect(response.body.data.sections).toHaveLength(3);
      expect(response.body.data.sections[0]).toEqual({
        type: 'text',
        content: 'Hello World',
      });
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return published page without SEO if not provided', async () => {
      await Page.create({
        slug: 'minimal-page',
        title: 'Minimal Page',
        sections: [{ type: 'text', content: 'Content' }],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/minimal-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('minimal-page');
      expect(response.body.data.seo).toBeDefined();
    });

    it('should set caching headers for published pages', async () => {
      await Page.create({
        slug: 'cached-page',
        title: 'Cached Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/cached-page')
        .expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=300');
    });

    it('should return 404 for unpublished page', async () => {
      await Page.create({
        slug: 'draft-page',
        title: 'Draft Page',
        sections: [{ type: 'text', content: 'Draft content' }],
        published: false,
      });

      const response = await request(app)
        .get('/api/pages/draft-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page not found');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/pages/non-existent-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page not found');
    });

    it('should handle slug case-insensitivity', async () => {
      await Page.create({
        slug: 'case-test',
        title: 'Case Test Page',
        sections: [],
        published: true,
      });

      // Test with uppercase - should work since slug is normalized
      const response = await request(app)
        .get('/api/pages/Case-Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('case-test');
    });

    it('should not expose unpublished status in response', async () => {
      await Page.create({
        slug: 'published-page',
        title: 'Published Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/published-page')
        .expect(200);

      // Verify published field is not in response (admin-only data)
      expect(response.body.data.published).toBeUndefined();
    });

    it('should return page with empty sections array', async () => {
      await Page.create({
        slug: 'empty-sections',
        title: 'Empty Sections Page',
        sections: [],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/empty-sections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections).toEqual([]);
    });

    it('should handle pages with special characters in content', async () => {
      await Page.create({
        slug: 'special-chars',
        title: 'Special Characters Page',
        sections: [
          { type: 'text', content: 'Text with <html> & "special" characters' },
          { type: 'markdown', content: '# Markdown with `code` and **bold**' },
        ],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/special-chars')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections[0].content).toBe(
        'Text with <html> & "special" characters'
      );
    });

    it('should handle pages with Media Manager URLs in image sections', async () => {
      await Page.create({
        slug: 'media-page',
        title: 'Media Page',
        sections: [
          {
            type: 'image',
            content: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
          },
        ],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/media-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections[0].type).toBe('image');
      expect(response.body.data.sections[0].content).toContain('cloudinary');
    });

    it('should include structured data for published pages with enabled toggle', async () => {
      await Page.create({
        slug: 'structured-page',
        title: 'Structured Data Page',
        sections: [{ type: 'text', content: 'Content' }],
        seo: {
          title: 'Structured Page SEO',
          description: 'Page with structured data',
        },
        structuredData: {
          enabled: true,
        },
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/structured-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.structuredData).toBeDefined();
      expect(Array.isArray(response.body.data.structuredData)).toBe(true);
      expect(response.body.data.structuredData.length).toBeGreaterThan(0);

      // Verify WebPage schema exists
      const webPageSchema = response.body.data.structuredData.find(
        (schema) => schema['@type'] === 'WebPage'
      );
      expect(webPageSchema).toBeDefined();
      expect(webPageSchema['@context']).toBe('https://schema.org');
      expect(webPageSchema.name).toBe('Structured Page SEO');
    });

    it('should not include structured data when disabled', async () => {
      await Page.create({
        slug: 'no-structured-data',
        title: 'No Structured Data Page',
        sections: [{ type: 'text', content: 'Content' }],
        structuredData: {
          enabled: false,
        },
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/no-structured-data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.structuredData).toBeUndefined();
    });

    it('should include structured data by default for backward compatibility', async () => {
      await Page.create({
        slug: 'legacy-page',
        title: 'Legacy Page',
        sections: [{ type: 'text', content: 'Content' }],
        seo: {
          title: 'Legacy Page',
          description: 'Page without structuredData field',
        },
        published: true,
        // No structuredData field - should default to enabled
      });

      const response = await request(app)
        .get('/api/pages/legacy-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.structuredData).toBeDefined();
      expect(Array.isArray(response.body.data.structuredData)).toBe(true);
      expect(response.body.data.structuredData.length).toBeGreaterThan(0);
    });

    it('should include BreadcrumbList schema in structured data', async () => {
      await Page.create({
        slug: 'breadcrumb-page',
        title: 'Breadcrumb Page',
        sections: [{ type: 'text', content: 'Content' }],
        published: true,
      });

      const response = await request(app)
        .get('/api/pages/breadcrumb-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      const breadcrumbSchema = response.body.data.structuredData.find(
        (schema) => schema['@type'] === 'BreadcrumbList'
      );
      expect(breadcrumbSchema).toBeDefined();
      expect(breadcrumbSchema.itemListElement).toBeDefined();
      expect(breadcrumbSchema.itemListElement.length).toBeGreaterThanOrEqual(2);
      expect(breadcrumbSchema.itemListElement[0].name).toBe('Home');
    });

    it('should not expose structured data for unpublished pages', async () => {
      await Page.create({
        slug: 'unpublished-structured',
        title: 'Unpublished Page',
        sections: [{ type: 'text', content: 'Content' }],
        structuredData: {
          enabled: true,
        },
        published: false,
      });

      const response = await request(app)
        .get('/api/pages/unpublished-structured')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page not found');
    });
  });
});
