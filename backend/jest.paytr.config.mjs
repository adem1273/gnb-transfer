// Jest config for unit tests that don't require MongoDB
export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/tests/services/paytrService.test.mjs'],
  testTimeout: 30000,
  verbose: true,
  // Don't use the global setup that requires MongoDB
  setupFilesAfterEnv: [],
};
