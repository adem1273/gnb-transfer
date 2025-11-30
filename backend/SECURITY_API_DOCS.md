# GNB Transfer Backend - Security & API Documentation

## Overview

This document describes the security measures, authentication flow, and critical API operations for the GNB Transfer backend application.

## Security Measures Implemented

### 1. Environment Variables

All sensitive configuration is stored in environment variables. See `.env.example` for required variables.

**Critical variables:**
- `JWT_SECRET` - Secret key for JWT token signing (required in production)
- `ACCESS_TOKEN_TTL` - Access token time-to-live (default: 15m)
- `REFRESH_TOKEN_TTL` - Refresh token time-to-live (default: 7d)
- `MONGO_URI` - MongoDB connection string
- `BCRYPT_ROUNDS` - Salt rounds for password hashing (default: 10)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `NODE_ENV` - Environment mode (development/production)

### 2. Password Security

- **Hashing Algorithm:** bcrypt with configurable salt rounds
- **Minimum Requirements:** 6 characters, must contain uppercase, lowercase, and number
- **Implementation:** Automatic hashing via Mongoose pre-save hook in User model
- **Verification:** Timing-attack safe comparison using bcrypt.compare()

### 3. JWT Authentication

- **Algorithm:** HS256 (HMAC with SHA-256)
- **Access Token Expiry:** 15 minutes (configurable via ACCESS_TOKEN_TTL)
- **Refresh Token Expiry:** 7 days (configurable via REFRESH_TOKEN_TTL)
- **Payload:** User ID, email, and role
- **Storage:** 
  - Access tokens: Client-side (memory, sessionStorage recommended)
  - Refresh tokens: httpOnly cookies (production) or client-side (development)
- **Format:** `Authorization: Bearer <access_token>`
- **Rotation:** Refresh tokens are rotated on each use for enhanced security

### 4. Security Headers

**Helmet Configuration:**
- **Content Security Policy (CSP):** Restricts resource loading to same origin, except stylesheets allow unsafe-inline for React
- **HSTS (Production):** Enforces HTTPS with 2-year max-age and preload flag
- **Referrer Policy:** Set to 'no-referrer' to prevent information leakage
- **Permissions Policy:** Restricts camera, microphone, and geolocation access

### 5. Rate Limiting

Two rate limiters are implemented:

**Global Rate Limiter:**
- Applied to all routes
- Limit: 100 requests per 15 minutes per IP
- Purpose: Prevent general API abuse

**Strict Rate Limiter:**
- Applied to sensitive operations (auth, bookings, admin actions)
- Limit: 5 requests per 15 minutes per IP
- Purpose: Prevent brute-force attacks

### 6. Input Validation

All POST and PUT endpoints use express-validator middleware:
- **User registration:** Name length, email format, password strength
- **User login:** Email format, required fields
- **Bookings:** Guest count limits, date format, payment method validation
- **Tours:** Price validation, discount range (0-100%), field length limits
- **MongoDB ObjectIds:** Format validation on URL parameters

### 7. CORS Configuration

- **Whitelist-based:** Only specified origins can access the API
- **Default allowed origins:** localhost:5173, localhost:3000
- **Configurable:** Set via `CORS_ORIGINS` environment variable
- **Credentials:** Enabled for cookie-based authentication (if needed)

### 8. Security Middleware

- **Helmet:** Sets security-related HTTP headers (CSP, HSTS, Referrer-Policy, Permissions-Policy)
- **Compression:** Compresses response bodies
- **Express JSON:** Body size limits prevent payload attacks
- **Centralized Error Handler:** Prevents error stack leakage in production
- **Request ID:** Adds x-request-id header for request correlation and tracing
- **Cookie Parser:** Parses httpOnly cookies for refresh token handling

### 9. Logging & Monitoring

- **Winston Logger:** Structured logging with PII redaction
- **Log Rotation:** Daily rotation with compression, 14-day retention
- **PII Redaction:** Automatically redacts passwords, tokens, cookies, emails, API keys
- **Request Correlation:** Each request gets a unique ID for distributed tracing

### 10. Role-Based Access Control (RBAC)

Three roles are supported:
- **user:** Default role for new registrations
- **admin:** Full access to all operations
- **driver:** (Reserved for future use)

Protected routes check user roles before allowing access.

## Authentication Flow

### Registration Flow

```
1. Client sends POST /api/users/register with { name, email, password }
2. Server validates input (email format, password strength)
3. Server checks if email already exists
4. Server creates user with default 'user' role
5. Pre-save hook hashes password with bcrypt
6. Server generates JWT token (expires in 7 days)
7. Server returns { token, user: { id, name, email, role } }
```

**Security notes:**
- Role is always set to 'user' to prevent privilege escalation
- Password never returned in response
- Rate limited to 5 requests per 15 minutes

### Login Flow

```
1. Client sends POST /api/users/login with { email, password }
2. Server validates input format
3. Server finds user by email (case-insensitive)
4. Server compares password using bcrypt.compare()
5. If valid, server generates JWT access token (15min TTL) and refresh token (7d TTL)
6. Server stores refresh token hash in database with device info and IP
7. In production: Server sets httpOnly, secure, SameSite=strict cookie with refresh token
8. Server returns { accessToken, refreshToken (dev only), user: { id, name, email, role } }
```

**Security notes:**
- Generic error message on invalid credentials (prevents user enumeration)
- Rate limited to 5 requests per 15 minutes
- Timing-attack safe password comparison
- Access tokens short-lived (15 minutes) for security
- Refresh tokens stored hashed in database (bcrypt)
- Refresh tokens in httpOnly cookies prevent XSS attacks

### Refresh Token Flow

```
1. Client sends POST /api/users/refresh with refresh token (in cookie or body)
2. Server hashes provided token and looks up in database
3. Server validates token is not revoked and not expired
4. Server revokes old refresh token (rotation)
5. Server generates new access token and new refresh token
6. Server stores new refresh token hash in database
7. In production: Server sets new httpOnly cookie
8. Server returns { accessToken, refreshToken (dev only), user }
```

**Security notes:**
- Refresh token rotation prevents token reuse attacks
- Old tokens immediately revoked after rotation
- IP address tracking for suspicious activity detection
- Rate limited to 5 requests per 15 minutes

### Logout Flow

```
1. Client sends POST /api/users/logout with refresh token (in cookie or body)
2. Server looks up and revokes refresh token in database
3. Server clears refresh token cookie
4. Server returns success message
```

**Security notes:**
- Generic success message (doesn't reveal if token existed)
- Revoked tokens cannot be used for refresh
- Client should also delete access token

### Protected Route Access

```
1. Client includes token in Authorization header: "Bearer <token>"
2. requireAuth middleware extracts and verifies token
3. Middleware decodes payload and checks expiry
4. Middleware checks user role against allowed roles (if specified)
5. If valid, middleware sets req.user and calls next()
6. Route handler executes with authenticated user context
```

**Error responses:**
- 401 Unauthorized: Missing, invalid, or expired token
- 403 Forbidden: Valid token but insufficient permissions
- 500 Internal Server Error: JWT_SECRET not configured

## Booking Flow

### Creating a Booking

```
1. Client sends POST /api/bookings with:
   {
     name: string,
     email: string,
     tourId: ObjectId,
     paymentMethod?: 'cash' | 'card' | 'stripe',
     guests?: number (1-50),
     date?: ISO 8601 date string
   }
2. Server validates all inputs
3. Server verifies tour exists by tourId
4. Server calculates amount: tour.price * guests
5. Server sets status:
   - 'pending' for cash payments
   - 'confirmed' for card/stripe payments
6. Server creates booking and returns booking object
```

**Security & Business Logic:**
- Rate limited to 5 requests per 15 minutes
- Tour existence verified before booking creation
- Amount calculated server-side (client cannot override)
- Guest count validated (1-50)
- Email format validated

### Managing Bookings (Admin Only)

**Get All Bookings:** GET /api/bookings
- Returns all bookings with tour details
- Limited to 200 results
- Sorted by creation date (newest first)

**Get Single Booking:** GET /api/bookings/:id
- Returns specific booking with tour details

**Update Booking Status:** PUT /api/bookings/:id/status
- Allowed statuses: pending, confirmed, cancelled, completed, paid
- Status validated against enum
- Rate limited

**Delete Booking:** DELETE /api/bookings/:id
- Permanently deletes booking
- Rate limited

## Tour Management Flow

### Viewing Tours (Public)

**Get All Tours:** GET /api/tours
- No authentication required
- Returns all tours sorted by creation date

**Get Campaign Tours:** GET /api/tours/campaigns
- Returns tours with isCampaign=true
- Sorted by discount (highest first)

**Get Most Popular Tours:** GET /api/tours/most-popular
- Aggregates confirmed/completed bookings
- Returns top 3 tours by booking count

**Get Tour by ID:** GET /api/tours/:id
- Returns single tour details

**Get Discounted Price:** GET /api/tours/:id/discounted-price
- Calculates discounted price based on discount percentage
- Returns: originalPrice, discount, discountedPrice

### Managing Tours (Admin Only)

**Create Tour:** POST /api/tours
- Required: title, price, duration
- Optional: description, discount (0-100%), isCampaign, translations
- Rate limited

**Update Tour:** PUT /api/tours/:id
- All fields optional
- Validates discount range (0-100%)
- Rate limited

**Delete Tour:** DELETE /api/tours/:id
- Permanently deletes tour
- Rate limited

## New Authentication Endpoints (v2)

### POST /api/users/refresh

**Purpose:** Obtain a new access token using a refresh token

**Request:**
```json
// Cookie (preferred in production)
Cookie: refreshToken=<token>

// OR Body (development only)
{
  "refreshToken": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "abcd1234..." // Only in development
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  },
  "message": "Token refreshed successfully"
}
```

**Security Features:**
- Token rotation: Old refresh token is revoked, new one issued
- Rate limited to 5 requests per 15 minutes
- Validates token is not revoked and not expired
- Tracks IP address for suspicious activity detection
- Returns new refresh token in httpOnly cookie (production)

**Error Responses:**
- 401 Unauthorized: Invalid, expired, or revoked refresh token
- 500 Internal Server Error: Server error during token rotation

### POST /api/users/logout

**Purpose:** Revoke refresh token and logout

**Request:**
```json
// Cookie (preferred in production)
Cookie: refreshToken=<token>

// OR Body (development only)
{
  "refreshToken": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

**Security Features:**
- Revokes refresh token in database (blacklisting)
- Clears refresh token cookie
- Generic success message (doesn't reveal if token existed)
- Client should also delete access token from memory/storage

**Error Responses:**
- 500 Internal Server Error: Server error during logout

## Centralized Error Handling

The application uses a centralized error handler that:

1. Catches all errors from route handlers
2. Translates specific error types (ValidationError, CastError, JWT errors)
3. Returns appropriate HTTP status codes
4. Prevents error stack leakage in production
5. Uses standardized response format: `{ success: false, message: string }`

**Specific error handling:**
- **ValidationError:** 400 Bad Request with field-specific messages
- **CastError:** 400 Bad Request for invalid MongoDB ObjectIds
- **Duplicate Key (code 11000):** 409 Conflict
- **JsonWebTokenError:** 401 Unauthorized
- **TokenExpiredError:** 401 Unauthorized

## Best Practices for Development

### Adding New Routes

1. Create route handler in appropriate routes file
2. Add input validation using express-validator
3. Use requireAuth() middleware for protected routes
4. Apply strictRateLimiter for sensitive operations
5. Use try-catch blocks and let error handler manage errors
6. Return responses using res.apiSuccess() or res.apiError()
7. Add JSDoc comments documenting the endpoint

### Environment Variable Usage

Never hardcode:
- Database credentials
- API keys
- JWT secrets
- Sensitive configuration

Always use: `process.env.VARIABLE_NAME`

### Database Queries

- Always validate ObjectIds before queries
- Limit query results to prevent memory issues
- Use select() to exclude sensitive fields (e.g., passwords)
- Consider indexing frequently queried fields

### Testing Authentication

**Get token:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Use token:**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Security Checklist for Production

- [ ] Set strong JWT_SECRET (at least 32 random characters)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGINS to only include production domains
- [ ] Use HTTPS for all communications
- [ ] Set secure MongoDB connection string with authentication
- [ ] Enable MongoDB IP whitelist
- [ ] Set up proper logging (avoid console.log in production)
- [ ] Configure rate limits based on expected traffic
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy for database
- [ ] Review and update dependencies regularly
- [ ] Consider adding request logging middleware
- [ ] Implement API versioning for future changes

## Common HTTP Status Codes

- **200 OK:** Successful GET, PUT requests
- **201 Created:** Successful POST request creating a resource
- **400 Bad Request:** Validation errors, malformed request
- **401 Unauthorized:** Missing or invalid authentication token
- **403 Forbidden:** Valid token but insufficient permissions
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Resource already exists (e.g., duplicate email)
- **500 Internal Server Error:** Unexpected server error

## Support

For questions or issues related to security or API usage, please contact the development team or open an issue in the repository.
