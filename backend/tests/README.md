# API Tests for GNB Transfer Backend

This directory contains automated API tests for the GNB Transfer backend using Jest and Supertest.

## Test Coverage

The test suite covers the following API endpoints, aligned with the shared Postman Collection:

### 1. **Authentication (Auth)**
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- Token usage validation on protected routes

### 2. **Bookings**
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - List all bookings (admin)
- `GET /api/bookings/:id` - Get specific booking details (admin)

### 3. **Vehicles (Cars)**
- `GET /api/vehicles` - List all vehicles (admin/manager only)
- `POST /api/vehicles` - Add a new vehicle (admin/manager only)

### 4. **Reviews**
- Review endpoints are documented but marked as `skip` pending implementation
- Tests serve as documentation for expected behavior

## Setup

### Prerequisites

1. **MongoDB**: Ensure MongoDB is running locally or update `.env.test` with your MongoDB connection string
2. **Node.js**: Version 18 or higher (as specified in package.json)

### Prerequisites

1. **MongoDB**: Ensure MongoDB is running locally or use Docker
   - Local: `sudo systemctl start mongod` (Linux) or `brew services start mongodb-community` (macOS)
   - Docker: `docker run -d -p 27017:27017 --name mongodb-test mongo:7`
   - Or update `.env.test` with your MongoDB Atlas connection string
2. **Node.js**: Version 18 or higher (as specified in package.json)

### Installation

Dependencies are already installed if you ran `npm install` in the backend directory. The test dependencies include:
- `jest` - Test framework
- `supertest` - HTTP assertions library
- `@jest/globals` - Jest ES Module support

### Environment Configuration

Test environment variables are configured in `.env.test`. The test suite connects to a MongoDB database specified in the configuration.

Key settings in `.env.test`:

```env
NODE_ENV=test
PORT=5001
MONGO_URI=mongodb://localhost:27017/gnb-transfer-test
JWT_SECRET=test-jwt-secret-key-for-automated-testing
```

⚠️ **Important**: The test suite uses a separate test database (`gnb-transfer-test`) to avoid affecting development/production data. The database is automatically cleaned after each test run.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test Suite
```bash
npm test -- --testNamePattern="Auth Endpoints"
npm test -- --testNamePattern="Booking Endpoints"
npm test -- --testNamePattern="Vehicle"
```

## Test Features

### Automatic Token Management

The test suite automatically:
1. Registers test users (regular and admin)
2. Logs in and stores authentication tokens
3. Uses tokens for protected endpoints
4. Tests both authenticated and unauthenticated scenarios

Example:
```javascript
// Token is stored after login
const response = await request(app)
  .post('/api/users/login')
  .send({ email, password });

authToken = response.body.data.token;

// Token is used in subsequent requests
await request(app)
  .get('/api/bookings')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

### Test Data Isolation

- Each test run creates fresh test data
- Test database is cleaned after all tests complete
- No test data pollution between runs

### Comprehensive Assertions

Tests verify:
- HTTP status codes
- Response structure (`success`, `data`, `error` fields)
- Data types and required fields
- Business logic (e.g., booking amount calculation)
- Authentication and authorization
- Error handling

## Test Structure

```
tests/
├── api.test.mjs          # Main API test suite
├── setup.mjs             # Test environment setup
└── README.md             # This file

Configuration:
├── jest.config.mjs       # Jest configuration for ES modules
└── .env.test             # Test environment variables
```

## Writing New Tests

### Example Test Structure

```javascript
describe('Feature Name', () => {
  describe('POST /api/endpoint', () => {
    it('should perform expected action successfully', async () => {
      const testData = {
        field1: 'value1',
        field2: 'value2',
      };
      
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('field1', testData.field1);
    });
    
    it('should reject invalid requests', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
```

## Troubleshooting

### Tests Failing to Connect to Database

**Issue**: `MongooseError: Operation timed out` or connection failures

**Solution**: 
- Ensure MongoDB is running:
  - Local: `sudo systemctl start mongod` (Linux) or `brew services start mongodb-community` (macOS)
  - Docker: `docker run -d -p 27017:27017 mongo:7`
- Check MongoDB connection string in `.env.test`
- Verify network connectivity to MongoDB
- For CI/CD: Use MongoDB service in your pipeline or MongoDB Atlas connection string

### Tests Timeout

**Issue**: Tests exceed 30-second timeout

**Solution**:
- Check if MongoDB is responding slowly
- Increase timeout in `jest.config.mjs` if needed
- Ensure no infinite loops or blocking operations

### ES Module Import Errors

**Issue**: `SyntaxError: Cannot use import statement outside a module`

**Solution**:
- Ensure all test files use `.mjs` extension
- Verify `NODE_OPTIONS='--experimental-vm-modules'` is set in test script
- Check that `"type": "module"` is set in `package.json`

### Port Already in Use

**Issue**: Test server fails to start on port 5001

**Solution**:
- Tests create an in-memory Express app and don't actually bind to a port with Supertest
- If you see this error, check if another process is using the port or if you're trying to run the actual server during tests

## Test Maintenance

### Adding New Endpoints

When adding new API endpoints:

1. Add tests to appropriate `describe` block in `api.test.mjs`
2. Include tests for:
   - Success scenarios
   - Authentication/authorization
   - Validation errors
   - Edge cases
3. Update this README if adding a new feature category

### Updating Existing Tests

- Update tests when changing API response structure
- Add new test cases when adding validation rules
- Keep assertions aligned with actual API behavior

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines. You'll need to provide a MongoDB instance.

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run API Tests
        run: |
          cd backend
          npm test
        env:
          MONGO_URI: mongodb://localhost:27017/gnb-transfer-test
          JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
```

### Alternative: Using MongoDB Atlas for Tests

Update `.env.test` with a MongoDB Atlas connection string:

```env
MONGO_URI=mongodb+srv://test-user:test-password@cluster.mongodb.net/gnb-transfer-test?retryWrites=true&w=majority
```

**Note**: For CI/CD with MongoDB Atlas, store the connection string as a secret.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Test data is automatically cleaned up after tests complete
3. **Realistic Data**: Use realistic test data that matches production scenarios
4. **Clear Naming**: Test descriptions should clearly state what is being tested
5. **Comprehensive**: Test both success and failure cases
6. **Fast**: Keep tests fast by mocking external services when appropriate

## Contributing

When contributing new tests:

1. Follow existing test structure and naming conventions
2. Add descriptive test names that explain what is being tested
3. Include both positive and negative test cases
4. Update this README with any new test categories or features
5. Ensure all tests pass before submitting PR

## Support

For issues or questions about the test suite:
1. Check this README for troubleshooting tips
2. Review existing tests for examples
3. Check Jest documentation: https://jestjs.io/
4. Check Supertest documentation: https://github.com/ladjs/supertest
