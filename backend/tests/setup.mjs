/* eslint-disable no-underscore-dangle */

/**
 * Jest test setup file
 *
 * This file runs before all tests and sets up the test environment
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, '..', '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-for-automated-tests';
}
