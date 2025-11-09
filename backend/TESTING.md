# API Testing Guide

## Quick Start

This guide explains how to run the automated API tests for the GNB Transfer backend.

### 1. Prerequisites

Before running tests, ensure you have:

- **Node.js 18+** installed
- **MongoDB** running locally or accessible via connection string

### 2. Start MongoDB

Choose one of these options:

#### Option A: Local MongoDB
```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

#### Option B: Docker
```bash
docker run -d -p 27017:27017 --name mongodb-test mongo:7
```

#### Option C: MongoDB Atlas
Update `backend/.env.test` with your Atlas connection string:
```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gnb-transfer-test
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Output

Successful test run looks like:

```
✓ Connected to test database
 PASS  tests/api.test.mjs
  Auth Endpoints
    POST /api/users/register
      ✓ should register a new user successfully (234ms)
      ✓ should reject registration with duplicate email (45ms)
      ✓ should reject registration with invalid email (23ms)
    POST /api/users/login
      ✓ should login successfully with correct credentials (156ms)
      ✓ should reject login with incorrect password (89ms)
  Booking Endpoints
    POST /api/bookings
      ✓ should create a new booking successfully (178ms)
    GET /api/bookings
      ✓ should list all bookings for admin user (67ms)
  Vehicle (Car) Endpoints
    GET /api/vehicles
      ✓ should list all vehicles for admin user (89ms)
    POST /api/vehicles
      ✓ should create a new vehicle for admin user (123ms)

✓ Test database cleaned
✓ Database connection closed

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        12.456 s
```

## Test Coverage

The test suite covers:

### Authentication (11 tests)
- ✅ User registration with validation
- ✅ Login with correct/incorrect credentials
- ✅ Token generation and storage
- ✅ Protected route access with tokens
- ✅ Permission enforcement (401/403 responses)

### Bookings (8 tests)
- ✅ Create bookings with validation
- ✅ List all bookings (admin only)
- ✅ Get specific booking details
- ✅ Amount calculation verification
- ✅ Tour existence validation

### Vehicles/Cars (8 tests)
- ✅ List vehicles (admin/manager only)
- ✅ Create vehicles with validation
- ✅ Filter vehicles by status/type
- ✅ Permission enforcement
- ✅ Required field validation

### Reviews (Documented)
- 📝 Review endpoints documented but marked as skipped
- 📝 Tests ready for when review feature is implemented

### Integration (2 tests)
- ✅ Complete booking flow (register → login → book)
- ✅ Admin workflow (create vehicle → list bookings)

### Error Handling (3 tests)
- ✅ Invalid endpoints (404)
- ✅ Malformed JSON
- ✅ Invalid MongoDB ObjectId

## Troubleshooting

### Connection Timeout

**Error**: `MongooseError: Operation timed out`

**Solution**:
1. Verify MongoDB is running: `systemctl status mongod` or `docker ps`
2. Check connection string in `backend/.env.test`
3. Test connection: `mongosh mongodb://localhost:27017/gnb-transfer-test`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
- Tests don't actually bind to a port (Supertest handles this)
- If you see this, check if backend server is running: `lsof -i :5000`

### Module Import Errors

**Error**: `Cannot use import statement outside a module`

**Solution**:
- Ensure `"type": "module"` is set in `backend/package.json`
- Test files should use `.mjs` extension
- Check `NODE_OPTIONS='--experimental-vm-modules'` in test script

### Tests Pass but No Database Connection

**Error**: Tests pass but database operations fail

**Solution**:
- Check if MongoDB is actually running
- Verify correct database URI in `.env.test`
- Look for connection errors in test output

## Understanding the Tests

### Automatic Token Management

The tests automatically handle authentication:

```javascript
// 1. Register creates a user and returns a token
const registerResponse = await request(app)
  .post('/api/users/register')
  .send({ name, email, password });

authToken = registerResponse.body.data.token;

// 2. Token is stored and reused
await request(app)
  .get('/api/bookings')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

### Test Data Isolation

- Each test run uses a fresh database
- Test database is automatically cleaned after tests
- No interference between test runs

### Response Assertions

Tests verify:
- HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Response structure (`success`, `data`, `error` fields)
- Data types and required fields
- Business logic (e.g., price calculations)

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/api-tests.yml`:

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
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run Tests
        run: |
          cd backend
          npm test
```

### Other CI Platforms

**GitLab CI**: Use `mongo:7` service
**CircleCI**: Use `circleci/mongo:7` image
**Jenkins**: Use Docker compose with MongoDB

## Writing New Tests

To add new endpoint tests:

1. Open `backend/tests/api.test.mjs`
2. Add a new `describe` block for your feature
3. Write test cases using the existing pattern

Example:

```javascript
describe('New Feature Endpoints', () => {
  describe('POST /api/feature', () => {
    it('should create a new feature successfully', async () => {
      const data = { name: 'Test Feature' };
      
      const response = await request(app)
        .post('/api/feature')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(data.name);
    });
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Test data is auto-cleaned, don't worry about leftovers
3. **Realistic Data**: Use realistic test data
4. **Clear Names**: Test names should explain what's being tested
5. **Both Cases**: Test success and failure scenarios

## Getting Help

- Check `backend/tests/README.md` for detailed documentation
- Review existing tests for examples
- Jest docs: https://jestjs.io/
- Supertest docs: https://github.com/ladjs/supertest

## Test File Structure

```
backend/
├── tests/
│   ├── api.test.mjs      # Main test suite (all tests here)
│   ├── setup.mjs         # Test environment setup
│   └── README.md         # Detailed test documentation
├── jest.config.mjs       # Jest configuration
├── .env.test             # Test environment variables
└── package.json          # Test scripts defined here
```

## Summary

✅ **30+ comprehensive tests** covering Auth, Bookings, Vehicles, and more  
✅ **Automatic token management** for protected endpoints  
✅ **Database isolation** with separate test database  
✅ **CI/CD ready** with example configurations  
✅ **Well documented** with troubleshooting guides  
✅ **Easy to extend** with clear patterns for new tests  

Run `npm test` in the backend directory to get started!
