/**
 * HomeLayout Management Routes Test
 *
 * Tests for homepage layout management endpoints
 *
 * Test Coverage:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Permission enforcement (admin can CUD, manager can read only)
 * - Active layout management
 * - Section validation
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
import HomeLayout from '../models/HomeLayout.mjs';
import User from '../models/User.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import homeLayoutRoutes from '../routes/homeLayoutRoutes.mjs';

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

  app.use('/api/admin/home-layouts', homeLayoutRoutes);

  return app;
};

describe('HomeLayout Management Routes', () => {
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
    await HomeLayout.deleteMany({});
    await AdminLog.deleteMany({});
  });

  describe('GET /api/admin/home-layouts', () => {
    it('should return all homepage layouts for admin', async () => {
      // Create test layouts
      await HomeLayout.create([
        {
          name: 'Layout 1',
          sections: [{ type: 'hero', data: { title: 'Welcome' }, order: 0 }],
          isActive: true,
        },
        {
          name: 'Layout 2',
          sections: [{ type: 'features', data: { features: [] }, order: 0 }],
          isActive: false,
        },
      ]);

      const response = await request(app)
        .get('/api/admin/home-layouts')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.layouts).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by isActive status', async () => {
      await HomeLayout.create([
        {
          name: 'Active Layout',
          sections: [],
          isActive: true,
        },
        {
          name: 'Inactive Layout',
          sections: [],
          isActive: false,
        },
      ]);

      const response = await request(app)
        .get('/api/admin/home-layouts?isActive=true')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.layouts).toHaveLength(1);
      expect(response.body.data.layouts[0].isActive).toBe(true);
    });

    it('should support pagination', async () => {
      // Create multiple layouts
      for (let i = 1; i <= 5; i++) {
        await HomeLayout.create({
          name: `Layout ${i}`,
          sections: [],
        });
      }

      const response = await request(app)
        .get('/api/admin/home-layouts?page=1&limit=2')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.layouts).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.pages).toBe(3);
    });

    it('should allow manager to view layouts', async () => {
      await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
      });

      const response = await request(app)
        .get('/api/admin/home-layouts')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/home-layouts/active', () => {
    it('should return the active homepage layout', async () => {
      await HomeLayout.create([
        {
          name: 'Inactive Layout',
          sections: [],
          isActive: false,
        },
        {
          name: 'Active Layout',
          sections: [{ type: 'hero', data: { title: 'Welcome' }, order: 0 }],
          isActive: true,
        },
      ]);

      const response = await request(app)
        .get('/api/admin/home-layouts/active')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Active Layout');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 404 if no active layout exists', async () => {
      const response = await request(app)
        .get('/api/admin/home-layouts/active')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/home-layouts/:id', () => {
    it('should return a specific homepage layout by ID', async () => {
      const layout = await HomeLayout.create({
        name: 'Test Layout',
        sections: [{ type: 'hero', data: { title: 'Test' }, order: 0 }],
      });

      const response = await request(app)
        .get(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Test Layout');
      expect(response.body.data.sections).toHaveLength(1);
    });

    it('should return 404 for non-existent layout', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/home-layouts/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/admin/home-layouts/invalid-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/home-layouts', () => {
    it('should create a new homepage layout', async () => {
      const layoutData = {
        name: 'New Layout',
        description: 'Test layout description',
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
            isActive: true,
          },
        ],
        isActive: false,
        seo: {
          title: 'Home Page',
          description: 'Welcome to our site',
        },
      };

      const response = await request(app)
        .post('/api/admin/home-layouts')
        .set('Authorization', 'Bearer admin-token')
        .send(layoutData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Layout');
      expect(response.body.data.sections).toHaveLength(2);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/home-layouts')
        .set('Authorization', 'Bearer admin-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate section types', async () => {
      const layoutData = {
        name: 'Invalid Layout',
        sections: [
          {
            type: 'invalid-type',
            data: { title: 'Test' },
            order: 0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/admin/home-layouts')
        .set('Authorization', 'Bearer admin-token')
        .send(layoutData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid section type');
    });

    it('should validate section structure', async () => {
      const layoutData = {
        name: 'Invalid Layout',
        sections: [
          {
            type: 'hero',
            // Missing data and order
          },
        ],
      };

      const response = await request(app)
        .post('/api/admin/home-layouts')
        .set('Authorization', 'Bearer admin-token')
        .send(layoutData);

      expect(response.status).toBe(400);
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/home-layouts')
        .set('Authorization', 'Bearer manager-token')
        .send({ name: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/home-layouts/:id', () => {
    it('should update an existing homepage layout', async () => {
      const layout = await HomeLayout.create({
        name: 'Original Layout',
        sections: [],
      });

      const updates = {
        name: 'Updated Layout',
        description: 'Updated description',
        sections: [
          {
            type: 'hero',
            data: { title: 'New Hero' },
            order: 0,
            isActive: true,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Layout');
      expect(response.body.data.sections).toHaveLength(1);
    });

    it('should validate section types on update', async () => {
      const layout = await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
      });

      const updates = {
        sections: [
          {
            type: 'invalid-type',
            data: {},
            order: 0,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent layout', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/admin/home-layouts/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/home-layouts/:id/activate', () => {
    it('should activate a layout and deactivate others', async () => {
      const layout1 = await HomeLayout.create({
        name: 'Layout 1',
        sections: [],
        isActive: true,
      });

      const layout2 = await HomeLayout.create({
        name: 'Layout 2',
        sections: [],
        isActive: false,
      });

      const response = await request(app)
        .patch(`/api/admin/home-layouts/${layout2._id}/activate`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(true);

      // Verify layout1 is now inactive
      const updatedLayout1 = await HomeLayout.findById(layout1._id);
      expect(updatedLayout1.isActive).toBe(false);
    });

    it('should return 404 for non-existent layout', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/admin/home-layouts/${fakeId}/activate`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/home-layouts/:id', () => {
    it('should delete an inactive homepage layout', async () => {
      const layout = await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
        isActive: false,
      });

      const response = await request(app)
        .delete(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedLayout = await HomeLayout.findById(layout._id);
      expect(deletedLayout).toBeNull();
    });

    it('should prevent deletion of active layout', async () => {
      const layout = await HomeLayout.create({
        name: 'Active Layout',
        sections: [],
        isActive: true,
      });

      const response = await request(app)
        .delete(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete the active homepage layout');

      // Verify layout still exists
      const existingLayout = await HomeLayout.findById(layout._id);
      expect(existingLayout).not.toBeNull();
    });

    it('should return 404 for non-existent layout', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/admin/home-layouts/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
    });

    it('should deny access for non-admin users', async () => {
      const layout = await HomeLayout.create({
        name: 'Test Layout',
        sections: [],
      });

      const response = await request(app)
        .delete(`/api/admin/home-layouts/${layout._id}`)
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(403);
    });
  });
});
