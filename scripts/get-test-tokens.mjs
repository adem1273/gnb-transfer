#!/usr/bin/env node

/**
 * Helper Script - Get Auth Tokens for Testing
 * 
 * This script helps you get admin and user tokens for validation testing.
 * 
 * Prerequisites:
 * 1. Backend server must be running
 * 2. Database must be connected
 * 
 * Usage:
 * node scripts/get-test-tokens.mjs
 */

import http from 'http';

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const defaultPort = parsedUrl.protocol === 'https:' ? 443 : 80;
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || defaultPort,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    let bodyData = null;
    if (options.body) {
      bodyData = JSON.stringify(options.body);
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function getTokens() {
  print('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  print('║     Get Test Tokens for Upload Validation                ║', 'cyan');
  print('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  // Check server health
  print('Checking server health...', 'cyan');
  try {
    const healthResponse = await makeRequest(`${API_URL}/api/health`);
    if (healthResponse.status !== 200) {
      print('❌ Server is not responding. Please start the backend server.', 'red');
      print('   Run: cd backend && npm run dev', 'yellow');
      process.exit(1);
    }
    print('✓ Server is running\n', 'green');
  } catch (error) {
    print('❌ Cannot connect to server. Please start the backend server.', 'red');
    print('   Run: cd backend && npm run dev', 'yellow');
    process.exit(1);
  }

  print('═'.repeat(60), 'cyan');
  print('INSTRUCTIONS:', 'cyan');
  print('═'.repeat(60), 'cyan');
  print('', 'reset');
  print('1. You need to provide credentials for:', 'yellow');
  print('   - An ADMIN user (with admin role)', 'yellow');
  print('   - A REGULAR user (with user role)', 'yellow');
  print('', 'reset');
  print('2. If you don\'t have test users, create them:', 'yellow');
  print('   - POST /api/users/register', 'yellow');
  print('   - Then update their role in database (admin user)', 'yellow');
  print('', 'reset');
  print('3. This script will attempt to login with provided credentials', 'yellow');
  print('   and return the JWT tokens needed for validation.', 'yellow');
  print('', 'reset');

  // Check if we can list users to suggest existing ones
  try {
    const usersResponse = await makeRequest(`${API_URL}/api/users`);
    if (usersResponse.status === 200 && usersResponse.data?.data) {
      print('Available test users you can try:', 'cyan');
      usersResponse.data.data.slice(0, 5).forEach(user => {
        print(`   - ${user.email} (${user.role})`, 'cyan');
      });
      print('', 'reset');
    }
  } catch (error) {
    // Ignore errors
  }

  print('═'.repeat(60), 'cyan');
  print('OPTION 1: Login with Existing Credentials', 'cyan');
  print('═'.repeat(60), 'cyan');
  print('', 'reset');
  print('To get tokens, you can manually login:', 'yellow');
  print('', 'reset');
  print('Admin Token:', 'green');
  print(`  curl -X POST ${API_URL}/api/users/login \\`, 'cyan');
  print(`    -H "Content-Type: application/json" \\`, 'cyan');
  print(`    -d '{"email": "admin@example.com", "password": "your-password"}'`, 'cyan');
  print('', 'reset');
  print('User Token:', 'green');
  print(`  curl -X POST ${API_URL}/api/users/login \\`, 'cyan');
  print(`    -H "Content-Type: application/json" \\`, 'cyan');
  print(`    -d '{"email": "user@example.com", "password": "your-password"}'`, 'cyan');
  print('', 'reset');

  print('═'.repeat(60), 'cyan');
  print('OPTION 2: Create Test Users', 'cyan');
  print('═'.repeat(60), 'cyan');
  print('', 'reset');
  print('Create admin user:', 'green');
  print(`  curl -X POST ${API_URL}/api/users/register \\`, 'cyan');
  print(`    -H "Content-Type: application/json" \\`, 'cyan');
  print(`    -d '{"name": "Test Admin", "email": "testadmin@test.com", "password": "Admin123!@#"}'`, 'cyan');
  print('', 'reset');
  print('Create regular user:', 'green');
  print(`  curl -X POST ${API_URL}/api/users/register \\`, 'cyan');
  print(`    -H "Content-Type: application/json" \\`, 'cyan');
  print(`    -d '{"name": "Test User", "email": "testuser@test.com", "password": "User123!@#"}'`, 'cyan');
  print('', 'reset');
  print('⚠️  NOTE: You\'ll need to update the admin user\'s role in the database:', 'yellow');
  print('  1. Connect to MongoDB', 'yellow');
  print('  2. Find the user: db.users.findOne({email: "testadmin@test.com"})', 'yellow');
  print('  3. Update role: db.users.updateOne({email: "testadmin@test.com"}, {$set: {role: "admin"}})', 'yellow');
  print('', 'reset');

  print('═'.repeat(60), 'cyan');
  print('Once you have the tokens, run validation with:', 'cyan');
  print('═'.repeat(60), 'cyan');
  print('', 'reset');
  print('  node scripts/validate-upload-step4.mjs <admin-token> <user-token>', 'green');
  print('', 'reset');
}

getTokens().catch(error => {
  print(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
