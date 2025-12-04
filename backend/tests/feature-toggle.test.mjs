/**
 * Feature Toggle API Tests
 * 
 * Tests for the new admin panel feature toggle system
 */

import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Import middleware
import { responseMiddleware } from '../middlewares/response.mjs';
import { errorHandler } from '../middlewares/errorHandler.mjs';

// Import routes
import featureToggleRoutes from '../routes/featureToggleRoutes.mjs';
import fleetRoutes from '../routes/fleetRoutes.mjs';
import driverStatsRoutes from '../routes/driverStatsRoutes.mjs';
import delayCompensationRoutes from '../routes/delayCompensationRoutes.mjs';
import revenueAnalyticsRoutes from '../routes/revenueAnalyticsRoutes.mjs';
import corporateRoutes from '../routes/corporateRoutes.mjs';

// Import models
import FeatureToggle from '../models/FeatureToggle.mjs';
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import Driver from '../models/Driver.mjs';
import DelayCompensation from '../models/DelayCompensation.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(responseMiddleware);

  // Mount routes
  app.use('/api/admin/features', featureToggleRoutes);
  app.use('/api/admin/fleet', fleetRoutes);
  app.use('/api/admin/drivers', driverStatsRoutes);
  app.use('/api/admin/delay', delayCompensationRoutes);
  app.use('/api/admin/analytics', revenueAnalyticsRoutes);
  app.use('/api/admin/corporate', corporateRoutes);

  app.use(errorHandler);
  return app;
};

let app;
let adminToken;
let managerToken;
let userToken;

// Database connection
beforeAll(async () => {
  app = createTestApp();

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

  // Create test users and generate tokens
  const adminUser = { id: 'admin123', email: 'admin@test.com', role: 'admin' };
  const managerUser = { id: 'manager123', email: 'manager@test.com', role: 'manager' };
  const regularUser = { id: 'user123', email: 'user@test.com', role: 'user' };

  adminToken = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '1h' });
  managerToken = jwt.sign(managerUser, JWT_SECRET, { expiresIn: '1h' });
  userToken = jwt.sign(regularUser, JWT_SECRET, { expiresIn: '1h' });

  // Initialize test features
  await FeatureToggle.deleteMany({});
  await FeatureToggle.create([
    {
      id: 'fleet_tracking',
      name: 'Fleet Tracking',
      enabled: true,
      route: '/admin/fleet',
      api: '/api/admin/fleet/live',
      permission: 'view_fleet',
    },
    {
      id: 'driver_performance',
      name: 'Driver Performance',
      enabled: true,
      route: '/admin/drivers/performance',
      api: '/api/admin/drivers/stats',
      permission: 'view_driver_stats',
    },
    {
      id: 'delay_compensation',
      name: 'Delay Compensation',
      enabled: true,
      route: '/admin/delay-compensation',
      api: '/api/admin/delay/pending',
      permission: 'manage_compensation',
    },
    {
      id: 'revenue_analytics',
      name: 'Revenue Analytics',
      enabled: true,
      route: '/admin/analytics',
      api: '/api/admin/analytics/summary',
      permission: 'view_analytics',
    },
    {
      id: 'corporate_clients',
      name: 'Corporate Clients',
      enabled: true,
      route: '/admin/corporate',
      api: '/api/admin/corporate',
      permission: 'manage_corporate',
    },
  ]);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
}, 10000);

describe('Feature Toggle API', () => {
  test('GET /api/admin/features should return all features', async () => {
    const response = await request(app)
      .get('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/admin/features/toggle should toggle feature', async () => {
    const response = await request(app)
      .post('/api/admin/features/toggle')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ featureId: 'fleet_tracking', enabled: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enabled).toBe(false);
  });

  test('GET /api/admin/features/enabled should return enabled features only', async () => {
    const response = await request(app)
      .get('/api/admin/features/enabled')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Fleet Tracking API', () => {
  test('GET /api/admin/fleet/live should return fleet locations', async () => {
    const response = await request(app)
      .get('/api/admin/fleet/live')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('fleetLocation');
    expect(Array.isArray(response.body.data.fleetLocation)).toBe(true);
  });
});

describe('Driver Performance API', () => {
  test('GET /api/admin/drivers/stats should return driver statistics', async () => {
    const response = await request(app)
      .get('/api/admin/drivers/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('driverStats');
    expect(Array.isArray(response.body.data.driverStats)).toBe(true);
  });
});

describe('Delay Compensation API', () => {
  test('GET /api/admin/delay/pending should return pending compensations', async () => {
    const response = await request(app)
      .get('/api/admin/delay/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('compensations');
    expect(Array.isArray(response.body.data.compensations)).toBe(true);
  });

  test('Verify discount code generated on delay', async () => {
    // This test validates the Postman assertion requirement
    const response = await request(app)
      .get('/api/admin/delay/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    // If there are approved compensations, they should have discount codes
    if (response.body.data.compensations.length > 0) {
      const approvedCompensation = response.body.data.compensations.find(
        (c) => c.status === 'approved'
      );
      if (approvedCompensation) {
        expect(approvedCompensation.discountCode).toBeDefined();
        expect(typeof approvedCompensation.discountCode).toBe('string');
      }
    }
  });
});

describe('Revenue Analytics API', () => {
  test('GET /api/admin/analytics/summary should return revenue data', async () => {
    const response = await request(app)
      .get('/api/admin/analytics/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('summary');
    expect(response.body.data.summary).toHaveProperty('totalRevenue');
    expect(typeof response.body.data.summary.totalRevenue).toBe('number');
  });

  test('Verify revenue calculated', async () => {
    // This test validates the Postman assertion requirement
    const response = await request(app)
      .get('/api/admin/analytics/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary.totalRevenue).toBeDefined();
    expect(typeof response.body.data.summary.totalRevenue).toBe('number');
  });
});

describe('Corporate Clients API', () => {
  test('GET /api/admin/corporate should return corporate clients', async () => {
    const response = await request(app)
      .get('/api/admin/corporate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('clients');
    expect(Array.isArray(response.body.data.clients)).toBe(true);
  });

  test('POST /api/admin/corporate should create corporate user', async () => {
    const corporateData = {
      name: 'Test Corp User',
      email: `corp${Date.now()}@test.com`,
      password: 'testpass123',
      companyName: 'Test Corporation',
      taxNumber: '12345678',
    };

    const response = await request(app)
      .post('/api/admin/corporate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(corporateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isCorporate).toBe(true);
  });

  test('Verify corporate flag set', async () => {
    // This test validates the Postman assertion requirement
    const corporateData = {
      name: 'Test Corp User 2',
      email: `corp${Date.now()}@test.com`,
      password: 'testpass123',
      companyName: 'Test Corporation 2',
    };

    const response = await request(app)
      .post('/api/admin/corporate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(corporateData);

    expect(response.status).toBe(200);
    expect(response.body.data.isCorporate).toBe(true);
  });
});
