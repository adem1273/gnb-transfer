/**
 * Admin Booking Actions Test
 * 
 * Tests the admin booking action endpoints:
 * - PATCH /api/admin/bookings/:id/approve
 * - PATCH /api/admin/bookings/:id/cancel
 * - PATCH /api/admin/bookings/:id/complete
 */

import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

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

// Set test environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-admin-booking-actions';
process.env.NODE_ENV = 'test';

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
let managerToken;
let userToken;
let testTour;

const skipTests = !process.env.MONGO_URI;

describe('Admin Booking Actions', () => {
  beforeAll(async () => {
    if (skipTests) {
      console.warn('⚠️  Skipping Admin Booking Actions tests - MONGO_URI not set');
      return;
    }

    app = createTestApp();

    try {
      // Don't use global mongoose connection - tests will use existing connection from setup.mjs
      console.log('✓ Using existing database connection for tests');
    } catch (error) {
      console.error('\n❌ Test setup failed:', error.message);
      throw error;
    }
  }, 30000);

  beforeEach(async () => {
    if (skipTests) return;

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

    // Create manager user
    const managerResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Manager User',
        email: 'manager@test.com',
        password: 'Manager123!',
        role: 'manager'
      });

    managerToken = managerResponse.body.token || managerResponse.body.data?.token;

    // Create regular user
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'User123!',
        role: 'user'
      });

    userToken = userResponse.body.token || userResponse.body.data?.token;

    // Create test tour
    testTour = await Tour.create({
      title: 'Test Tour',
      description: 'Test tour description',
      price: 100,
      duration: 2
    });
  });

  describe('PATCH /api/admin/bookings/:id/approve', () => {
    test('should return 401 without authentication', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`);
      
      expect(response.status).toBe(401);
    });

    test('should return 403 for non-admin/manager users', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });

    test('should approve a pending booking as admin', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');

      // Verify database update
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('confirmed');
    });

    test('should approve a pending booking as manager', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });

    test('should return 400 when trying to approve a confirmed booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'confirmed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only pending bookings can be approved');
    });

    test('should return 400 when trying to approve a cancelled booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'cancelled',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent booking', async () => {
      if (skipTests) return;

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/bookings/${fakeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid booking ID format', async () => {
      if (skipTests) return;

      const response = await request(app)
        .patch('/api/admin/bookings/invalid-id/approve')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid booking ID format');
    });
  });

  describe('PATCH /api/admin/bookings/:id/cancel', () => {
    test('should return 401 without authentication', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`);
      
      expect(response.status).toBe(401);
    });

    test('should return 403 for non-admin/manager users', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });

    test('should cancel a pending booking as admin', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');

      // Verify database update
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('cancelled');
    });

    test('should cancel a confirmed booking as manager', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'confirmed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('should return 400 when trying to cancel a completed booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'completed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot cancel a completed booking');
    });

    test('should return 400 when trying to cancel an already cancelled booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'cancelled',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already cancelled');
    });

    test('should return 404 for non-existent booking', async () => {
      if (skipTests) return;

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/bookings/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/bookings/:id/complete', () => {
    test('should return 401 without authentication', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'confirmed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`);
      
      expect(response.status).toBe(401);
    });

    test('should return 403 for non-admin/manager users', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'confirmed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });

    test('should complete a confirmed booking as admin', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'confirmed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');

      // Verify database update
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('completed');
    });

    test('should complete a pending booking as manager', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('should complete a paid booking as admin', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'paid',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('should return 400 when trying to complete a cancelled booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'cancelled',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot complete a cancelled booking');
    });

    test('should return 400 when trying to complete an already completed booking', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'completed',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already completed');
    });

    test('should return 404 for non-existent booking', async () => {
      if (skipTests) return;

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/bookings/${fakeId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('State Transition Validation', () => {
    test('should not allow completing a cancelled booking even after approval attempt', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      // Cancel the booking first
      await request(app)
        .patch(`/api/admin/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to complete it (should fail)
      const response = await request(app)
        .patch(`/api/admin/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot complete a cancelled booking');

      // Verify booking is still cancelled
      const finalBooking = await Booking.findById(booking._id);
      expect(finalBooking.status).toBe('cancelled');
    });

    test('should track updatedAt timestamp on status changes', async () => {
      if (skipTests) return;

      const booking = await Booking.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        tour: testTour._id,
        amount: 100,
        status: 'pending',
        passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
      });

      const originalUpdatedAt = booking.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Approve the booking
      await request(app)
        .patch(`/api/admin/bookings/${booking._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Check that updatedAt changed
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
