# Admin Authentication Testing Guide

This guide covers testing the admin panel authentication and API configuration fixes.

## Overview

The following changes were made to fix authentication and API configuration issues:

1. **Environment-based API URLs**: Replaced hardcoded URLs with `VITE_API_URL` environment variable
2. **Proper Logout**: Logout now revokes refresh tokens on the backend
3. **Token Expiration Handling**: 401 errors clear auth state and redirect to login
4. **AuthContext Implementation**: Real token management instead of placeholder
5. **Consistent Auth Flow**: Unified authentication across admin and main frontend

## Prerequisites

Before running tests, ensure:

1. Backend server is running (`cd backend && npm run dev`)
2. MongoDB is connected
3. Test admin user exists (see below)

### Create Test Admin User

If you don't have a test admin user, create one:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String
  }));
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: hashedPassword,
    role: 'admin'
  });
  
  console.log('Test admin user created');
  process.exit(0);
});
"
```

## Running Tests

### 1. Auth Verification Script (Recommended)

This script tests the complete authentication flow against a running backend:

```bash
cd backend
node scripts/verify-auth.mjs
```

**What it tests:**
- ✓ API reachability
- ✓ Admin login with credentials
- ✓ Access to protected admin routes
- ✓ Rejection of unauthenticated requests
- ✓ Rejection of invalid tokens
- ✓ Token refresh functionality
- ✓ Logout and token revocation
- ✓ Revoked token rejection
- ✓ API configuration

**Expected output:**
```
=== Admin Authentication Verification ===

API Base URL: http://localhost:5000/api

Testing: API Reachability
✓ API server is reachable

Testing: Admin Login
✓ Admin login successful
✓ User role: admin

Testing: Access Protected Admin Route
✓ Successfully accessed admin stats endpoint
✓ Total users: X

...

=== Test Summary ===

Passed: 10
Failed: 0
Warnings: 1

Success Rate: 100.0%
```

### 2. Integration Tests (Requires MongoDB Memory Server)

Run full integration test suite:

```bash
cd backend
npm test -- admin-auth-integration.test.mjs
```

**Note**: This requires network access to download MongoDB binaries. If you're in a restricted environment, use the verification script instead.

### 3. Manual Testing

#### Test 1: Environment Configuration

Check that the frontend uses environment variables:

1. Create/update `.env` in project root:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. Check the API configuration in browser console:
   ```javascript
   // In admin pages
   console.log(import.meta.env.VITE_API_URL);
   ```

3. Verify API calls go to the correct URL (check Network tab in DevTools)

#### Test 2: Login Flow

1. Navigate to admin login page
2. Login with test credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Verify you're redirected to admin dashboard
4. Check localStorage contains `adminToken` and `adminRefreshToken`

#### Test 3: Token Expiration

1. Login to admin panel
2. Copy the `adminToken` from localStorage
3. Wait 15+ minutes (or manually set an expired token)
4. Try to access an admin page
5. **Expected**: Automatically redirected to login page
6. **Expected**: Tokens cleared from localStorage

#### Test 4: Logout Flow

1. Login to admin panel
2. Open DevTools → Network tab
3. Click logout button
4. **Expected**: See POST request to `/api/auth/logout`
5. **Expected**: Request includes refresh token in body
6. **Expected**: Redirected to login page
7. **Expected**: All tokens cleared from localStorage
8. Try to use the old refresh token:
   ```bash
   curl -X POST http://localhost:5000/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<old-token-here>"}'
   ```
9. **Expected**: 401 error (token revoked)

#### Test 5: Protected Routes

1. Clear all tokens from localStorage
2. Try to access `/admin/dashboard` directly
3. **Expected**: Redirected to login
4. Try API call without token:
   ```bash
   curl http://localhost:5000/api/admin/stats
   ```
5. **Expected**: 401 error

## Environment Variables

Ensure these are set correctly:

### Frontend (.env in project root)
```bash
VITE_API_URL=http://localhost:5000/api  # Development
# VITE_API_URL=https://your-domain.com/api  # Production
```

### Backend (backend/.env)
```bash
MONGO_URI=mongodb://...
JWT_SECRET=your-secret-here
PORT=5000
```

## Common Issues

### Issue: "Cannot connect to API server"
**Solution**: Ensure backend is running on the correct port
```bash
cd backend
npm run dev
```

### Issue: "Login failed: Invalid credentials"
**Solution**: Verify test admin user exists with correct credentials

### Issue: "Network error"
**Solution**: Check VITE_API_URL is set correctly and backend is accessible

### Issue: Tests fail in CI/CD
**Solution**: Use the verification script instead of integration tests if network is restricted

## Security Verification

### What's Fixed:

1. **Logout Security**: ✓ Refresh tokens are revoked on backend
2. **Token Expiration**: ✓ Expired/invalid tokens trigger logout
3. **No Hardcoded URLs**: ✓ All URLs from environment variables
4. **Stale State**: ✓ All auth state cleared on logout
5. **Protected Routes**: ✓ Middleware rejects unauthenticated requests

### What to Monitor:

1. **Access tokens remain valid after logout** - This is expected JWT behavior
   - Access tokens are stateless and expire after 15 minutes
   - Refresh tokens are revoked and cannot be used
   - In production, consider shorter access token expiry if needed

2. **Session persistence** - Auth state should not persist after logout
   - Check localStorage is cleared
   - Check no cached API responses

## Continuous Testing

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Authentication
  run: |
    cd backend
    npm run dev &
    sleep 10
    node scripts/verify-auth.mjs
```

## Troubleshooting

Enable debug logging:

```bash
# Backend
DEBUG=auth:* npm run dev

# Frontend
VITE_LOG_LEVEL=debug npm run dev
```

Check logs for authentication issues:
```bash
# Backend logs
tail -f backend/logs/combined.log

# Check for auth errors
grep -i "auth\|token\|401" backend/logs/error.log
```

## Next Steps

After verifying authentication:

1. Update `.env.example` files with correct variables
2. Document API URL configuration in deployment guides
3. Set up monitoring for failed authentication attempts
4. Consider implementing refresh token rotation tracking
5. Add rate limiting on auth endpoints if not already present

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review backend logs for errors
3. Verify environment variables are set correctly
4. Ensure test user exists with correct role
