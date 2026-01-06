# Security Architecture

## Table of Contents
- [Authentication Model](#authentication-model)
- [JWT Security Features](#jwt-security-features)
- [CSRF Protection](#csrf-protection)
- [Token Storage](#token-storage)
- [Security Best Practices](#security-best-practices)
- [Threat Model](#threat-model)

## Authentication Model

### Stateless JWT Authentication

GNB Transfer uses a **stateless JWT (JSON Web Token) authentication** model with the following characteristics:

1. **Access Tokens**: Short-lived JWT tokens (15 minutes)
   - Sent in the `Authorization: Bearer <token>` header
   - Used for all API requests requiring authentication
   - Stored client-side in memory or localStorage
   - **NEW**: Include `jti` (JWT ID) for revocation tracking
   - **NEW**: Include `deviceId` for device fingerprinting

2. **Refresh Tokens**: Long-lived tokens (30 days)
   - Used to obtain new access tokens when they expire
   - Stored as HttpOnly cookies in production (security best practice)
   - Available in response body for development/testing
   - Stored hashed in database with device information

### Authentication Flow

```
1. Login (POST /api/auth/login)
   ├─> Credentials validated
   ├─> Device fingerprint generated (SHA-256 hash)
   ├─> Session limit checked (max 5 concurrent devices)
   ├─> Access token generated (JWT with jti + deviceId)
   ├─> Refresh token generated (random secure token)
   ├─> Refresh token stored in database (hashed)
   └─> Response:
       ├─> accessToken (in body)
       └─> refreshToken (HttpOnly cookie in production, body in development)

2. API Request (e.g., GET /api/users/profile)
   ├─> Authorization: Bearer <accessToken>
   ├─> Token verified (signature + expiration)
   ├─> Token revocation checked in Redis (if jti present)
   ├─> Device fingerprint verified (if deviceId present)
   └─> Request processed

3. Token Refresh (POST /api/auth/refresh)
   ├─> Refresh token from cookie or body
   ├─> Token verified in database
   ├─> Device fingerprint generated for new token
   ├─> New access + refresh tokens generated
   ├─> Old refresh token revoked (token rotation)
   └─> New tokens returned

4. Logout (POST /api/auth/logout)
   ├─> Refresh token revoked in database
   ├─> Access token blacklisted in Redis (immediate invalidation)
   └─> Cookie cleared (if production)
```

## JWT Security Features

### 1. Token Revocation (Blacklist)
**Status**: ✅ Implemented

Prevents token usage after logout by maintaining a Redis-based blacklist:

- **Technology**: Redis with TTL-based expiration
- **Token Identification**: Unique `jti` (JWT ID) field in token payload
- **Storage Duration**: Matches token expiry (max 15 minutes)
- **Backward Compatible**: Legacy tokens without `jti` continue to work
- **Graceful Degradation**: Application works without Redis (logs warning)

**Benefits**:
- Immediate token invalidation on logout
- Prevents token reuse after password change
- Enables emergency token revocation
- No memory leaks (TTL auto-cleanup)

**Implementation**: `backend/services/authService.mjs` - `revokeAccessToken()`

---

### 2. Device Fingerprinting
**Status**: ✅ Implemented

Binds tokens to specific devices to prevent session hijacking:

- **Algorithm**: SHA-256 cryptographic hash
- **Components**: User-Agent + Accept-Language + Accept-Encoding + Client IP
- **Token Binding**: `deviceId` field in JWT payload
- **Verification**: On every authenticated request
- **Auto-Revocation**: Suspicious activity triggers immediate token revocation

**Benefits**:
- Prevents session hijacking (token theft)
- Auto-detects and blocks compromised tokens
- Non-reversible hash (no PII exposure)
- Proxy-aware (X-Forwarded-For, X-Real-IP support)

**Implementation**: `backend/utils/deviceFingerprint.mjs`

---

### 3. Concurrent Session Limit
**Status**: ✅ Implemented

Limits users to a maximum number of concurrent devices:

- **Default Limit**: 5 concurrent devices per user
- **Configuration**: `SESSION.MAX_CONCURRENT` in `backend/constants/limits.mjs`
- **Enforcement**: Automatic revocation of oldest session when limit exceeded
- **Performance**: O(1) indexed database queries
- **Tracking**: Revocation reason stored as `max_sessions_exceeded`

**Benefits**:
- Prevents credential sharing
- Reduces DDoS attack surface
- Automatic cleanup (no manual intervention)
- Configurable per deployment

**Implementation**: `backend/modules/auth/auth.service.mjs` - `login()`

---

### Security Guarantees

| Threat | Before | After |
|--------|--------|-------|
| Token valid after logout | ❌ Yes (15 min) | ✅ No (immediate revoke) |
| Token usable from stolen device | ❌ Yes | ✅ No (auto-revoke) |
| Unlimited concurrent sessions | ❌ Yes | ✅ No (max 5) |
| Session hijacking | ⚠️ High Risk | ✅ Low Risk |
| Credential sharing | ❌ Possible | ✅ Prevented |

For detailed implementation guide, see [JWT_SECURITY_GUIDE.md](JWT_SECURITY_GUIDE.md).

---

## CSRF Protection

### Why CSRF Protection is NOT Required

This application **intentionally does not implement CSRF protection** because:

#### 1. Header-Based Authentication
All authenticated API requests use the `Authorization: Bearer <token>` header for authentication. According to [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers):

> **Use of Custom Request Headers**
> 
> Adding custom headers to HTTP requests (e.g., X-Requested-With, Authorization) can serve as an effective CSRF mitigation technique because:
> - Browsers prevent cross-origin requests from setting custom headers without proper CORS configuration
> - The Same-Origin Policy prevents attackers from reading responses to cross-origin requests
> - Custom headers require a CORS preflight request, which the attacker cannot force the victim's browser to make

**Key Point**: An attacker cannot force a victim's browser to send a request with a custom `Authorization` header to our API from a malicious site because:
- The browser's Same-Origin Policy blocks this
- CORS preflight would fail for unauthorized origins
- The attacker has no access to the victim's JWT token (stored in memory/localStorage, not in cookies)

#### 2. Stateless Design
- API endpoints do NOT rely on cookies for authentication/authorization
- Session cookies are NOT used
- Each request is independently authenticated via the JWT in the Authorization header

#### 3. Limited Cookie Usage
Cookies are ONLY used for refresh tokens with proper security flags:
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,   // Prevents JavaScript access (XSS protection)
  secure: true,     // HTTPS only
  sameSite: 'strict' // Prevents cross-site cookie sending (CSRF protection for cookies)
});
```

The `sameSite: 'strict'` attribute ensures that even the refresh token cookie cannot be sent in cross-site requests, providing CSRF protection for the limited cookie usage.

### Cookie Parser Scope

The `cookie-parser` middleware is applied **selectively** only to routes that need it (`/api/users/*`), not globally. This:
- Reduces attack surface
- Makes security boundaries explicit
- Resolves CodeQL warnings about missing CSRF protection
- Follows principle of least privilege

## Token Storage

### Access Tokens (Client-Side)
**Recommended Storage**: Memory or localStorage

**Trade-offs**:
- **Memory**: Most secure, but tokens lost on page refresh
- **localStorage**: Persistent across page refreshes, but vulnerable to XSS
- **sessionStorage**: Persistent across page loads but lost when tab closes

**Our Recommendation**: Use memory-based storage with session management to balance security and UX.

### Refresh Tokens (Client-Side)

**Production**: HttpOnly, Secure, SameSite=strict cookies
- **Pros**: 
  - Not accessible to JavaScript (XSS protection)
  - Automatically sent with requests to same origin
  - Browser manages lifecycle
- **Cons**:
  - Requires cookie-parser on server
  - Subject to CSRF (mitigated by SameSite=strict)

**Development**: Response body
- Allows testing with tools like Postman/curl
- Simplifies development workflow

### Refresh Tokens (Server-Side)

Refresh tokens are stored in the database **hashed** with:
- User association (userId)
- Device information (user agent)
- IP address
- Expiration time
- Revocation status

This allows:
- Token rotation (revoking old tokens when new ones are issued)
- Session management (view/revoke active sessions)
- Anomaly detection (unusual IP/device patterns)

## Security Best Practices

### Implemented Protections

1. **Token Expiration**
   - Access tokens: Short-lived (15-60 minutes)
   - Refresh tokens: 7 days with rotation

2. **Token Rotation**
   - New refresh token issued on each refresh
   - Old refresh token immediately revoked
   - Prevents replay attacks

3. **Secure Cookie Attributes**
   - `HttpOnly`: Prevents XSS access to tokens
   - `Secure`: Requires HTTPS in production
   - `SameSite=strict`: Prevents CSRF via cookies

4. **Rate Limiting**
   - Strict rate limits on authentication endpoints
   - Prevents brute-force attacks

5. **Security Headers**
   - Helmet.js for comprehensive security headers
   - Content Security Policy (CSP)
   - HSTS in production
   - X-Frame-Options, X-Content-Type-Options

6. **Input Validation**
   - All user inputs validated and sanitized
   - MongoDB query injection prevention
   - XSS prevention

7. **HTTPS Required**
   - All production traffic over HTTPS
   - Secure cookies only sent over HTTPS

## Threat Model

### Protected Against

✅ **CSRF (Cross-Site Request Forgery)**
- Header-based auth cannot be exploited via CSRF
- Refresh token cookies protected by SameSite=strict

✅ **XSS (Cross-Site Scripting)**
- Input sanitization
- Content Security Policy
- HttpOnly cookies for refresh tokens

✅ **Token Replay Attacks**
- Refresh token rotation
- Token revocation on logout
- Database-tracked sessions

✅ **Brute Force Attacks**
- Rate limiting on authentication endpoints
- Account lockout after failed attempts

✅ **Man-in-the-Middle (MITM)**
- HTTPS required in production
- HSTS headers
- Secure cookie flag

✅ **Session Hijacking**
- Short-lived access tokens
- Device and IP tracking
- Refresh token rotation

### Attack Scenarios & Mitigations

#### Scenario 1: Attacker Creates Malicious Website
**Attack**: Attacker creates evil.com and tricks victim into visiting while logged into gnb-transfer.com

**Mitigation**:
- Cannot read JWT from victim's browser (Same-Origin Policy)
- Cannot set Authorization header from evil.com (CORS prevents it)
- Refresh token cookie has SameSite=strict (browser won't send it to our API from evil.com)
- **Result**: Attack fails ✅

#### Scenario 2: XSS Vulnerability in Application
**Attack**: Attacker injects malicious JavaScript into our application

**Mitigation**:
- Input sanitization prevents most XSS
- CSP headers restrict script execution
- Refresh tokens in HttpOnly cookies (not accessible to JavaScript)
- Access tokens in memory/localStorage are vulnerable, but short-lived (15-60 min)
- **Result**: Limited exposure window, refresh tokens protected ✅

#### Scenario 3: Stolen Access Token
**Attack**: Access token stolen via XSS or network sniffing

**Mitigation**:
- Token expires quickly (15-60 minutes)
- Cannot obtain new access token without refresh token
- HTTPS prevents network sniffing
- **Result**: Limited damage, time-bounded ✅

#### Scenario 4: Stolen Refresh Token
**Attack**: Refresh token stolen from database or intercepted

**Mitigation**:
- Tokens stored hashed in database
- Token rotation: If attacker uses stolen token, legitimate user's next refresh invalidates it
- Device and IP tracking: Suspicious usage can be detected
- User can revoke all sessions from profile
- **Result**: Detectable and revocable ✅

## OWASP Compliance

This authentication architecture follows OWASP recommendations:

- ✅ [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- ✅ [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- ✅ [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- ✅ [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)

## References

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [MDN - HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN - Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

## Questions or Concerns?

If you believe you've found a security vulnerability, please report it responsibly:
1. Do NOT create a public GitHub issue
2. Email security concerns to the repository maintainers
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

---

**Last Updated**: 2025-12-27  
**Review Frequency**: Quarterly or when significant changes are made to authentication
