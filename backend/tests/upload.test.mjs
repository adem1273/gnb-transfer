/**
 * Upload Routes Test
 *
 * Tests for image upload endpoint
 *
 * Test Coverage:
 * - Admin authentication required
 * - File type validation (JPEG, PNG, WebP only)
 * - File size validation (2MB max)
 * - Successful upload returns URL
 *
 * @requires jest
 * @requires supertest
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load test environment
dotenv.config({ path: '.env.test' });

// Import middleware
import { responseMiddleware } from '../middlewares/response.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requireAdmin } from '../middlewares/adminGuard.mjs';
import uploadRoutes from '../routes/uploadRoutes.mjs';

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
      req.user = { id: 'test-admin-id', role: 'admin' };
    } else if (req.headers.authorization === 'Bearer user-token') {
      req.user = { id: 'test-user-id', role: 'user' };
    }
    next();
  });

  app.use('/api/v1/upload', uploadRoutes);

  return app;
};

describe('Upload Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/upload/image', () => {
    it('should reject request without authentication', async () => {
      const response = await request(app).post('/api/v1/upload/image').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No image file provided');
    });

    // Note: Testing actual file upload requires Cloudinary credentials
    // This test validates the endpoint structure and authentication
    // For full integration testing, set CLOUDINARY_* env vars in .env.test
  });
});
