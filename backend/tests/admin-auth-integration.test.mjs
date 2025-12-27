/**
 * Admin Authentication Integration Tests
 * 
 * Tests authentication flow, logout behavior, and token expiration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import authRoutes from '../routes/authRoutes.mjs';
import adminRoutes from '../routes/adminRoutes.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';
import User from '../models/User.mjs';
import RefreshToken from '../models/RefreshToken.mjs';
import bcrypt from 'bcryptjs';

let mongoServer;
let app;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Setup Express app
  app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear database before each test
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
});

describe('Admin Authentication Integration', () => {
  describe('Login Flow', () => {
    it('should login admin user successfully', async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      // Try with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should logout and revoke refresh token', async () => {
      // Create and login admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Verify refresh token exists
      const tokenCountBefore = await RefreshToken.countDocuments({ userId: user._id, revoked: false });
      expect(tokenCountBefore).toBe(1);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Verify refresh token is revoked
      const tokenCountAfter = await RefreshToken.countDocuments({ userId: user._id, revoked: false });
      expect(tokenCountAfter).toBe(0);
    });

    it('should prevent using revoked refresh token', async () => {
      // Create and login admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Logout (revokes refresh token)
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Try to use revoked refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Admin Routes', () => {
    it('should reject unauthenticated requests to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token/i);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|token/i);
    });

    it('should accept requests with valid admin token', async () => {
      // Create and login admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        });

      const { accessToken } = loginResponse.body.data;

      // Access admin route
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
    });

    it('should reject non-admin users from admin routes', async () => {
      // Create regular user
      const hashedPassword = await bcrypt.hash('user123', 10);
      await User.create({
        name: 'Regular User',
        email: 'user@test.com',
        password: hashedPassword,
        role: 'user',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123',
        });

      const { accessToken } = loginResponse.body.data;

      // Try to access admin route
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/permission/i);
    });
  });

  describe('Token Expiration', () => {
    it('should handle expired access tokens', async () => {
      // This test would require mocking JWT to generate expired tokens
      // For now, we'll test that the middleware correctly rejects invalid tokens
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MH0.invalid')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should allow logout from all devices', async () => {
      // Create and login admin user twice (2 sessions)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
      });

      // First login
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' });

      // Second login
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' });

      // Verify 2 active sessions
      const sessionsBefore = await RefreshToken.countDocuments({ userId: user._id, revoked: false });
      expect(sessionsBefore).toBe(2);

      // Logout from all devices
      await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${login1.body.data.accessToken}`)
        .expect(200);

      // Verify all sessions revoked
      const sessionsAfter = await RefreshToken.countDocuments({ userId: user._id, revoked: false });
      expect(sessionsAfter).toBe(0);
    });
  });
});
