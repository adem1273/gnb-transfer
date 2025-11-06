# Security Authentication Fixes

This PR implements security enhancements and authentication improvements for the GNB Transfer application.

## Summary of Changes

- **Remove JWT secret fallback and enforce JWT_SECRET in production**: No default/insecure fallback values for JWT secret
- **Consolidate authentication middleware**: Export `requireAuth(roles)`, `requireRole(...roles)`, and `requireAdmin`; use `res.apiError` for standardized error responses; handle `TokenExpiredError` separately
- **Add bcrypt-based password hashing**: Pre-save hook in `backend/models/User.mjs` with `comparePassword` helper; `SALT_ROUNDS` configurable via environment variable (default: 10)
- **Clean backend/server.mjs**: Single `connectDB` implementation, skip DB connection if `MONGO_URI` unset (with warning), remove duplicate imports, single `app.listen`, graceful shutdown handler
- **Add/clean backend/routes/userRoutes.mjs**: Register and login endpoints; login returns JWT token
- **Fix backend/package.json**: Include `bcrypt` dependency and proper scripts without duplicates

## Modified Files

- `backend/package.json` - Fixed duplicate fields, added bcrypt dependency
- `backend/routes/userRoutes.mjs` - Cleaned duplicate code, added login endpoint with JWT token generation
- `backend/middlewares/response.mjs` - Enhanced with proper exports and status code support
- `backend/middlewares/auth.mjs` - Already implements requireAuth, requireRole, requireAdmin with res.apiError
- `backend/models/User.mjs` - Already implements bcrypt hashing and comparePassword
- `backend/server.mjs` - Already implements single connectDB, JWT_SECRET enforcement, graceful shutdown
- `.github/PULL_REQUEST_TEMPLATE.md` - This template

## Testing & Setup Notes

### Installation
```bash
cd backend
npm install bcrypt
npm install
```

### Environment Variables Required
- `JWT_SECRET` - Required in production for JWT token signing
- `MONGO_URI` - MongoDB connection string (server warns if unset)
- `BCRYPT_ROUNDS` - Optional, defaults to 10

### Response Middleware
Ensure `backend/middlewares/response.mjs` exports:
- `res.apiSuccess(data, message, status)` - Success response helper
- `res.apiError(message, status)` - Error response helper

### Testing Endpoints

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Reviewer

@adem1273

## Labels

- `security`
- `backend`

## Notes

- This PR does NOT set assignees
- This PR does NOT enable auto-merge
- Password hashing happens automatically via Mongoose pre-save hook
- JWT tokens expire after 7 days
- Login endpoint validates credentials using bcrypt comparePassword method