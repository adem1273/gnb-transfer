/**
 * API Backend Validation Tests
 * 
 * Automated tests for GNB Transfer backend API endpoints
 * Tests are aligned with the shared Postman Collection
 * 
 * Test Coverage:
 * - Auth: register, login, token usage
 * - Booking: create, list
 * - Car (Vehicle): list, add (admin)
 * - Review: add (if available)
 * 
 * @requires jest
 * @requires supertest
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Import middleware
import { responseMiddleware } from '../middlewares/response.mjs';
import { errorHandler } from '../middlewares/errorHandler.mjs';

// Import routes
import userRoutes from '../routes/userRoutes.mjs';
import tourRoutes from '../routes/tourRoutes.mjs';
import bookingRoutes from '../routes/bookingRoutes.mjs';
import vehicleRoutes from '../routes/vehicleRoutes.mjs';

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
  app.use('/api/tours', tourRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  
  // Error handler
  app.use(errorHandler);
  
  return app;
};

// Test data storage
let authToken = null;
let adminToken = null;
let testUserId = null;
let testAdminId = null;
let testTourId = null;
let testBookingId = null;
let testVehicleId = null;

// Test app instance
let app;

// Database connection
beforeAll(async () => {
  app = createTestApp();
  
  // Connect to test database
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer-test';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error.message);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      console.log('✓ Test database cleaned');
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
});

// ========================================
// Auth Endpoints Tests
// ========================================

describe('Auth Endpoints', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Test123456',
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', userData.email.toLowerCase());
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');
      
      // Store user ID for later tests
      testUserId = response.body.data.user._id;
      authToken = response.body.data.token;
    });
    
    it('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'testuser@example.com', // Same as above
        password: 'Test123456',
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(409);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/already registered/i);
    });
    
    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'Invalid Email User',
        email: 'invalid-email',
        password: 'Test123456',
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'incomplete@example.com',
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should register an admin user for protected route tests', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123456',
        role: 'admin', // This might be ignored by the endpoint for security
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(adminData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      testAdminId = response.body.data.user._id;
      
      // Manually set admin role for testing (in real scenario, this would be done by superadmin)
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(testAdminId, { role: 'admin' });
      
      // Get new token with admin role
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: adminData.email,
          password: adminData.password,
        });
      
      adminToken = loginResponse.body.data.token;
    });
  });
  
  describe('POST /api/users/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123456',
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', loginData.email.toLowerCase());
      expect(response.body.data.user).not.toHaveProperty('password');
      
      // Store token for protected endpoints
      authToken = response.body.data.token;
    });
    
    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'WrongPassword123',
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123456',
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('Token Usage - Protected Routes', () => {
    it('should allow access to protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', 'testuser@example.com');
    });
    
    it('should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/no token/i);
    });
    
    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid token/i);
    });
  });
});

// ========================================
// Booking Endpoints Tests
// ========================================

describe('Booking Endpoints', () => {
  // Create a test tour first for booking tests
  beforeAll(async () => {
    const Tour = mongoose.model('Tour');
    const testTour = await Tour.create({
      title: 'Test Tour for Booking',
      description: 'A test tour for booking validation',
      price: 100,
      duration: 2,
      discount: 10,
      isCampaign: false,
    });
    testTourId = testTour._id.toString();
  });
  
  describe('POST /api/bookings', () => {
    it('should create a new booking successfully', async () => {
      const bookingData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+1234567890',
        tourId: testTourId,
        guests: 2,
        paymentMethod: 'cash',
        date: new Date().toISOString(),
        pickupLocation: 'Hotel ABC',
        notes: 'Please call before arrival',
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', bookingData.name);
      expect(response.body.data).toHaveProperty('email', bookingData.email.toLowerCase());
      expect(response.body.data).toHaveProperty('guests', bookingData.guests);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('status');
      
      // Store booking ID for later tests
      testBookingId = response.body.data._id;
      
      // Verify amount calculation (price * guests)
      expect(response.body.data.amount).toBe(100 * 2); // 100 per guest * 2 guests
    });
    
    it('should reject booking with invalid tourId', async () => {
      const bookingData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        tourId: '507f1f77bcf86cd799439011', // Valid ObjectId but doesn't exist
        guests: 2,
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/tour not found/i);
    });
    
    it('should reject booking with missing required fields', async () => {
      const bookingData = {
        name: 'Test Customer',
        // Missing email and tourId
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should reject booking with invalid email format', async () => {
      const bookingData = {
        name: 'Test Customer',
        email: 'invalid-email-format',
        tourId: testTourId,
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('GET /api/bookings', () => {
    it('should list all bookings for admin user', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify booking structure
      const booking = response.body.data[0];
      expect(booking).toHaveProperty('_id');
      expect(booking).toHaveProperty('name');
      expect(booking).toHaveProperty('email');
      expect(booking).toHaveProperty('status');
    });
    
    it('should reject listing bookings without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('GET /api/bookings/:id', () => {
    it('should get a specific booking by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', testBookingId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
    });
    
    it('should reject getting booking without authentication', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
});

// ========================================
// Vehicle (Car) Endpoints Tests
// ========================================

describe('Vehicle (Car) Endpoints', () => {
  describe('GET /api/vehicles', () => {
    it('should list all vehicles for admin user', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('vehicles');
      expect(Array.isArray(response.body.data.vehicles)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });
    
    it('should reject listing vehicles without authentication', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should reject listing vehicles with regular user token', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/insufficient permissions/i);
    });
    
    it('should filter vehicles by status', async () => {
      const response = await request(app)
        .get('/api/vehicles?status=available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('vehicles');
      expect(Array.isArray(response.body.data.vehicles)).toBe(true);
    });
  });
  
  describe('POST /api/vehicles', () => {
    it('should create a new vehicle for admin user', async () => {
      const vehicleData = {
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        licensePlate: 'ABC-1234',
        type: 'sedan',
        capacity: 5,
        status: 'available',
        color: 'Black',
        fuelType: 'petrol',
        mileage: 15000,
      };
      
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vehicleData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('brand', vehicleData.brand);
      expect(response.body.data).toHaveProperty('model', vehicleData.model);
      expect(response.body.data).toHaveProperty('licensePlate', vehicleData.licensePlate);
      expect(response.body.data).toHaveProperty('type', vehicleData.type);
      expect(response.body.data).toHaveProperty('status', vehicleData.status);
      
      // Store vehicle ID for later tests
      testVehicleId = response.body.data._id;
    });
    
    it('should reject creating vehicle without authentication', async () => {
      const vehicleData = {
        brand: 'Honda',
        model: 'Accord',
        licensePlate: 'XYZ-5678',
        type: 'sedan',
      };
      
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
    
    it('should reject creating vehicle with regular user token', async () => {
      const vehicleData = {
        brand: 'Honda',
        model: 'Accord',
        licensePlate: 'XYZ-5678',
        type: 'sedan',
      };
      
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/insufficient permissions/i);
    });
    
    it('should reject creating vehicle with missing required fields', async () => {
      const vehicleData = {
        brand: 'Honda',
        // Missing model and licensePlate
      };
      
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vehicleData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
});

// ========================================
// Review Endpoints Tests
// ========================================

describe('Review Endpoints', () => {
  describe('POST /api/tours/:id/reviews (or similar)', () => {
    it.skip('should add a review to a tour - IMPLEMENTATION PENDING', async () => {
      // Note: Review functionality may not be implemented yet
      // This test is marked as skipped and serves as documentation
      // for the expected review endpoint behavior
      
      const reviewData = {
        rating: 5,
        comment: 'Excellent tour! Highly recommended.',
        userName: 'Test User',
      };
      
      const response = await request(app)
        .post(`/api/tours/${testTourId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('rating', reviewData.rating);
      expect(response.body.data).toHaveProperty('comment', reviewData.comment);
    });
    
    it.skip('should reject adding review without authentication - IMPLEMENTATION PENDING', async () => {
      const reviewData = {
        rating: 4,
        comment: 'Good tour',
      };
      
      const response = await request(app)
        .post(`/api/tours/${testTourId}/reviews`)
        .send(reviewData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('GET /api/tours/:id/reviews (or similar)', () => {
    it.skip('should list reviews for a tour - IMPLEMENTATION PENDING', async () => {
      const response = await request(app)
        .get(`/api/tours/${testTourId}/reviews`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

// ========================================
// Additional Integration Tests
// ========================================

describe('Integration Tests', () => {
  describe('Complete booking flow with authentication', () => {
    it('should complete a full booking flow: register -> login -> create booking', async () => {
      // Step 1: Register a new user
      const newUser = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'Integration123',
      };
      
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(newUser)
        .expect(201);
      
      expect(registerResponse.body.success).toBe(true);
      const userToken = registerResponse.body.data.token;
      
      // Step 2: Create a booking with the user's token
      const bookingData = {
        name: newUser.name,
        email: newUser.email,
        tourId: testTourId,
        guests: 3,
        paymentMethod: 'cash',
      };
      
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);
      
      expect(bookingResponse.body.success).toBe(true);
      expect(bookingResponse.body.data.email).toBe(newUser.email.toLowerCase());
      expect(bookingResponse.body.data.guests).toBe(3);
    });
  });
  
  describe('Admin-only operations workflow', () => {
    it('should allow admin to create vehicle and access all bookings', async () => {
      // Step 1: Create a vehicle as admin
      const vehicleData = {
        brand: 'Mercedes',
        model: 'E-Class',
        year: 2024,
        licensePlate: 'ADMIN-001',
        type: 'luxury',
        status: 'available',
      };
      
      const vehicleResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vehicleData)
        .expect(201);
      
      expect(vehicleResponse.body.success).toBe(true);
      
      // Step 2: Access all bookings as admin
      const bookingsResponse = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(bookingsResponse.body.success).toBe(true);
      expect(Array.isArray(bookingsResponse.body.data)).toBe(true);
    });
  });
});

// ========================================
// Error Handling Tests
// ========================================

describe('Error Handling', () => {
  describe('Invalid request handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      // The response may vary based on error handler implementation
    });
    
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
      
      // Server should handle JSON parsing errors
    });
  });
  
  describe('MongoDB ObjectId validation', () => {
    it('should reject invalid MongoDB ObjectId format', async () => {
      const response = await request(app)
        .get('/api/tours/invalid-id')
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
