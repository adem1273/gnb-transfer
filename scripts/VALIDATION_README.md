# STEP 4 - Image Upload Validation

## Overview

This validation suite tests the image upload functionality according to the requirements checklist:

- ✅ Upload jpg/png/webp under 2MB → success
- ✅ Upload pdf → rejected
- ✅ Upload without login → 401
- ✅ Upload as non-admin → 403
- ✅ Database stores only Cloudinary URL
- ✅ No image files exist in backend or frontend

## Prerequisites

Before running validation:

1. **Backend server must be running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Environment variables must be set** in `backend/.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   ```

3. **MongoDB must be connected** and accessible

4. **You need auth tokens** for testing:
   - Admin user token (user with `admin` or `superadmin` role)
   - Regular user token (user with `user` role)

## Quick Start

### Step 1: Get Authentication Tokens

Run the helper script to see instructions:
```bash
node scripts/get-test-tokens.mjs
```

This will show you how to:
- Login with existing users
- Create new test users
- Update user roles in database

### Step 2: Run Validation

Once you have both tokens, run the validation script:
```bash
node scripts/validate-upload-step4.mjs <admin-token> <user-token>
```

**Example:**
```bash
node scripts/validate-upload-step4.mjs \
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3... \
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3...
```

## What Gets Tested

### 1. Valid Image Uploads (Success Cases)
- ✅ JPEG files under 2MB
- ✅ PNG files under 2MB
- ✅ WebP files under 2MB
- ✅ Returns Cloudinary URL (https://res.cloudinary.com/...)

### 2. Invalid File Type (Rejection)
- ❌ PDF files → 400 Bad Request
- ❌ Other non-image formats

### 3. Authentication & Authorization
- ❌ Upload without token → 401 Unauthorized
- ❌ Upload with user token → 403 Forbidden
- ✅ Upload with admin token → 201 Created

### 4. File Size Validation
- ❌ Files larger than 2MB → 400 Bad Request

### 5. Storage Validation
- ✅ No image files stored locally in backend
- ✅ No image files stored locally in frontend
- ✅ All images stored in Cloudinary only

## Expected Output

```
╔═══════════════════════════════════════════════════════════════════╗
║        STEP 4 - IMAGE UPLOAD VALIDATION                           ║
║        Testing Upload Security & Requirements                     ║
╚═══════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════
SETUP: Creating Test Files
══════════════════════════════════════════════════════════════════

✓ Test files created in: /tmp/upload-validation-test-files

══════════════════════════════════════════════════════════════════
TEST 1: Upload Valid Images (JPG/PNG/WebP) under 2MB → Success
══════════════════════════════════════════════════════════════════

✓ PASS: Upload JPG under 2MB
✓ PASS: Upload PNG under 2MB
✓ PASS: Upload WebP under 2MB

══════════════════════════════════════════════════════════════════
TEST 2: Upload PDF → Rejected
══════════════════════════════════════════════════════════════════

✓ PASS: Upload PDF rejected

══════════════════════════════════════════════════════════════════
TEST 3: Upload without Login → 401
══════════════════════════════════════════════════════════════════

✓ PASS: Upload without login returns 401

══════════════════════════════════════════════════════════════════
TEST 4: Upload as Non-Admin → 403
══════════════════════════════════════════════════════════════════

✓ PASS: Upload as non-admin returns 403

══════════════════════════════════════════════════════════════════
TEST 5: Upload File > 2MB → Rejected
══════════════════════════════════════════════════════════════════

✓ PASS: Upload file exceeding 2MB rejected

══════════════════════════════════════════════════════════════════
TEST 6: No Image Files Stored Locally
══════════════════════════════════════════════════════════════════

✓ PASS: No image files exist in backend or frontend

══════════════════════════════════════════════════════════════════
VALIDATION SUMMARY
══════════════════════════════════════════════════════════════════

Total Tests: 8
Passed: 8
Failed: 0
Success Rate: 100.00%

✅ ALL VALIDATION TESTS PASSED
══════════════════════════════════════════════════════════════════
```

## Troubleshooting

### Server Not Running
**Error:** `Cannot connect to server`

**Solution:**
```bash
cd backend
npm install
npm run dev
```

### Missing Cloudinary Configuration
**Error:** `Cloudinary configuration is incomplete`

**Solution:** Add to `backend/.env`:
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get credentials from: https://cloudinary.com/console

### Missing Tokens
**Error:** `Admin and/or user tokens not provided`

**Solution:** Run the token helper:
```bash
node scripts/get-test-tokens.mjs
```

Follow instructions to:
1. Login with existing credentials, OR
2. Create new test users and update roles

### Invalid Token
**Error:** `Invalid token` or `Token expired`

**Solution:** Generate fresh tokens by logging in again:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'
```

### User Role Not Admin
**Error:** Admin tests fail with 403

**Solution:** Update user role in database:
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Manual Testing Alternative

If you prefer to test manually, use the provided test script:

```bash
cd backend
node scripts/test-upload.mjs /path/to/image.jpg <admin-token>
```

Or use curl:
```bash
curl -X POST http://localhost:5000/api/v1/upload/image \
  -H "Authorization: Bearer <admin-token>" \
  -F "image=@/path/to/image.jpg"
```

## Files Created

The validation script automatically creates these test files in `/tmp/upload-validation-test-files/`:

- `test.jpg` - Valid JPEG (< 2MB)
- `test.png` - Valid PNG (< 2MB)
- `test.webp` - Valid WebP (< 2MB)
- `test.pdf` - Invalid PDF (should be rejected)
- `large-image.jpg` - Large file (3MB, should be rejected)

## Related Documentation

- **API Documentation:** `backend/docs/IMAGE_UPLOAD.md`
- **Implementation Summary:** `backend/docs/UPLOAD_IMPLEMENTATION_SUMMARY.md`
- **Upload Middleware:** `backend/middlewares/upload.mjs`
- **Upload Routes:** `backend/routes/uploadRoutes.mjs`
- **Upload Tests:** `backend/tests/upload.test.mjs`

## Exit Codes

- `0` - All validation tests passed
- `1` - One or more validation tests failed

## Support

If validation fails, review:
1. Server logs for detailed error messages
2. Cloudinary dashboard for uploaded images
3. MongoDB database for stored URLs
4. Network connectivity to Cloudinary

For issues, check:
- `backend/logs/` for error logs
- Console output for detailed error messages
- MongoDB connection status
- Cloudinary API status
