/**
 * Page Management Routes Test
 *
 * Tests for CMS page management endpoints
 *
 * Test Coverage:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Permission enforcement (admin can CUD, manager can read only)
 * - Slug uniqueness validation
 * - Published/draft status logic
 * - Admin action logging
 * - Input validation
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Page from '../models/Page.mjs';
import User from '../models/User.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import pageRoutes from '../routes/pageRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);

  // Mock authentication middleware for testing
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
    } else if (req.headers.authorization === 'Bearer user-token') {
      req.user = { id: 'user-id', email: 'user@test.com', name: 'Regular User', role: 'user' };
    }
    next();
  });

  app.use('/api/admin/pages', pageRoutes);

  return app;
};

describe('Page Management Routes', () => {
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
    // Cleanup
    await User.deleteMany({});
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Page.deleteMany({});
    await AdminLog.deleteMany({});
  });

  describe('POST /api/admin/pages - Create Page', () => {
    it('should create a new page with valid data', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
        sections: [
          { type: 'text', content: 'Hello World' },
          { type: 'markdown', content: '# Heading' },
        ],
        seo: {
          title: 'Test Page SEO',
          description: 'Test page description',
        },
        published: true,
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.slug).toBe('test-page');
      expect(response.body.data.title).toBe('Test Page');
      expect(response.body.data.published).toBe(true);
      expect(response.body.data.sections).toHaveLength(2);
    });

    it('should create a page with minimal data', async () => {
      const pageData = {
        slug: 'minimal-page',
        title: 'Minimal Page',
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('minimal-page');
      expect(response.body.data.published).toBe(false); // Default is false
      expect(response.body.data.sections).toEqual([]);
    });

    it('should normalize slug to lowercase', async () => {
      const pageData = {
        slug: 'Test-PAGE-Slug',
        title: 'Test Page',
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      expect(response.body.data.slug).toBe('test-page-slug');
    });

    it('should reject request without authentication', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
      };

      const response = await request(app).post('/api/admin/pages').send(pageData).expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from non-admin user (manager)', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer manager-token')
        .send(pageData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from regular user', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer user-token')
        .send(pageData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate slug', async () => {
      const pageData = {
        slug: 'duplicate-page',
        title: 'Duplicate Page',
      };

      // Create first page
      await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      // Try to create second page with same slug
      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('slug already exists');
    });

    it('should reject page without required fields', async () => {
      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should reject invalid section type', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
        sections: [{ type: 'invalid-type', content: 'Test' }],
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Section type');
    });

    it('should reject section without content', async () => {
      const pageData = {
        slug: 'test-page',
        title: 'Test Page',
        sections: [{ type: 'text' }],
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('content');
    });

    it('should log admin action on successful creation', async () => {
      const pageData = {
        slug: 'logged-page',
        title: 'Logged Page',
      };

      await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      // Wait for async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = await AdminLog.find({ action: 'PAGE_CREATE' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].user.email).toBe('admin@test.com');
      expect(logs[0].target.type).toBe('Page');
      expect(logs[0].target.name).toBe('Logged Page');
    });
  });

  describe('GET /api/admin/pages - List Pages', () => {
    beforeEach(async () => {
      // Create test pages
      await Page.create([
        { slug: 'page-1', title: 'Page 1', published: true },
        { slug: 'page-2', title: 'Page 2', published: false },
        { slug: 'page-3', title: 'Page 3', published: true },
      ]);
    });

    it('should list all pages for admin', async () => {
      const response = await request(app)
        .get('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should list all pages for manager', async () => {
      const response = await request(app)
        .get('/api/admin/pages')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(3);
    });

    it('should filter published pages', async () => {
      const response = await request(app)
        .get('/api/admin/pages?published=true')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(2);
      expect(response.body.data.pages.every((p) => p.published)).toBe(true);
    });

    it('should filter draft pages', async () => {
      const response = await request(app)
        .get('/api/admin/pages?published=false')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(1);
      expect(response.body.data.pages[0].published).toBe(false);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/pages?page=1&limit=2')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/admin/pages').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from regular user', async () => {
      const response = await request(app)
        .get('/api/admin/pages')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/pages/:slug - Get Page by Slug', () => {
    let testPage;

    beforeEach(async () => {
      testPage = await Page.create({
        slug: 'test-page',
        title: 'Test Page',
        sections: [{ type: 'text', content: 'Hello' }],
        published: true,
      });
    });

    it('should get page by slug', async () => {
      const response = await request(app)
        .get('/api/admin/pages/test-page')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-page');
      expect(response.body.data.title).toBe('Test Page');
    });

    it('should allow manager to read page', async () => {
      const response = await request(app)
        .get('/api/admin/pages/test-page')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-page');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/admin/pages/non-existent')
        .set('Authorization', 'Bearer admin-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/admin/pages/test-page').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/pages/:id - Update Page', () => {
    let testPage;

    beforeEach(async () => {
      testPage = await Page.create({
        slug: 'test-page',
        title: 'Test Page',
        sections: [{ type: 'text', content: 'Hello' }],
        published: false,
      });
    });

    it('should update page with valid data', async () => {
      const updates = {
        title: 'Updated Title',
        published: true,
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.published).toBe(true);
      expect(response.body.data.slug).toBe('test-page'); // Unchanged
    });

    it('should update page slug', async () => {
      const updates = {
        slug: 'new-slug',
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('new-slug');
    });

    it('should update sections', async () => {
      const updates = {
        sections: [
          { type: 'text', content: 'New content' },
          { type: 'markdown', content: '# New heading' },
        ],
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections).toHaveLength(2);
      expect(response.body.data.sections[0].content).toBe('New content');
    });

    it('should reject duplicate slug on update', async () => {
      // Create another page
      await Page.create({
        slug: 'another-page',
        title: 'Another Page',
      });

      const updates = {
        slug: 'another-page',
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('slug already exists');
    });

    it('should reject update from manager', async () => {
      const updates = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer manager-token')
        .send(updates)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject update from regular user', async () => {
      const updates = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer user-token')
        .send(updates)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updates = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put(`/api/admin/pages/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid ObjectId format', async () => {
      const updates = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/api/admin/pages/invalid-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid page ID');
    });

    it('should log admin action on successful update', async () => {
      const updates = {
        title: 'Updated Title',
      };

      await request(app)
        .put(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates)
        .expect(200);

      // Wait for async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = await AdminLog.find({ action: 'PAGE_UPDATE' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].user.email).toBe('admin@test.com');
      expect(logs[0].target.type).toBe('Page');
    });
  });

  describe('DELETE /api/admin/pages/:id - Delete Page', () => {
    let testPage;

    beforeEach(async () => {
      testPage = await Page.create({
        slug: 'test-page',
        title: 'Test Page',
      });
    });

    it('should delete page', async () => {
      const response = await request(app)
        .delete(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify page is deleted
      const deletedPage = await Page.findById(testPage._id);
      expect(deletedPage).toBeNull();
    });

    it('should reject delete from manager', async () => {
      const response = await request(app)
        .delete(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer manager-token')
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify page is not deleted
      const page = await Page.findById(testPage._id);
      expect(page).not.toBeNull();
    });

    it('should reject delete from regular user', async () => {
      const response = await request(app)
        .delete(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/admin/pages/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid ObjectId format', async () => {
      const response = await request(app)
        .delete('/api/admin/pages/invalid-id')
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid page ID');
    });

    it('should log admin action on successful deletion', async () => {
      await request(app)
        .delete(`/api/admin/pages/${testPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      // Wait for async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = await AdminLog.find({ action: 'PAGE_DELETE' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].user.email).toBe('admin@test.com');
      expect(logs[0].target.type).toBe('Page');
    });
  });

  describe('Publish Logic', () => {
    it('should create page as draft by default', async () => {
      const pageData = {
        slug: 'draft-page',
        title: 'Draft Page',
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      expect(response.body.data.published).toBe(false);
    });

    it('should create page as published when specified', async () => {
      const pageData = {
        slug: 'published-page',
        title: 'Published Page',
        published: true,
      };

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send(pageData)
        .expect(201);

      expect(response.body.data.published).toBe(true);
    });

    it('should toggle publish status', async () => {
      const page = await Page.create({
        slug: 'toggle-page',
        title: 'Toggle Page',
        published: false,
      });

      // Publish
      let response = await request(app)
        .put(`/api/admin/pages/${page._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ published: true })
        .expect(200);

      expect(response.body.data.published).toBe(true);

      // Unpublish
      response = await request(app)
        .put(`/api/admin/pages/${page._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ published: false })
        .expect(200);

      expect(response.body.data.published).toBe(false);
    });
  });

  describe('Slug Uniqueness', () => {
    it('should enforce unique slugs on creation', async () => {
      await Page.create({
        slug: 'unique-page',
        title: 'First Page',
      });

      const response = await request(app)
        .post('/api/admin/pages')
        .set('Authorization', 'Bearer admin-token')
        .send({
          slug: 'unique-page',
          title: 'Second Page',
        })
        .expect(400);

      expect(response.body.error).toContain('slug already exists');
    });

    it('should enforce unique slugs on update', async () => {
      await Page.create({
        slug: 'first-page',
        title: 'First Page',
      });

      const secondPage = await Page.create({
        slug: 'second-page',
        title: 'Second Page',
      });

      const response = await request(app)
        .put(`/api/admin/pages/${secondPage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          slug: 'first-page',
        })
        .expect(400);

      expect(response.body.error).toContain('slug already exists');
    });

    it('should allow updating same page without changing slug', async () => {
      const page = await Page.create({
        slug: 'same-page',
        title: 'Same Page',
      });

      const response = await request(app)
        .put(`/api/admin/pages/${page._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          slug: 'same-page',
          title: 'Updated Title',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });
  });
});
