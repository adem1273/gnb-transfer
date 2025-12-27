#!/usr/bin/env node

/**
 * Manual Validation Script for Global Settings API
 *
 * This script validates the Global Settings implementation by:
 * 1. Starting a test server
 * 2. Creating test users (admin, manager, regular user)
 * 3. Testing read/write permissions
 * 4. Testing data persistence
 * 5. Testing validation errors
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Import models
import User from './models/User.mjs';
import GlobalSettings from './models/GlobalSettings.mjs';

// Import middleware
import { responseMiddleware } from './middlewares/response.mjs';

// Import routes
import globalSettingsRoutes from './routes/globalSettingsRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';

const PORT = 5555; // Use a different port for testing
const BASE_URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log('green', `✓ ${name}`);
  } else {
    results.failed++;
    log('red', `✗ ${name}`);
    if (details) {
      log('red', `  ${details}`);
    }
  }
}

// Create test server
function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/users', userRoutes);
  app.use('/api/admin/global-settings', globalSettingsRoutes);
  return app;
}

async function main() {
  log('blue', '\n=== Global Settings API Validation ===\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    log('red', 'Error: MONGO_URI not set in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    log('green', '✓ Connected to MongoDB');
  } catch (error) {
    log('red', `✗ Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  // Clear test data
  try {
    await User.deleteMany({ email: { $regex: /@validation-test\.com$/ } });
    await GlobalSettings.deleteMany({ key: 'global' });
    log('green', '✓ Cleared test data');
  } catch (error) {
    log('yellow', `Warning: Could not clear test data: ${error.message}`);
  }

  // Start test server
  const app = createTestServer();
  const server = app.listen(PORT);
  log('green', `✓ Test server started on port ${PORT}\n`);

  let adminToken, managerToken, userToken;

  try {
    // Create test users
    log('blue', '--- Creating Test Users ---');
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@validation-test.com',
      password: 'password123',
      role: 'admin',
    });
    recordTest('Create admin user', true);

    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@validation-test.com',
      password: 'password123',
      role: 'manager',
    });
    recordTest('Create manager user', true);

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@validation-test.com',
      password: 'password123',
      role: 'user',
    });
    recordTest('Create regular user', true);

    // Login users
    log('blue', '\n--- Logging In Users ---');
    
    const adminLogin = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'admin@validation-test.com',
      password: 'password123',
    });
    adminToken = adminLogin.data.data.token;
    recordTest('Admin login', !!adminToken);

    const managerLogin = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'manager@validation-test.com',
      password: 'password123',
    });
    managerToken = managerLogin.data.data.token;
    recordTest('Manager login', !!managerToken);

    const userLogin = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'user@validation-test.com',
      password: 'password123',
    });
    userToken = userLogin.data.data.token;
    recordTest('User login', !!userToken);

    // Test READ permissions
    log('blue', '\n--- Testing READ Permissions ---');

    try {
      const response = await axios.get(`${BASE_URL}/api/admin/global-settings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      recordTest(
        'Admin can read settings',
        response.status === 200 && response.data.success === true
      );
    } catch (error) {
      recordTest('Admin can read settings', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/admin/global-settings`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      recordTest(
        'Manager can read settings',
        response.status === 200 && response.data.success === true
      );
    } catch (error) {
      recordTest('Manager can read settings', false, error.message);
    }

    try {
      await axios.get(`${BASE_URL}/api/admin/global-settings`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      recordTest('Regular user denied read access', false, 'User should be denied');
    } catch (error) {
      recordTest('Regular user denied read access', error.response?.status === 403);
    }

    try {
      await axios.get(`${BASE_URL}/api/admin/global-settings`);
      recordTest('Unauthorized denied read access', false, 'Should be denied');
    } catch (error) {
      recordTest('Unauthorized denied read access', error.response?.status === 401);
    }

    // Test WRITE permissions
    log('blue', '\n--- Testing WRITE Permissions ---');

    const testUpdate = {
      siteName: 'Test Site',
      currency: 'EUR',
    };

    try {
      const response = await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        testUpdate,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      recordTest(
        'Admin can update settings',
        response.status === 200 && response.data.data.siteName === 'Test Site'
      );
    } catch (error) {
      recordTest('Admin can update settings', false, error.message);
    }

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { siteName: 'Manager Update' },
        { headers: { Authorization: `Bearer ${managerToken}` } }
      );
      recordTest('Manager denied write access', false, 'Manager should be denied');
    } catch (error) {
      recordTest('Manager denied write access', error.response?.status === 403);
    }

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { siteName: 'User Update' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      recordTest('Regular user denied write access', false, 'User should be denied');
    } catch (error) {
      recordTest('Regular user denied write access', error.response?.status === 403);
    }

    // Test DATA PERSISTENCE
    log('blue', '\n--- Testing Data Persistence ---');

    const updateData = {
      siteName: 'Persistent Site',
      contactEmail: 'test@persistent.com',
      currency: 'GBP',
      defaultLanguage: 'es',
      featureFlags: {
        enableBookings: false,
        enablePayments: true,
      },
    };

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        updateData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const response = await axios.get(`${BASE_URL}/api/admin/global-settings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = response.data.data;
      recordTest(
        'Data persists after update',
        data.siteName === 'Persistent Site' &&
          data.contactEmail === 'test@persistent.com' &&
          data.currency === 'GBP' &&
          data.defaultLanguage === 'es'
      );
    } catch (error) {
      recordTest('Data persists after update', false, error.message);
    }

    // Test VALIDATION
    log('blue', '\n--- Testing Validation ---');

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { contactEmail: 'invalid-email' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      recordTest('Invalid email rejected', false, 'Should reject invalid email');
    } catch (error) {
      recordTest('Invalid email rejected', error.response?.status === 400);
    }

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { currency: 'INVALID' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      recordTest('Invalid currency rejected', false, 'Should reject invalid currency');
    } catch (error) {
      recordTest('Invalid currency rejected', error.response?.status === 400);
    }

    try {
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { defaultLanguage: 'invalid' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      recordTest('Invalid language rejected', false, 'Should reject invalid language');
    } catch (error) {
      recordTest('Invalid language rejected', error.response?.status === 400);
    }

    // Test SINGLE-DOCUMENT pattern
    log('blue', '\n--- Testing Single-Document Pattern ---');

    try {
      // Multiple reads and updates
      await axios.get(`${BASE_URL}/api/admin/global-settings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      await axios.put(
        `${BASE_URL}/api/admin/global-settings`,
        { siteName: 'Single Doc Test' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const count = await GlobalSettings.countDocuments();
      recordTest('Only one settings document exists', count === 1);

      const settings = await GlobalSettings.findOne();
      recordTest('Latest data is stored', settings.siteName === 'Single Doc Test');
    } catch (error) {
      recordTest('Single-document pattern works', false, error.message);
    }

  } catch (error) {
    log('red', `\nUnexpected error: ${error.message}`);
    console.error(error);
  } finally {
    // Cleanup
    log('blue', '\n--- Cleanup ---');
    try {
      await User.deleteMany({ email: { $regex: /@validation-test\.com$/ } });
      await GlobalSettings.deleteMany({ key: 'global' });
      log('green', '✓ Test data cleaned up');
    } catch (error) {
      log('yellow', `Warning: Could not clean up test data: ${error.message}`);
    }

    server.close();
    await mongoose.connection.close();
  }

  // Print summary
  log('blue', '\n=== Test Summary ===');
  log('green', `Passed: ${results.passed}`);
  log('red', `Failed: ${results.failed}`);
  log('blue', `Total: ${results.passed + results.failed}\n`);

  if (results.failed > 0) {
    log('yellow', 'Failed tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => log('red', `  - ${t.name}`));
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
