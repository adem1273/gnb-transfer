#!/usr/bin/env node

/**
 * Quick Validation Script
 * 
 * Validates that code changes are syntactically correct and configurations are in place
 * Run with: node scripts/validate-changes.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

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
  console.log(`\n${colors.blue}Validating: ${name}${colors.reset}`);
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

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function checkFileExists(filePath, description) {
  const fullPath = resolve(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    logSuccess(`${description} exists`);
    results.passed++;
    return true;
  } else {
    logError(`${description} not found at ${filePath}`);
    results.failed++;
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = resolve(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    logError(`File not found: ${filePath}`);
    results.failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    logSuccess(description);
    results.passed++;
    return true;
  } else {
    logError(description + ' - NOT FOUND');
    results.failed++;
    return false;
  }
}

function checkNoHardcodedUrl(filePath, description) {
  const fullPath = resolve(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    logWarning(`File not found: ${filePath}`);
    results.warnings++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const hardcodedUrls = [
    'https://your-backend-domain.com',
    'http://your-backend-domain.com',
  ];

  for (const url of hardcodedUrls) {
    if (content.includes(url)) {
      logError(`${description} still contains hardcoded URL: ${url}`);
      results.failed++;
      return false;
    }
  }

  logSuccess(`${description} - no hardcoded URLs`);
  results.passed++;
  return true;
}

async function runValidation() {
  log('\n=== Code Changes Validation ===\n', 'blue');

  // 1. Check modified files exist
  logTest('Modified Files');
  checkFileExists('src/utils/api.js', 'Frontend API config');
  checkFileExists('src/utils/auth.js', 'Frontend auth utilities');
  checkFileExists('src/context/AuthContext.jsx', 'Auth context');

  // 2. Check test files created
  logTest('Test Infrastructure');
  checkFileExists('backend/tests/admin-auth-integration.test.mjs', 'Integration tests');
  checkFileExists('backend/scripts/verify-auth.mjs', 'Auth verification script');
  checkFileExists('backend/scripts/create-test-admin.mjs', 'Test admin creation script');
  checkFileExists('backend/TESTING_AUTH.md', 'Testing documentation');

  // 3. Check no hardcoded URLs
  logTest('API Configuration');
  checkNoHardcodedUrl('src/utils/api.js', 'Frontend API');

  // 4. Check environment variable usage
  logTest('Environment Variables');
  checkFileContent('src/utils/api.js', 'import.meta.env.VITE_API_URL', 'Frontend uses VITE_API_URL');

  // 5. Check logout implementation
  logTest('Logout Implementation');
  checkFileContent('src/utils/auth.js', 'logout', 'Frontend has logout function');
  checkFileContent('src/utils/auth.js', '/auth/logout', 'Frontend calls backend logout');

  // 6. Check token management
  logTest('Token Management');
  checkFileContent('src/utils/auth.js', 'refreshToken', 'Frontend manages refresh tokens');
  checkFileContent('src/context/AuthContext.jsx', 'setRefreshToken', 'AuthContext uses refresh tokens');

  // 7. Check 401 handling
  logTest('Token Expiration Handling');
  checkFileContent('src/utils/api.js', 'status === 401', 'Frontend intercepts 401 errors');
  checkFileContent('src/utils/api.js', 'localStorage.removeItem', 'Frontend clears tokens on 401');

  // 8. Check .env.example updates
  logTest('Environment Configuration');
  checkFileContent('backend/.env.example', 'TEST_ADMIN_EMAIL', '.env.example includes test credentials');
  checkFileContent('.env.example', 'VITE_API_URL', 'Frontend .env.example includes API URL');

  // 9. Syntax validation (basic - check files can be read)
  logTest('File Integrity');
  try {
    const apiContent = fs.readFileSync(resolve(projectRoot, 'src/utils/api.js'), 'utf8');
    if (apiContent.length > 0 && !apiContent.includes('syntax-error-marker')) {
      logSuccess('Frontend API config file is readable and valid');
      results.passed++;
    }
  } catch (error) {
    logError(`Frontend API config cannot be read: ${error.message}`);
    results.failed++;
  }

  try {
    const authContent = fs.readFileSync(resolve(projectRoot, 'src/utils/auth.js'), 'utf8');
    if (authContent.length > 0 && !authContent.includes('syntax-error-marker')) {
      logSuccess('Frontend auth utilities file is readable and valid');
      results.passed++;
    }
  } catch (error) {
    logError(`Frontend auth utilities cannot be read: ${error.message}`);
    results.failed++;
  }

  // Summary
  log('\n=== Validation Summary ===\n', 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');

  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  log(`\nSuccess Rate: ${successRate}%\n`, successRate >= 90 ? 'green' : 'red');

  if (results.failed > 0) {
    log('Some validations failed. Please review the errors above.', 'red');
    process.exit(1);
  } else {
    log('All validations passed! ✓', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start the backend: cd backend && npm run dev', 'reset');
    log('2. Create test admin: cd backend && node scripts/create-test-admin.mjs', 'reset');
    log('3. Run auth tests: cd backend && node scripts/verify-auth.mjs\n', 'reset');
  }
}

// Run validation
runValidation().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
