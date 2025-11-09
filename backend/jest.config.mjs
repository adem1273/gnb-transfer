/**
 * Jest configuration for ES Modules
 *
 * This configuration enables Jest to work with ES modules in the GNB Transfer backend
 */

export default {
  // Use node environment for testing
  testEnvironment: 'node',

  // Transform ES modules
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'mjs', 'json'],

  // Test match patterns
  testMatch: ['**/tests/**/*.test.mjs', '**/tests/**/*.test.js'],

  // Coverage settings
  collectCoverageFrom: [
    'routes/**/*.mjs',
    'models/**/*.mjs',
    'middlewares/**/*.mjs',
    '!**/node_modules/**',
    '!**/tests/**',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.mjs'],

  // Timeout for tests (30 seconds for API calls)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,
};
