# Quick Reference: Authentication & Security

## Authentication Quick Start

### How to Authenticate

All API requests requiring authentication must include:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

**1. Login**
```bash
curl -X POST https://api.gnb-transfer.com/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
}
```

**2. Use Token in Requests**
```bash
curl -X GET https://api.gnb-transfer.com/api/v1/users/profile \
  -H "Authorization: Bearer eyJhbGc..."
```

**3. Refresh Token (when access token expires)**
```bash
curl -X POST https://api.gnb-transfer.com/api/v1/users/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

## Security Model Summary

### ✅ What We Use

- **JWT Tokens** via `Authorization: Bearer` header
- **Stateless Authentication** (no server-side sessions)
- **Refresh Tokens** in HttpOnly cookies (production) or body (development)
- **HTTPS** in production
- **Rate Limiting** on auth endpoints
- **Password Hashing** with bcrypt
- **Security Headers** (Helmet.js)

### ❌ What We Don't Use

- **Session Cookies** for authentication
- **CSRF Tokens** (not needed for header-based auth)
- **Cookie-based Sessions** (stateless by design)

## Common Questions

### Q: Why no CSRF protection?

**A:** CSRF attacks rely on browsers automatically sending cookies with requests. Our API uses JWT tokens in the `Authorization` header, which:
1. Cannot be set by cross-origin requests (browser security)
2. Are not automatically sent by browsers
3. Must be explicitly included by the client

This follows [OWASP guidelines for header-based authentication](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers).

### Q: Where should I store JWT tokens?

**Access Tokens (short-lived, 15-60 min):**
- ✅ Memory (most secure, lost on page refresh)
- ✅ sessionStorage (good balance)
- ⚠️ localStorage (persistent but vulnerable to XSS)
- ❌ Cookies (not used for access tokens)

**Refresh Tokens (7 days):**
- ✅ HttpOnly, Secure, SameSite cookies (production - handled automatically)
- ✅ Secure storage (development - manage manually)

### Q: How do I handle token expiration?

**Access Token Expired:**
```javascript
// Client-side pseudocode
if (response.status === 401 && response.error === 'Token expired') {
  const newTokens = await refreshAccessToken(refreshToken);
  // Retry original request with new access token
}
```

**Refresh Token Expired:**
```javascript
// User must log in again
if (refreshResponse.status === 401) {
  redirectToLogin();
}
```

### Q: Can I use this API from a mobile app?

**A:** Yes! The JWT authentication model works perfectly with mobile apps:
1. Store access token in secure memory
2. Store refresh token in secure storage (Keychain/Keystore)
3. Send access token in `Authorization` header with each request

### Q: What about CORS?

**A:** CORS is properly configured. Allowed origins are:
- Production: `https://gnb-transfer.onrender.com`
- Development: `http://localhost:5173`, `http://localhost:3000`

Cross-origin requests require proper CORS headers, which adds an extra layer of security.

## Security Best Practices

### For Frontend Developers

✅ **DO:**
- Store access tokens in memory or sessionStorage
- Include `Authorization: Bearer <token>` header in all authenticated requests
- Handle token expiration gracefully
- Use refresh tokens to get new access tokens
- Clear tokens on logout
- Use HTTPS in production

❌ **DON'T:**
- Store tokens in localStorage if possible (XSS vulnerability)
- Send tokens in URL query parameters
- Log tokens to console in production
- Share tokens between users
- Store refresh tokens in localStorage (use cookies in production)

### For Backend Developers

✅ **DO:**
- Validate JWT signature on every request
- Check token expiration
- Verify user role for protected routes
- Use `requireAuth()` middleware
- Hash refresh tokens in database
- Rotate refresh tokens on use
- Rate limit authentication endpoints

❌ **DON'T:**
- Trust token payload without verification
- Skip role-based access control
- Store refresh tokens in plain text
- Allow token reuse after logout
- Expose JWT_SECRET in code or logs

## Middleware Usage

### Protect a Route (Any Authenticated User)

```javascript
import { requireAuth } from '../middlewares/auth.mjs';

router.get('/profile', requireAuth(), async (req, res) => {
  // req.user contains decoded JWT payload
  const user = await User.findById(req.user.id);
  res.apiSuccess({ user });
});
```

### Protect a Route (Specific Roles)

```javascript
router.delete('/users/:id', requireAuth(['admin']), async (req, res) => {
  // Only admin users can access this route
});

// Or use helper
import { requireAdmin } from '../middlewares/auth.mjs';
router.delete('/users/:id', requireAuth(), requireAdmin, async (req, res) => {
  // Same as above
});
```

### Optional Authentication

```javascript
import { optionalAuth } from '../middlewares/auth.mjs';

router.get('/tours', optionalAuth, async (req, res) => {
  // req.user is set if valid token provided, undefined otherwise
  const tours = await getTours(req.user);
  res.apiSuccess({ tours });
});
```

## Error Responses

### 401 Unauthorized

**Token Missing:**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**Token Invalid:**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Token Expired:**
```json
{
  "success": false,
  "error": "Token expired"
}
```

### 403 Forbidden

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

## Environment Variables

Required for authentication:

```bash
# Backend (.env)
JWT_SECRET=your-secret-key-min-32-chars
MONGO_URI=mongodb://...
NODE_ENV=production

# Frontend (.env)
VITE_API_URL=https://api.gnb-transfer.com/api
```

## Testing Authentication

**Example Test:**
```javascript
import request from 'supertest';
import app from '../server.mjs';

describe('Authentication', () => {
  let token;

  it('should login and return token', async () => {
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({ email: 'test@example.com', password: 'Password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  it('should access protected route with token', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
  });
});
```

## Rate Limiting

Authentication endpoints have strict rate limits:

- **Login**: 5 attempts per 15 minutes per IP
- **Register**: 3 registrations per hour per IP
- **Refresh**: 10 requests per 15 minutes per IP

If rate limit exceeded:
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

## Links

- **Full Security Documentation**: See [SECURITY.md](./SECURITY.md)
- **Implementation Details**: See [CSRF_RESOLUTION_SUMMARY.md](./CSRF_RESOLUTION_SUMMARY.md)
- **API Documentation**: Available at `/api/v1/api-docs` when server is running

---

**Last Updated**: 2025-12-27
