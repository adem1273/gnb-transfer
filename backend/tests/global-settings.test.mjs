/**
 * Global Settings API Test
 *
 * Tests the GET /api/admin/global-settings and PUT /api/admin/global-settings endpoints
 *
 * Test Coverage:
 * - Read/write permissions (admin vs manager vs unauthorized)
 * - Data persistence
 * - Validation errors
 * - Single-document pattern
 */

import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Import models
import User from '../models/User.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';

// Import middleware
import { responseMiddleware } from '../middlewares/response.mjs';
import { errorHandler } from '../middlewares/errorHandler.mjs';

// Import routes
import globalSettingsRoutes from '../routes/globalSettingsRoutes.mjs';
import userRoutes from '../routes/userRoutes.mjs';

// Create test app
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(responseMiddleware);

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/admin/global-settings', globalSettingsRoutes);

  // Error handler
  app.use(errorHandler);

  return app;
};

let app;
let adminToken;
let managerToken;
let userToken;
let adminUserId;
let managerUserId;
let regularUserId;

describe('Global Settings API', () => {
  beforeAll(async () => {
    app = createTestApp();

    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer-test';

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✓ Connected to test database');
    } catch (error) {
      console.error('\n❌ Failed to connect to test database:', error.message);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await GlobalSettings.deleteMany({});

    // Create test users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    adminUserId = adminUser._id.toString();

    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager',
    });
    managerUserId = managerUser._id.toString();

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
    });
    regularUserId = regularUser._id.toString();

    // Login users to get tokens
    const adminLogin = await request(app).post('/api/users/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    adminToken = adminLogin.body.data.token;

    const managerLogin = await request(app).post('/api/users/login').send({
      email: 'manager@test.com',
      password: 'password123',
    });
    managerToken = managerLogin.body.data.token;

    const userLogin = await request(app).post('/api/users/login').send({
      email: 'user@test.com',
      password: 'password123',
    });
    userToken = userLogin.body.data.token;
  });

  describe('GET /api/admin/global-settings', () => {
    it('should allow admin to read global settings', async () => {
      const response = await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('siteName');
      expect(response.body.data).toHaveProperty('contactEmail');
      expect(response.body.data).toHaveProperty('currency');
      expect(response.body.data).toHaveProperty('defaultLanguage');
      expect(response.body.data).toHaveProperty('featureFlags');
    });

    it('should allow manager to read global settings', async () => {
      const response = await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('siteName');
    });

    it('should deny regular user access to read global settings', async () => {
      const response = await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should deny unauthorized access', async () => {
      const response = await request(app).get('/api/admin/global-settings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return default settings if none exist', async () => {
      const response = await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.siteName).toBe('GNB Transfer');
      expect(response.body.data.currency).toBe('USD');
      expect(response.body.data.defaultLanguage).toBe('en');
    });
  });

  describe('PUT /api/admin/global-settings', () => {
    it('should allow admin to update global settings', async () => {
      const updates = {
        siteName: 'Updated Site Name',
        contactEmail: 'newemail@test.com',
        contactPhone: '+9876543210',
        address: '456 New Street, New City',
        currency: 'EUR',
        defaultLanguage: 'es',
        featureFlags: {
          enableBookings: false,
          enablePayments: true,
          enableLoyalty: false,
        },
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.siteName).toBe('Updated Site Name');
      expect(response.body.data.contactEmail).toBe('newemail@test.com');
      expect(response.body.data.currency).toBe('EUR');
      expect(response.body.data.defaultLanguage).toBe('es');
    });

    it('should deny manager from updating global settings', async () => {
      const updates = {
        siteName: 'Manager Update',
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updates);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should deny regular user from updating global settings', async () => {
      const updates = {
        siteName: 'User Update',
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should persist data after update', async () => {
      const updates = {
        siteName: 'Persistence Test',
        currency: 'GBP',
      };

      // Update settings
      await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      // Read settings
      const response = await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.siteName).toBe('Persistence Test');
      expect(response.body.data.currency).toBe('GBP');
    });

    it('should reject invalid email format', async () => {
      const updates = {
        contactEmail: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should reject invalid currency', async () => {
      const updates = {
        currency: 'INVALID',
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should reject invalid language', async () => {
      const updates = {
        defaultLanguage: 'invalid',
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should handle partial updates', async () => {
      // First update
      await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ siteName: 'First Update' });

      // Second update (different field)
      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currency: 'EUR' });

      expect(response.status).toBe(200);
      expect(response.body.data.siteName).toBe('First Update'); // Should retain previous update
      expect(response.body.data.currency).toBe('EUR'); // Should have new update
    });
  });

  describe('Single-document pattern', () => {
    it('should maintain only one settings document', async () => {
      // Get settings multiple times
      await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .get('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      // Update settings
      await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ siteName: 'Single Doc Test' });

      // Check database - should only have 1 document
      const count = await GlobalSettings.countDocuments();
      expect(count).toBe(1);

      // Verify it has the latest data
      const settings = await GlobalSettings.findOne();
      expect(settings.siteName).toBe('Single Doc Test');
    });
  });

  describe('Feature flags', () => {
    it('should update individual feature flags', async () => {
      const updates = {
        featureFlags: {
          enableBookings: false,
          enablePayments: true,
        },
      };

      const response = await request(app)
        .put('/api/admin/global-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.featureFlags).toBeDefined();
      
      // Check the flags were updated
      const settings = await GlobalSettings.findOne();
      expect(settings.featureFlags.get('enableBookings')).toBe(false);
      expect(settings.featureFlags.get('enablePayments')).toBe(true);
    });
  });
});
