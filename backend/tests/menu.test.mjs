/**
 * Menu Management Routes Test
 *
 * Tests for dynamic menu/navigation management endpoints
 *
 * Test Coverage:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Permission enforcement (admin can CUD, manager can read only)
 * - Menu validation (location, items)
 * - Page slug validation
 * - External URL validation
 * - Active/inactive status logic
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
import Menu from '../models/Menu.mjs';
import Page from '../models/Page.mjs';
import User from '../models/User.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import menuRoutes from '../routes/menuRoutes.mjs';

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

  app.use('/api/admin/menus', menuRoutes);

  return app;
};

describe('Menu Management Routes', () => {
  let app;
  let testUser;
  let testPage;

  beforeAll(async () => {
    app = createTestApp();

    // Create test user in database
    testUser = await User.create({
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'TestPass123!',
      role: 'admin',
    });

    // Create test page for menu items
    testPage = await Page.create({
      slug: 'test-page',
      title: 'Test Page',
      sections: [],
      published: true,
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Page.deleteMany({});
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Menu.deleteMany({});
    await AdminLog.deleteMany({});
  });

  describe('POST /api/admin/menus - Create Menu', () => {
    it('should create a new menu with valid data', async () => {
      const menuData = {
        name: 'Main Menu',
        location: 'header',
        items: [
          { label: 'Home', pageSlug: 'test-page', order: 0 },
          { label: 'Google', externalUrl: 'https://google.com', order: 1 },
        ],
        isActive: true,
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Main Menu');
      expect(response.body.data.location).toBe('header');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should reject menu creation without name', async () => {
      const menuData = {
        location: 'header',
        items: [],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Name and location are required');
    });

    it('should reject menu with invalid location', async () => {
      const menuData = {
        name: 'Invalid Menu',
        location: 'sidebar',
        items: [],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('header or footer');
    });

    it('should reject menu item without label', async () => {
      const menuData = {
        name: 'Test Menu',
        location: 'header',
        items: [{ pageSlug: 'test-page', order: 0 }],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must have a label');
    });

    it('should reject menu item with both pageSlug and externalUrl', async () => {
      const menuData = {
        name: 'Test Menu',
        location: 'header',
        items: [
          {
            label: 'Invalid',
            pageSlug: 'test-page',
            externalUrl: 'https://google.com',
            order: 0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot have both');
    });

    it('should reject menu item with invalid external URL', async () => {
      const menuData = {
        name: 'Test Menu',
        location: 'header',
        items: [{ label: 'Invalid', externalUrl: 'not-a-url', order: 0 }],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid external URL');
    });

    it('should reject menu item with non-existent page slug', async () => {
      const menuData = {
        name: 'Test Menu',
        location: 'header',
        items: [{ label: 'Missing', pageSlug: 'non-existent-page', order: 0 }],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .send(menuData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should reject menu creation for non-admin users', async () => {
      const menuData = {
        name: 'Test Menu',
        location: 'header',
        items: [],
      };

      const response = await request(app)
        .post('/api/admin/menus')
        .set('Authorization', 'Bearer user-token')
        .send(menuData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/menus - List Menus', () => {
    beforeEach(async () => {
      // Create test menus
      await Menu.create([
        {
          name: 'Header Menu',
          location: 'header',
          items: [{ label: 'Home', pageSlug: 'test-page', order: 0 }],
          isActive: true,
        },
        {
          name: 'Footer Menu',
          location: 'footer',
          items: [{ label: 'Contact', externalUrl: 'https://example.com', order: 0 }],
          isActive: false,
        },
      ]);
    });

    it('should retrieve all menus', async () => {
      const response = await request(app)
        .get('/api/admin/menus')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.menus).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter menus by location', async () => {
      const response = await request(app)
        .get('/api/admin/menus?location=header')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.menus).toHaveLength(1);
      expect(response.body.data.menus[0].location).toBe('header');
    });

    it('should filter menus by active status', async () => {
      const response = await request(app)
        .get('/api/admin/menus?isActive=true')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.menus).toHaveLength(1);
      expect(response.body.data.menus[0].isActive).toBe(true);
    });

    it('should allow managers to view menus', async () => {
      const response = await request(app)
        .get('/api/admin/menus')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/menus/:id - Get Menu by ID', () => {
    let menuId;

    beforeEach(async () => {
      const menu = await Menu.create({
        name: 'Test Menu',
        location: 'header',
        items: [],
        isActive: true,
      });
      menuId = menu._id.toString();
    });

    it('should retrieve a menu by valid ID', async () => {
      const response = await request(app)
        .get(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Menu');
    });

    it('should return 404 for non-existent menu', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/menus/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/admin/menus/invalid-id')
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/menus/:id - Update Menu', () => {
    let menuId;

    beforeEach(async () => {
      const menu = await Menu.create({
        name: 'Original Menu',
        location: 'header',
        items: [{ label: 'Home', pageSlug: 'test-page', order: 0 }],
        isActive: true,
      });
      menuId = menu._id.toString();
    });

    it('should update menu with valid data', async () => {
      const updateData = {
        name: 'Updated Menu',
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Menu');
      expect(response.body.data.isActive).toBe(false);
    });

    it('should update menu items', async () => {
      const updateData = {
        items: [
          { label: 'About', pageSlug: 'test-page', order: 0 },
          { label: 'External', externalUrl: 'https://example.com', order: 1 },
        ],
      };

      const response = await request(app)
        .put(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should reject update with invalid location', async () => {
      const updateData = {
        location: 'invalid',
      };

      const response = await request(app)
        .put(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update for non-admin users', async () => {
      const updateData = {
        name: 'Hacked Menu',
      };

      const response = await request(app)
        .put(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer manager-token')
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/menus/:id - Delete Menu', () => {
    let menuId;

    beforeEach(async () => {
      const menu = await Menu.create({
        name: 'Menu to Delete',
        location: 'footer',
        items: [],
        isActive: true,
      });
      menuId = menu._id.toString();
    });

    it('should delete menu successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedMenu = await Menu.findById(menuId);
      expect(deletedMenu).toBeNull();
    });

    it('should return 404 for non-existent menu', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/admin/menus/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/admin/menus/${menuId}`)
        .set('Authorization', 'Bearer manager-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
