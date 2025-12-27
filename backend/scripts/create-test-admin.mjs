#!/usr/bin/env node

/**
 * Create Test Admin User Script
 * 
 * Creates or updates a test admin user for authentication testing
 * Run with: node scripts/create-test-admin.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const TEST_ADMIN = {
  name: 'Test Admin',
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  role: 'admin',
};

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

async function createTestAdmin() {
  try {
    log('\n=== Creating Test Admin User ===\n', 'blue');

    // Check MongoDB URI
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      log('Error: MONGO_URI not found in environment variables', 'red');
      log('Please set MONGO_URI in backend/.env file', 'yellow');
      process.exit(1);
    }

    log('Connecting to MongoDB...', 'blue');
    await mongoose.connect(mongoUri);
    log('✓ Connected to MongoDB', 'green');

    // Define User schema (minimal version for this script)
    const UserSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin', 'manager', 'driver'], default: 'user' },
      createdAt: { type: Date, default: Date.now },
    });

    // Check if model exists to avoid recompilation error
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if user already exists
    const existingUser = await User.findOne({ email: TEST_ADMIN.email });

    if (existingUser) {
      log(`User with email ${TEST_ADMIN.email} already exists`, 'yellow');
      log('Updating password and role...', 'blue');

      // Hash new password
      const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 10);

      // Update user
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.name = TEST_ADMIN.name;
      await existingUser.save();

      log('✓ Test admin user updated successfully', 'green');
    } else {
      log('Creating new test admin user...', 'blue');

      // Hash password
      const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 10);

      // Create user
      await User.create({
        name: TEST_ADMIN.name,
        email: TEST_ADMIN.email,
        password: hashedPassword,
        role: 'admin',
      });

      log('✓ Test admin user created successfully', 'green');
    }

    // Display credentials
    log('\n=== Test Admin Credentials ===', 'blue');
    log(`Email: ${TEST_ADMIN.email}`, 'green');
    log(`Password: ${TEST_ADMIN.password}`, 'green');
    log(`Role: admin`, 'green');

    log('\nYou can now use these credentials to:', 'blue');
    log('  1. Login to the admin panel', 'reset');
    log('  2. Run authentication tests', 'reset');
    log('  3. Test protected routes', 'reset');

    log('\nTo verify, run: node scripts/verify-auth.mjs\n', 'yellow');

    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'blue');
    process.exit(0);
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createTestAdmin();
