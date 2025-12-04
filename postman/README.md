# GNB Transfer - Admin Feature Toggle Suite Postman Collection

## Overview
This Postman collection contains comprehensive tests for the GNB Transfer admin panel feature toggle system. It includes tests for all five new features with their specific assertions as defined in the requirements.

## Features Tested

### 1. Fleet Tracking (B2_BookingRoutes)
- **Endpoint**: `GET /api/admin/fleet/live`
- **Test**: Verifies that fleet location data exists in the response
- **Assertion**: `pm.test('Fleet location exists', () => { pm.expect(pm.response.json().fleetLocation).to.exist; });`

### 2. Driver Performance (B7_AdminManagementRoutes)
- **Endpoint**: `GET /api/admin/drivers/stats`
- **Test**: Verifies that driver statistics are returned as an array
- **Assertion**: `pm.test('Driver stats returned', () => { pm.expect(pm.response.json().driverStats).to.be.an('array'); });`

### 3. Delay Compensation (B5_DelayGuarantee)
- **Endpoint**: `GET /api/admin/delay/pending`
- **Test**: Verifies that discount codes are generated for approved delay compensations
- **Assertion**: `pm.test('Discount code exists', () => { pm.expect(pm.response.json().discountCode).to.be.a('string'); });`

### 4. Revenue Analytics (B8_PaymentRoutes)
- **Endpoint**: `GET /api/admin/analytics/summary`
- **Test**: Verifies that total revenue is calculated and returned as a number
- **Assertion**: `pm.test('Revenue calculated', () => { pm.expect(pm.response.json().totalRevenue).to.be.a('number'); });`

### 5. Corporate Clients (B1_AuthRoutes)
- **Endpoint**: `POST /api/admin/corporate`
- **Test**: Verifies that corporate flag is set to true when creating corporate users
- **Assertion**: `pm.test('Corporate flag set', () => { pm.expect(pm.response.json().isCorporate).to.be.true; });`

## Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select the `GNB_Admin_Feature_Toggle_Suite.postman_collection.json` file
4. Collection will be imported with all folders and tests

### 2. Environment Variables
Set the following variables in your Postman environment:

```
baseUrl: http://localhost:5000
adminToken: <your-admin-jwt-token>
```

### 3. Authentication
To get an admin token:
1. Login via the auth endpoint: `POST {{baseUrl}}/api/auth/login`
2. Use credentials with admin role
3. Copy the JWT token from the response
4. Set it as the `adminToken` environment variable

## Running the Tests

### Run All Tests
1. Select the collection in Postman
2. Click "Run collection" button
3. All tests will execute sequentially

### Run Individual Folders
You can run tests for specific features by:
1. Expanding the collection
2. Right-clicking on a folder (e.g., "B2_BookingRoutes")
3. Selecting "Run folder"

### Command Line (Newman)
```bash
npm install -g newman
newman run GNB_Admin_Feature_Toggle_Suite.postman_collection.json \
  --env-var "baseUrl=http://localhost:5000" \
  --env-var "adminToken=YOUR_ADMIN_TOKEN"
```

## Test Organization

Tests are organized into folders matching the requirement specifications:
- **B1_AuthRoutes**: Authentication and corporate user tests
- **B2_BookingRoutes**: Fleet tracking tests
- **B5_DelayGuarantee**: Delay compensation tests
- **B7_AdminManagementRoutes**: Driver performance and feature toggle tests
- **B8_PaymentRoutes**: Revenue analytics tests

## Expected Results

All tests should pass when:
1. Backend server is running
2. MongoDB is connected
3. Feature toggles are enabled
4. Valid admin authentication token is provided

## Troubleshooting

### 503 Service Unavailable
- **Cause**: Feature is disabled
- **Solution**: Enable the feature via `POST /api/admin/features/toggle`

### 401 Unauthorized
- **Cause**: Invalid or expired token
- **Solution**: Generate a new admin token by logging in

### 403 Forbidden
- **Cause**: Insufficient permissions
- **Solution**: Ensure you're using an admin-level token

### Connection Errors
- **Cause**: Backend server not running
- **Solution**: Start the backend with `npm run dev` in the backend directory

## CI/CD Integration

This collection can be integrated into CI/CD pipelines using Newman:

```yaml
# Example GitHub Actions workflow
- name: Run Postman Tests
  run: |
    npm install -g newman
    newman run postman/GNB_Admin_Feature_Toggle_Suite.postman_collection.json \
      --env-var "baseUrl=${{ secrets.API_URL }}" \
      --env-var "adminToken=${{ secrets.ADMIN_TOKEN }}" \
      --reporters cli,json
```

## Support

For issues or questions:
1. Check the backend logs for detailed error messages
2. Verify feature toggles are enabled in the database
3. Ensure all required permissions are configured in `config/permissions.mjs`
