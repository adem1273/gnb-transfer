/**
 * API Versioning Tests
 *
 * Tests for API versioning middleware and v1 routes
 * These tests don't require MongoDB connection - they test the middleware and endpoints directly
 *
 * @requires jest
 * @requires supertest
 */

import request from 'supertest';
import express from 'express';

// Import middleware and routes
import { apiVersionMiddleware, API_VERSIONS, deprecationWarning } from '../middlewares/apiVersion.mjs';

// Create a minimal test app that doesn't require MongoDB
const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // API versioning middleware
  app.use(apiVersionMiddleware);

  // Mock version endpoint (same as in v1/index.mjs)
  app.get('/api/v1/version', (req, res) => {
    res.json({
      success: true,
      data: {
        version: 'v1',
        current: true,
        deprecated: false,
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          tours: '/api/v1/tours',
          bookings: '/api/v1/bookings',
          coupons: '/api/v1/coupons',
        },
      },
    });
  });

  // Mock tours endpoint for testing
  app.get('/api/v1/tours', (req, res) => {
    res.json({ success: true, data: [] });
  });

  // Backward compatible tours endpoint
  app.get('/api/tours', (req, res) => {
    res.json({ success: true, data: [] });
  });

  return app;
};

// Test app instance
let app;

// Setup
beforeAll(() => {
  app = createTestApp();
});

// ========================================
// API Versioning Tests
// ========================================

describe('API Versioning', () => {
  describe('apiVersionMiddleware', () => {
    it('should set X-API-Version header in response', async () => {
      const response = await request(app)
        .get('/api/v1/version')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.headers['x-api-version']).toBe('v1');
    });

    it('should detect version from URL path', async () => {
      const response = await request(app)
        .get('/api/v1/version')
        .expect(200);

      expect(response.headers['x-api-version']).toBe('v1');
    });

    it('should detect version from api-version header when URL has no version', async () => {
      const response = await request(app)
        .get('/api/tours')
        .set('api-version', 'v2')
        .expect(200);

      expect(response.headers['x-api-version']).toBe('v2');
    });

    it('should default to current version when no version specified', async () => {
      const response = await request(app)
        .get('/api/tours')
        .expect(200);

      expect(response.headers['x-api-version']).toBe(API_VERSIONS.CURRENT);
    });

    it('should prioritize URL version over header version', async () => {
      const response = await request(app)
        .get('/api/v1/version')
        .set('api-version', 'v2')
        .expect(200);

      // URL version (v1) should take priority over header (v2)
      expect(response.headers['x-api-version']).toBe('v1');
    });

    it('should reject invalid version headers and default to current version', async () => {
      const response = await request(app)
        .get('/api/tours')
        .set('api-version', 'invalid-version')
        .expect(200);

      // Invalid version should be rejected, defaulting to current version
      expect(response.headers['x-api-version']).toBe(API_VERSIONS.CURRENT);
    });

    it('should reject unknown version and default to current version', async () => {
      const response = await request(app)
        .get('/api/tours')
        .set('api-version', 'v99')
        .expect(200);

      // Unknown version (v99) should be rejected, defaulting to current version
      expect(response.headers['x-api-version']).toBe(API_VERSIONS.CURRENT);
    });
  });

  describe('Version Info Endpoint', () => {
    it('GET /api/v1/version should return version information', async () => {
      const response = await request(app)
        .get('/api/v1/version')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('version', 'v1');
      expect(response.body.data).toHaveProperty('current', true);
      expect(response.body.data).toHaveProperty('deprecated', false);
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data.endpoints).toHaveProperty('auth', '/api/v1/auth');
      expect(response.body.data.endpoints).toHaveProperty('users', '/api/v1/users');
      expect(response.body.data.endpoints).toHaveProperty('tours', '/api/v1/tours');
      expect(response.body.data.endpoints).toHaveProperty('bookings', '/api/v1/bookings');
      expect(response.body.data.endpoints).toHaveProperty('coupons', '/api/v1/coupons');
    });
  });

  describe('Versioned Routes', () => {
    it('/api/v1/tours should work', async () => {
      const response = await request(app)
        .get('/api/v1/tours')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.headers['x-api-version']).toBe('v1');
    });

    it('/api/v1/version endpoint should work', async () => {
      const response = await request(app)
        .get('/api/v1/version')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.headers['x-api-version']).toBe('v1');
    });
  });

  describe('Backward Compatibility', () => {
    it('/api/tours should work (backward compatible with v1)', async () => {
      const response = await request(app)
        .get('/api/tours')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      // Default version should be applied
      expect(response.headers['x-api-version']).toBe(API_VERSIONS.CURRENT);
    });
  });

  describe('Deprecation Warning Middleware', () => {
    it('should add deprecation headers for deprecated versions', async () => {
      // Create a test app with deprecation warning
      const testApp = express();
      testApp.use(apiVersionMiddleware);
      testApp.use(deprecationWarning('v1', '2025-12-31'));
      testApp.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .get('/test')
        .set('api-version', 'v1')
        .expect(200);

      expect(response.headers['deprecation']).toBe('date="2025-12-31"');
      expect(response.headers['sunset']).toBe('2025-12-31');
      expect(response.headers['link']).toBe('</api/v2>; rel="successor-version"');
    });

    it('should not add deprecation headers for non-deprecated versions', async () => {
      // Create a test app with deprecation warning only for v1
      const testApp = express();
      testApp.use(apiVersionMiddleware);
      testApp.use(deprecationWarning('v1', '2025-12-31'));
      testApp.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .get('/test')
        .set('api-version', 'v2')
        .expect(200);

      expect(response.headers['deprecation']).toBeUndefined();
      expect(response.headers['sunset']).toBeUndefined();
    });
  });

  describe('API_VERSIONS constants', () => {
    it('should have correct version constants', () => {
      expect(API_VERSIONS.V1).toBe('v1');
      expect(API_VERSIONS.V2).toBe('v2');
      expect(API_VERSIONS.CURRENT).toBe('v1');
    });
  });
});
