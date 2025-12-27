#!/usr/bin/env node

/**
 * Auth Verification Script
 * 
 * Tests authentication flow, logout, and API configuration in a running environment
 * Run with: node scripts/verify-auth.mjs
 */

import axios from 'axios';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function runTests() {
  log('\n=== Admin Authentication Verification ===\n', 'blue');
  log(`API Base URL: ${API_BASE_URL}\n`);

  let accessToken = null;
  let refreshToken = null;

  // Test 1: API Reachability
  logTest('API Reachability');
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    logSuccess('API server is reachable');
    results.passed++;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Cannot connect to API server. Is the backend running?');
      logWarning(`Expected URL: ${API_BASE_URL.replace('/api', '')}/health`);
      results.failed++;
      return; // Can't continue without backend
    } else {
      logWarning('Health endpoint not found (non-critical)');
      results.warnings++;
    }
  }

  // Test 2: Login with Admin Credentials
  logTest('Admin Login');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      logSuccess('Admin login successful');
      logSuccess(`User role: ${response.data.data.user.role}`);
      results.passed++;
    } else {
      logError('Login response missing required fields');
      results.failed++;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    logWarning('Make sure test admin user exists with correct credentials');
    results.failed++;
    return; // Can't continue without token
  }

  // Test 3: Access Protected Admin Route
  logTest('Access Protected Admin Route');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      logSuccess('Successfully accessed admin stats endpoint');
      logSuccess(`Total users: ${response.data.data.totalUsers}`);
      results.passed++;
    } else {
      logError('Admin stats request failed');
      results.failed++;
    }
  } catch (error) {
    logError(`Admin route access failed: ${error.response?.data?.error || error.message}`);
    results.failed++;
  }

  // Test 4: Attempt Access Without Token
  logTest('Reject Unauthenticated Request');
  try {
    await axios.get(`${API_BASE_URL}/admin/stats`);
    logError('Admin route should reject unauthenticated requests');
    results.failed++;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Admin route correctly rejects unauthenticated requests');
      results.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      results.failed++;
    }
  }

  // Test 5: Attempt Access with Invalid Token
  logTest('Reject Invalid Token');
  try {
    await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });
    logError('Admin route should reject invalid tokens');
    results.failed++;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Admin route correctly rejects invalid tokens');
      results.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      results.failed++;
    }
  }

  // Test 6: Refresh Token
  if (refreshToken) {
    logTest('Refresh Token');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken,
      });

      if (response.data.success && response.data.data.accessToken) {
        logSuccess('Token refresh successful');
        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;
        
        // Update tokens for logout test
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
        
        results.passed++;
      } else {
        logError('Token refresh response missing required fields');
        results.failed++;
      }
    } catch (error) {
      logError(`Token refresh failed: ${error.response?.data?.error || error.message}`);
      results.failed++;
    }
  }

  // Test 7: Logout
  logTest('Logout and Token Revocation');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      { refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      logSuccess('Logout successful');
      results.passed++;
    } else {
      logError('Logout failed');
      results.failed++;
    }
  } catch (error) {
    logError(`Logout failed: ${error.response?.data?.error || error.message}`);
    results.failed++;
  }

  // Test 8: Verify Token Revocation
  if (refreshToken) {
    logTest('Verify Refresh Token is Revoked');
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken,
      });
      logError('Revoked refresh token should not work');
      results.failed++;
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Revoked refresh token correctly rejected');
        results.passed++;
      } else {
        logError(`Unexpected error: ${error.message}`);
        results.failed++;
      }
    }
  }

  // Test 9: Verify Access Token is Invalid After Logout
  logTest('Verify Access Token Behavior After Logout');
  try {
    // Note: Access tokens remain valid until expiration even after logout
    // This is expected JWT behavior - only refresh tokens are revoked
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (response.data.success) {
      logWarning('Access token still valid (expected - JWTs are stateless)');
      logWarning('Access tokens expire after 15 minutes');
      results.warnings++;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Access token rejected after logout');
      results.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      results.failed++;
    }
  }

  // Test 10: API Configuration Check
  logTest('API Configuration');
  if (API_BASE_URL.includes('localhost')) {
    logWarning('Using localhost - ensure VITE_API_URL is set for production');
    results.warnings++;
  } else {
    logSuccess(`Configured API URL: ${API_BASE_URL}`);
    results.passed++;
  }

  // Summary
  log('\n=== Test Summary ===\n', 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');

  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  log(`\nSuccess Rate: ${successRate}%\n`, successRate >= 80 ? 'green' : 'red');

  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
