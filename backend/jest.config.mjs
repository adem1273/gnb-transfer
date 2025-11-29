export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/__tests__/**/*.mjs', '**/*.test.mjs'],
  collectCoverageFrom: [
    'services/**/*.mjs',
    'routes/**/*.mjs',
    'models/**/*.mjs',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  },
  setupFilesAfterEnv: ['./tests/setup.mjs'],
  testTimeout: 30000,
  verbose: true
};
