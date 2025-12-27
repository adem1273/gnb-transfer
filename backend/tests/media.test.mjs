/**
 * Media Routes Test
 *
 * Tests for media management endpoints
 *
 * Test Coverage:
 * - Upload validation (type, size)
 * - Permission enforcement (admin upload/delete, manager read-only)
 * - Safe deletion logic (usage count enforcement)
 * - Media listing and filtering
 * - Admin action logging
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Media from '../models/Media.mjs';
import User from '../models/User.mjs';
import AdminLog from '../models/AdminLog.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import mediaRoutes from '../routes/mediaRoutes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      req.user = { id: 'manager-id', email: 'manager@test.com', name: 'Manager User', role: 'manager' };
    } else if (req.headers.authorization === 'Bearer user-token') {
      req.user = { id: 'user-id', email: 'user@test.com', name: 'Regular User', role: 'user' };
    }
    next();
  });

  app.use('/api/v1/admin/media', mediaRoutes);

  return app;
};

describe('Media Routes', () => {
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
    // Clean up test uploads directory
    const testUploadsDir = path.join(process.cwd(), 'uploads', 'media');
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Media.deleteMany({});
    await AdminLog.deleteMany({});
  });

  describe('POST /api/v1/admin/media/upload', () => {
    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should allow manager to view but not upload', async () => {
      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer manager-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No file provided');
    });

    it('should reject request without multipart/form-data content-type', async () => {
      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .set('Content-Type', 'application/json')
        .send({ file: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('multipart/form-data');
    });

    it('should successfully upload a valid image file', async () => {
      // Create a small test image buffer
      const testBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', testBuffer, { filename: 'test-image.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('uploaded successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('originalName', 'test-image.jpg');
      expect(response.body.data).toHaveProperty('mimeType', 'image/jpeg');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('usageCount', 0);

      // Verify media record was created in database
      const media = await Media.findById(response.body.data.id);
      expect(media).toBeTruthy();
      expect(media.originalName).toBe('test-image.jpg');
      expect(media.uploadedBy.toString()).toBe('admin-id');

      // Verify admin log was created
      const log = await AdminLog.findOne({ action: 'CREATE', 'target.type': 'Media' });
      expect(log).toBeTruthy();
      expect(log.user.email).toBe('admin@test.com');
    });

    it('should reject files exceeding 10MB', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', largeBuffer, { filename: 'large-file.jpg', contentType: 'image/jpeg' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('10MB');
    });

    it('should reject invalid file types', async () => {
      const testBuffer = Buffer.from('fake-executable');

      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', testBuffer, { filename: 'malicious.exe', contentType: 'application/x-msdownload' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid file type');
    });

    it('should accept PDF files', async () => {
      const testBuffer = Buffer.from('fake-pdf-content');

      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', testBuffer, { filename: 'document.pdf', contentType: 'application/pdf' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mimeType).toBe('application/pdf');
    });

    it('should reject multiple files', async () => {
      const testBuffer = Buffer.from('fake-image');

      const response = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', testBuffer, { filename: 'test1.jpg', contentType: 'image/jpeg' })
        .attach('file2', testBuffer, { filename: 'test2.jpg', contentType: 'image/jpeg' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/media', () => {
    beforeEach(async () => {
      // Create test media files
      await Media.create([
        {
          filename: 'file1.jpg',
          originalName: 'test1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          storagePath: 'media/2024/01/file1.jpg',
          uploadedBy: testUser._id,
          usageCount: 0,
        },
        {
          filename: 'file2.png',
          originalName: 'test2.png',
          mimeType: 'image/png',
          size: 2048,
          storagePath: 'media/2024/01/file2.png',
          uploadedBy: testUser._id,
          usageCount: 3,
        },
        {
          filename: 'doc1.pdf',
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          size: 5120,
          storagePath: 'media/2024/01/doc1.pdf',
          uploadedBy: testUser._id,
          usageCount: 1,
        },
      ]);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to list all media', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(3);
      expect(response.body.data.pagination).toHaveProperty('totalItems', 3);
    });

    it('should allow manager to list all media', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(3);
    });

    it('should filter by MIME type', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media?mimeType=application/pdf')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.media[0].mimeType).toBe('application/pdf');
    });

    it('should search by filename', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media?search=document')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.media[0].originalName).toContain('document');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media?page=1&limit=2')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasMore).toBe(true);
    });

    it('should include uploader information', async () => {
      const response = await request(app)
        .get('/api/v1/admin/media')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.media[0].uploadedBy).toHaveProperty('name');
      expect(response.body.data.media[0].uploadedBy).toHaveProperty('email');
    });
  });

  describe('DELETE /api/v1/admin/media/:id', () => {
    let mediaWithoutUsage;
    let mediaWithUsage;

    beforeEach(async () => {
      // Create media without usage
      mediaWithoutUsage = await Media.create({
        filename: 'unused.jpg',
        originalName: 'unused.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/unused.jpg',
        uploadedBy: testUser._id,
        usageCount: 0,
      });

      // Create media with usage
      mediaWithUsage = await Media.create({
        filename: 'used.jpg',
        originalName: 'used.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/used.jpg',
        uploadedBy: testUser._id,
        usageCount: 5,
      });
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/media/${mediaWithoutUsage._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from manager', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/media/${mediaWithoutUsage._id}`)
        .set('Authorization', 'Bearer manager-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should successfully delete media with zero usage count', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/media/${mediaWithoutUsage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify media was deleted from database
      const media = await Media.findById(mediaWithoutUsage._id);
      expect(media).toBeNull();

      // Verify admin log was created
      const log = await AdminLog.findOne({ action: 'DELETE', 'target.type': 'Media' });
      expect(log).toBeTruthy();
      expect(log.user.email).toBe('admin@test.com');
    });

    it('should reject deletion of media with non-zero usage count', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/media/${mediaWithUsage._id}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('currently in use');
      expect(response.body.message).toContain('usage count: 5');

      // Verify media was NOT deleted from database
      const media = await Media.findById(mediaWithUsage._id);
      expect(media).toBeTruthy();
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/admin/media/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Media Model - Usage Count Methods', () => {
    it('should increment usage count', async () => {
      const media = await Media.create({
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/test.jpg',
        uploadedBy: testUser._id,
      });

      expect(media.usageCount).toBe(0);

      await media.incrementUsage();
      expect(media.usageCount).toBe(1);

      await media.incrementUsage();
      expect(media.usageCount).toBe(2);
    });

    it('should decrement usage count', async () => {
      const media = await Media.create({
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/test.jpg',
        uploadedBy: testUser._id,
        usageCount: 3,
      });

      await media.decrementUsage();
      expect(media.usageCount).toBe(2);

      await media.decrementUsage();
      expect(media.usageCount).toBe(1);
    });

    it('should not decrement below zero', async () => {
      const media = await Media.create({
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/test.jpg',
        uploadedBy: testUser._id,
        usageCount: 0,
      });

      await media.decrementUsage();
      expect(media.usageCount).toBe(0);
    });

    it('should correctly report canDelete status', async () => {
      const media1 = await Media.create({
        filename: 'test1.jpg',
        originalName: 'test1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/test1.jpg',
        uploadedBy: testUser._id,
        usageCount: 0,
      });

      const media2 = await Media.create({
        filename: 'test2.jpg',
        originalName: 'test2.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'media/2024/01/test2.jpg',
        uploadedBy: testUser._id,
        usageCount: 5,
      });

      expect(media1.canDelete()).toBe(true);
      expect(media2.canDelete()).toBe(false);
    });
  });
});
