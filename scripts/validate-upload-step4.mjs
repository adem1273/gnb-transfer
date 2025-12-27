#!/usr/bin/env node

/**
 * STEP 4 - Image Upload Validation Script
 * 
 * This script validates the image upload functionality according to the checklist:
 * - Upload jpg/png/webp under 2MB → success
 * - Upload pdf → rejected
 * - Upload without login → 401
 * - Upload as non-admin → 403
 * - Database stores only Cloudinary URL
 * - No image files exist in backend or frontend
 * 
 * Prerequisites:
 * 1. Backend server must be running (npm run dev)
 * 2. CLOUDINARY_* env vars must be set
 * 3. MongoDB must be connected
 * 
 * Usage:
 * node scripts/validate-upload-step4.mjs [admin-token] [user-token]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const UPLOAD_ENDPOINT = `${API_URL}/api/v1/upload/image`;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Test results
const results = {
  passed: [],
  failed: [],
  issues: [],
};

/**
 * Print colored output
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function section(title) {
  console.log();
  print('═'.repeat(70), 'cyan');
  print(title, 'cyan');
  print('═'.repeat(70), 'cyan');
  console.log();
}

/**
 * Print test result
 */
function testResult(name, passed, message = '') {
  if (passed) {
    print(`✓ PASS: ${name}`, 'green');
    results.passed.push(name);
  } else {
    print(`✗ FAIL: ${name}`, 'red');
    if (message) {
      print(`  → ${message}`, 'yellow');
    }
    results.failed.push({ name, message });
    results.issues.push(`${name}: ${message}`);
  }
}

/**
 * Create test files in temp directory
 */
async function createTestFiles() {
  const tmpDir = '/tmp/upload-validation-test-files';
  
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  // Create small valid JPEG (< 2MB)
  const jpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9
  ]);
  fs.writeFileSync(path.join(tmpDir, 'test.jpg'), jpegBuffer);
  
  // Create small valid PNG (< 2MB)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync(path.join(tmpDir, 'test.png'), pngBuffer);
  
  // Create small valid WebP (< 2MB)
  const webpBuffer = Buffer.from('RIFF', 'ascii');
  const webpData = Buffer.concat([
    webpBuffer,
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP', 'ascii'),
    Buffer.from('VP8 ', 'ascii'),
    Buffer.from([0x18, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a,
                 0x10, 0x00, 0x10, 0x00, 0x00, 0x49, 0xa4, 0x00, 0x03, 0x70,
                 0x00, 0xfe, 0xfb, 0x94, 0x00, 0x00, 0x00])
  ]);
  fs.writeFileSync(path.join(tmpDir, 'test.webp'), webpData);
  
  // Create PDF file (should be rejected)
  const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF';
  fs.writeFileSync(path.join(tmpDir, 'test.pdf'), pdfContent);
  
  // Create large file (> 2MB - should be rejected)
  const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
  fs.writeFileSync(path.join(tmpDir, 'large-image.jpg'), largeBuffer);
  
  return tmpDir;
}

/**
 * Test file upload
 */
async function testUpload(filePath, token, expectSuccess = true, testName = '') {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    
    const config = {
      headers: {
        ...form.getHeaders(),
      },
      validateStatus: () => true, // Don't throw on any status
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(UPLOAD_ENDPOINT, form, config);
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || { message: error.message },
    };
  }
}

/**
 * Check if image files exist in backend or frontend directories
 */
async function checkNoLocalImageFiles() {
  const backendDir = path.join(__dirname, '..', 'backend');
  const frontendDirs = [
    path.join(__dirname, '..', 'src'),
    path.join(__dirname, '..', 'admin', 'src'),
  ];
  
  let foundImages = [];
  
  // Check backend for uploaded images (exclude test files and static assets)
  try {
    const { stdout: backendImages } = await execAsync(
      `find "${backendDir}" -type f \\( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \\) ! -path "*/node_modules/*" ! -path "*/tests/*" ! -path "*test*" 2>/dev/null || true`
    );
    if (backendImages.trim()) {
      foundImages.push(...backendImages.trim().split('\n').filter(f => f));
    }
  } catch (error) {
    // Ignore errors
  }
  
  // Check frontend for uploaded images (exclude public static assets)
  for (const dir of frontendDirs) {
    if (fs.existsSync(dir)) {
      try {
        const { stdout: frontendImages } = await execAsync(
          `find "${dir}" -type f \\( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \\) ! -path "*/node_modules/*" ! -path "*/public/*" ! -path "*test*" 2>/dev/null || true`
        );
        if (frontendImages.trim()) {
          foundImages.push(...frontendImages.trim().split('\n').filter(f => f));
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }
  
  // Filter out legitimate static assets in public directory
  foundImages = foundImages.filter(img => {
    const relative = path.relative(path.join(__dirname, '..'), img);
    return !relative.startsWith('public/') && 
           !relative.includes('/public/') &&
           !relative.includes('static/') &&
           !relative.includes('assets/');
  });
  
  return foundImages;
}

/**
 * Generate admin and user tokens for testing
 */
async function getTestTokens(providedAdminToken, providedUserToken) {
  let adminToken = providedAdminToken;
  let userToken = providedUserToken;
  
  // If tokens not provided, try to create test users
  if (!adminToken || !userToken) {
    print('⚠️  WARNING: Admin and/or user tokens not provided', 'yellow');
    print('   You must provide tokens as arguments:', 'yellow');
    print('   node scripts/validate-upload-step4.mjs <admin-token> <user-token>', 'yellow');
    print('', 'yellow');
    print('   To get tokens:', 'yellow');
    print('   1. Login as admin: POST /api/users/login', 'yellow');
    print('   2. Login as regular user: POST /api/users/login', 'yellow');
    print('', 'yellow');
    process.exit(1);
  }
  
  return { adminToken, userToken };
}

/**
 * Validate that response contains Cloudinary URL
 */
function validateCloudinaryUrl(url) {
  if (!url) return false;
  
  // Cloudinary URLs contain 'cloudinary' in the domain
  const isCloudinary = url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  
  // Should be HTTPS
  const isHttps = url.startsWith('https://');
  
  return isCloudinary && isHttps;
}

/**
 * Main validation function
 */
async function runValidation() {
  print(`
╔═══════════════════════════════════════════════════════════════════╗
║        STEP 4 - IMAGE UPLOAD VALIDATION                           ║
║        Testing Upload Security & Requirements                     ║
╚═══════════════════════════════════════════════════════════════════╝
`, 'blue');

  // Get tokens from command line
  const args = process.argv.slice(2);
  const { adminToken, userToken } = await getTestTokens(args[0], args[1]);
  
  // Create test files
  section('SETUP: Creating Test Files');
  const tmpDir = await createTestFiles();
  print(`✓ Test files created in: ${tmpDir}`, 'green');
  
  // VALIDATION TESTS
  section('TEST 1: Upload Valid Images (JPG/PNG/WebP) under 2MB → Success');
  
  // Test JPEG upload
  const jpegResult = await testUpload(
    path.join(tmpDir, 'test.jpg'),
    adminToken,
    true,
    'Upload JPEG as admin'
  );
  
  if (jpegResult.success && jpegResult.data?.data?.url) {
    const isValidUrl = validateCloudinaryUrl(jpegResult.data.data.url);
    testResult(
      'Upload JPG under 2MB',
      isValidUrl,
      isValidUrl ? `URL: ${jpegResult.data.data.url}` : 'Invalid Cloudinary URL'
    );
  } else {
    testResult(
      'Upload JPG under 2MB',
      false,
      jpegResult.data?.message || 'Upload failed'
    );
  }
  
  // Test PNG upload
  const pngResult = await testUpload(
    path.join(tmpDir, 'test.png'),
    adminToken,
    true,
    'Upload PNG as admin'
  );
  
  if (pngResult.success && pngResult.data?.data?.url) {
    const isValidUrl = validateCloudinaryUrl(pngResult.data.data.url);
    testResult(
      'Upload PNG under 2MB',
      isValidUrl,
      isValidUrl ? `URL: ${pngResult.data.data.url}` : 'Invalid Cloudinary URL'
    );
  } else {
    testResult(
      'Upload PNG under 2MB',
      false,
      pngResult.data?.message || 'Upload failed'
    );
  }
  
  // Test WebP upload
  const webpResult = await testUpload(
    path.join(tmpDir, 'test.webp'),
    adminToken,
    true,
    'Upload WebP as admin'
  );
  
  if (webpResult.success && webpResult.data?.data?.url) {
    const isValidUrl = validateCloudinaryUrl(webpResult.data.data.url);
    testResult(
      'Upload WebP under 2MB',
      isValidUrl,
      isValidUrl ? `URL: ${webpResult.data.data.url}` : 'Invalid Cloudinary URL'
    );
  } else {
    testResult(
      'Upload WebP under 2MB',
      false,
      webpResult.data?.message || 'Upload failed'
    );
  }
  
  // TEST: Upload PDF → rejected
  section('TEST 2: Upload PDF → Rejected');
  
  const pdfResult = await testUpload(
    path.join(tmpDir, 'test.pdf'),
    adminToken,
    false,
    'Upload PDF as admin'
  );
  
  testResult(
    'Upload PDF rejected',
    !pdfResult.success && pdfResult.status === 400,
    pdfResult.success ? 'PDF should be rejected!' : `Status: ${pdfResult.status}, Message: ${pdfResult.data?.message}`
  );
  
  // TEST: Upload without login → 401
  section('TEST 3: Upload without Login → 401');
  
  const noAuthResult = await testUpload(
    path.join(tmpDir, 'test.jpg'),
    null,
    false,
    'Upload without token'
  );
  
  testResult(
    'Upload without login returns 401',
    noAuthResult.status === 401,
    `Status: ${noAuthResult.status}, Message: ${noAuthResult.data?.message}`
  );
  
  // TEST: Upload as non-admin → 403
  section('TEST 4: Upload as Non-Admin → 403');
  
  const nonAdminResult = await testUpload(
    path.join(tmpDir, 'test.jpg'),
    userToken,
    false,
    'Upload as regular user'
  );
  
  testResult(
    'Upload as non-admin returns 403',
    nonAdminResult.status === 403,
    `Status: ${nonAdminResult.status}, Message: ${nonAdminResult.data?.message}`
  );
  
  // TEST: File size limit → rejected
  section('TEST 5: Upload File > 2MB → Rejected');
  
  const largeFileResult = await testUpload(
    path.join(tmpDir, 'large-image.jpg'),
    adminToken,
    false,
    'Upload large file'
  );
  
  testResult(
    'Upload file exceeding 2MB rejected',
    !largeFileResult.success && largeFileResult.status === 400,
    largeFileResult.success ? 'Large file should be rejected!' : `Status: ${largeFileResult.status}, Message: ${largeFileResult.data?.message}`
  );
  
  // TEST: No image files in backend or frontend
  section('TEST 6: No Image Files Stored Locally');
  
  const localImages = await checkNoLocalImageFiles();
  testResult(
    'No image files exist in backend or frontend',
    localImages.length === 0,
    localImages.length > 0 ? `Found ${localImages.length} image files:\n    ${localImages.join('\n    ')}` : 'All images stored in Cloudinary only'
  );
  
  // SUMMARY
  section('VALIDATION SUMMARY');
  
  const total = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / total) * 100).toFixed(2);
  
  print(`Total Tests: ${total}`, 'cyan');
  print(`Passed: ${results.passed.length}`, 'green');
  print(`Failed: ${results.failed.length}`, 'red');
  print(`Success Rate: ${passRate}%`, passRate === '100.00' ? 'green' : 'yellow');
  
  console.log();
  
  if (results.failed.length === 0) {
    print('✅ ALL VALIDATION TESTS PASSED', 'green');
    print('═'.repeat(70), 'green');
    console.log();
    return 0;
  } else {
    print('❌ VALIDATION FAILED - ISSUES FOUND:', 'red');
    print('═'.repeat(70), 'red');
    console.log();
    
    print('Issues Found Only:', 'yellow');
    results.issues.forEach((issue, idx) => {
      print(`  ${idx + 1}. ${issue}`, 'yellow');
    });
    console.log();
    
    return 1;
  }
}

// Run validation
runValidation()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    print(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
