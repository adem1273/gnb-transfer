/**
 * Admin Stats Endpoint Test
 * 
 * Tests the GET /api/admin/stats endpoint
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
import Tour from '../models/Tour.mjs';
import Booking from '../models/Booking.mjs';

// Import middleware
import { responseMiddleware } from '../middlewares/response.mjs';
import { errorHandler } from '../middlewares/errorHandler.mjs';

// Import routes
import adminRoutes from '../routes/adminRoutes.mjs';
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
  app.use('/api/admin', adminRoutes);

  // Error handler
  app.use(errorHandler);

  return app;
};

let app;
let adminToken;

describe('Admin Stats Endpoint', () => {
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
    // Clear all collections
    await User.deleteMany({});
    await Tour.deleteMany({});
    await Booking.deleteMany({});

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Admin123!',
        role: 'admin'
      });

    adminToken = adminResponse.body.token || adminResponse.body.data?.token;
  });

  test('should return 401 without authentication', async () => {
    const response = await request(app).get('/api/admin/stats');
    
    expect(response.status).toBe(401);
  });

  test('should return 403 for non-admin users', async () => {
    // Create regular user
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'User123!',
        role: 'user'
      });

    const userToken = userResponse.body.token || userResponse.body.data?.token;

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });

  test('should return 200 and all required fields for admin', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    const stats = response.body.data;
    
    // Check all required fields exist
    expect(stats).toHaveProperty('totalUsers');
    expect(stats).toHaveProperty('totalTours');
    expect(stats).toHaveProperty('totalBookings');
    expect(stats).toHaveProperty('todayBookings');
    expect(stats).toHaveProperty('pendingBookings');
    expect(stats).toHaveProperty('totalRevenue');
    
    // Check no field is undefined or null
    expect(stats.totalUsers).not.toBeUndefined();
    expect(stats.totalUsers).not.toBeNull();
    expect(stats.totalTours).not.toBeUndefined();
    expect(stats.totalTours).not.toBeNull();
    expect(stats.totalBookings).not.toBeUndefined();
    expect(stats.totalBookings).not.toBeNull();
    expect(stats.todayBookings).not.toBeUndefined();
    expect(stats.todayBookings).not.toBeNull();
    expect(stats.pendingBookings).not.toBeUndefined();
    expect(stats.pendingBookings).not.toBeNull();
    expect(stats.totalRevenue).not.toBeUndefined();
    expect(stats.totalRevenue).not.toBeNull();
    
    // Check types
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalTours).toBe('number');
    expect(typeof stats.totalBookings).toBe('number');
    expect(typeof stats.todayBookings).toBe('number');
    expect(typeof stats.pendingBookings).toBe('number');
    expect(typeof stats.totalRevenue).toBe('number');
  });

  test('should return correct statistics with sample data', async () => {
    // Create additional users
    await User.create({
      name: 'User 1',
      email: 'user1@test.com',
      password: 'Password123!',
      role: 'user'
    });
    
    await User.create({
      name: 'User 2',
      email: 'user2@test.com',
      password: 'Password123!',
      role: 'user'
    });

    // Create tours
    const tour1 = await Tour.create({
      title: 'Test Tour 1',
      description: 'Description 1',
      price: 100,
      duration: 2
    });
    
    const tour2 = await Tour.create({
      title: 'Test Tour 2',
      description: 'Description 2',
      price: 200,
      duration: 3
    });

    // Create bookings
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Booking from today - pending
    await Booking.create({
      name: 'Customer 1',
      email: 'customer1@test.com',
      tour: tour1._id,
      amount: 100,
      status: 'pending',
      passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }],
      createdAt: now
    });

    // Booking from today - completed
    await Booking.create({
      name: 'Customer 2',
      email: 'customer2@test.com',
      tour: tour2._id,
      amount: 200,
      status: 'completed',
      passengers: [{ firstName: 'Jane', lastName: 'Doe', type: 'adult' }],
      createdAt: now
    });

    // Booking from yesterday - paid
    await Booking.create({
      name: 'Customer 3',
      email: 'customer3@test.com',
      tour: tour1._id,
      amount: 150,
      status: 'paid',
      passengers: [{ firstName: 'Bob', lastName: 'Smith', type: 'adult' }],
      createdAt: yesterday
    });

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    
    const stats = response.body.data;
    
    // Verify counts (1 admin + 2 users = 3 total)
    expect(stats.totalUsers).toBe(3);
    expect(stats.totalTours).toBe(2);
    expect(stats.totalBookings).toBe(3);
    expect(stats.todayBookings).toBe(2); // 2 bookings created today
    expect(stats.pendingBookings).toBe(1); // 1 booking with pending status
    expect(stats.totalRevenue).toBe(350); // 200 (completed) + 150 (paid)
  });

  test('should return zeros when no data exists', async () => {
    // Delete the admin user to have zero users
    await User.deleteMany({});

    // Create a fresh admin for the request
    const adminResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Admin123!',
        role: 'admin'
      });

    const freshAdminToken = adminResponse.body.token || adminResponse.body.data?.token;

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${freshAdminToken}`);
    
    expect(response.status).toBe(200);
    
    const stats = response.body.data;
    
    expect(stats.totalUsers).toBe(1); // Just the admin
    expect(stats.totalTours).toBe(0);
    expect(stats.totalBookings).toBe(0);
    expect(stats.todayBookings).toBe(0);
    expect(stats.pendingBookings).toBe(0);
    expect(stats.totalRevenue).toBe(0);
  });
});
