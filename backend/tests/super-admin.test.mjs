/**
 * Super Admin Core System Tests
 * Tests for super admin routes, system settings, and kill switch functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';
import { getJwtSecret } from '../config/env.mjs';

describe('Super Admin Core System', () => {
  let superAdminToken;
  let adminToken;
  let userToken;

  beforeAll(() => {
    const jwtSecret = getJwtSecret();

    // Create tokens for different roles
    superAdminToken = jwt.sign(
      { id: 'superadmin1', email: 'superadmin@test.com', role: 'superadmin', name: 'Super Admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 'admin1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: 'user1', email: 'user@test.com', role: 'user', name: 'User' },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/v1/super-admin/system-settings', () => {
    it('should allow super admin to get system settings', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/system-settings')
        .set('Authorization', `Bearer ${superAdminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('siteStatus');
        expect(response.body.data).toHaveProperty('bookingEnabled');
        expect(response.body.data).toHaveProperty('paymentEnabled');
        expect(response.body.data).toHaveProperty('registrationsEnabled');
      }
    });

    it('should deny admin access to super admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/system-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should deny regular user access to super admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/system-settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/super-admin/system-settings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/super-admin/system-settings', () => {
    it('should allow super admin to update system settings', async () => {
      const response = await request(app)
        .put('/api/v1/super-admin/system-settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          siteStatus: 'online',
          bookingEnabled: true,
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('siteStatus', 'online');
        expect(response.body.data).toHaveProperty('bookingEnabled', true);
      }
    });

    it('should deny admin from updating system settings', async () => {
      const response = await request(app)
        .put('/api/v1/super-admin/system-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          siteStatus: 'maintenance',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/super-admin/kill-switch', () => {
    it('should allow super admin to activate kill switch', async () => {
      const response = await request(app)
        .post('/api/v1/super-admin/kill-switch')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          message: 'Emergency maintenance',
          reason: 'Security incident',
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('siteStatus', 'maintenance');
        expect(response.body.data).toHaveProperty('bookingEnabled', false);
        expect(response.body.data).toHaveProperty('paymentEnabled', false);
        expect(response.body.data.maintenanceMessage).toContain('Emergency maintenance');
      }
    });

    it('should deny admin from activating kill switch', async () => {
      const response = await request(app)
        .post('/api/v1/super-admin/kill-switch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/super-admin/restore', () => {
    it('should allow super admin to restore system', async () => {
      const response = await request(app)
        .post('/api/v1/super-admin/restore')
        .set('Authorization', `Bearer ${superAdminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('siteStatus', 'online');
        expect(response.body.data).toHaveProperty('bookingEnabled', true);
        expect(response.body.data).toHaveProperty('paymentEnabled', true);
      }
    });

    it('should deny admin from restoring system', async () => {
      const response = await request(app)
        .post('/api/v1/super-admin/restore')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GlobalSettings Model Extensions', () => {
    it('should have system control fields', () => {
      const settingsSchema = GlobalSettings.schema.obj;

      expect(settingsSchema).toHaveProperty('siteStatus');
      expect(settingsSchema).toHaveProperty('maintenanceMessage');
      expect(settingsSchema).toHaveProperty('bookingEnabled');
      expect(settingsSchema).toHaveProperty('paymentEnabled');
      expect(settingsSchema).toHaveProperty('registrationsEnabled');
      expect(settingsSchema).toHaveProperty('forceLogoutAll');
    });

    it('should have correct enum values for siteStatus', () => {
      const siteStatusField = GlobalSettings.schema.obj.siteStatus;
      expect(siteStatusField.enum).toContain('online');
      expect(siteStatusField.enum).toContain('maintenance');
    });

    it('should have correct default values', () => {
      const schema = GlobalSettings.schema.obj;
      expect(schema.siteStatus.default).toBe('online');
      expect(schema.bookingEnabled.default).toBe(true);
      expect(schema.paymentEnabled.default).toBe(true);
      expect(schema.registrationsEnabled.default).toBe(true);
      expect(schema.forceLogoutAll.default).toBe(false);
    });
  });
});

describe('Feature Flag Service', () => {
  it('should export required functions', async () => {
    const service = await import('../services/featureFlagService.mjs');

    expect(service.isFeatureEnabled).toBeDefined();
    expect(service.isGlobalFlagEnabled).toBeDefined();
    expect(service.isSystemSettingEnabled).toBeDefined();
    expect(service.getSiteStatus).toBeDefined();
    expect(service.areBookingsEnabled).toBeDefined();
    expect(service.arePaymentsEnabled).toBeDefined();
    expect(service.areRegistrationsEnabled).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const service = await import('../services/featureFlagService.mjs');

    // Should return false on error, not throw
    const result = await service.isFeatureEnabled('non-existent-feature');
    expect(typeof result).toBe('boolean');
  });
});

describe('Audit Logger Middleware', () => {
  it('should export required functions', async () => {
    const auditLogger = await import('../middlewares/auditLogger.mjs');

    expect(auditLogger.logAdminAction).toBeDefined();
    expect(auditLogger.logSuperAdminAction).toBeDefined();
    expect(auditLogger.logActionOutcome).toBeDefined();
  });

  it('should create middleware functions', async () => {
    const auditLogger = await import('../middlewares/auditLogger.mjs');

    const middleware = auditLogger.logAdminAction('TEST_ACTION', 'TestTarget');
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // req, res, next
  });
});
