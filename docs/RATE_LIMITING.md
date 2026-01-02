# Advanced Rate Limiting & DDoS Protection

This document describes the comprehensive rate limiting and DDoS protection system implemented for GNB Transfer.

## Overview

The rate limiting system uses a Redis-backed token bucket algorithm to provide distributed rate limiting across multiple server instances. It includes multi-tier limits, abuse protection, and comprehensive monitoring capabilities.

## Architecture

### Components

1. **advancedRateLimit.mjs** - Main rate limiting middleware with Redis support
2. **socketRateLimiter.mjs** - Socket.IO connection rate limiter
3. **RateLimitViolation Model** - Tracks violations, bans, and abuse patterns
4. **rateLimitAdminRoutes.mjs** - Admin API for managing rate limits
5. **In-memory Fallback** - Graceful degradation when Redis is unavailable

### Redis Integration

The system uses Redis for distributed rate limiting with the following key patterns:

- `gnb:ratelimit:{ip|userId}:{endpoint}` - Rate limit counters
- `gnb:ratelimit:rapid:{identifier}` - Rapid request detection
- `gnb:ratelimit:socket:{identifier}` - Socket.IO connection tracking

All keys have automatic TTL-based expiration to ensure cleanup.

## Rate Limit Tiers

### 1. Anonymous Users (IP-based)

- **Limit**: 100 requests per 15 minutes
- **Identifier**: IP address
- **Use Case**: Unauthenticated visitors

### 2. Authenticated Users (User ID-based)

- **Limit**: 500 requests per 15 minutes
- **Identifier**: User ID
- **Use Case**: Logged-in users

### 3. Endpoint-Specific Limits

#### Authentication Endpoints (`/api/auth/*`)

- **Limit**: 5 requests per 15 minutes
- **Purpose**: Prevent brute force attacks on login/registration

#### Booking Endpoints (`/api/bookings`)

- **Limit**: 20 requests per 15 minutes
- **Purpose**: Prevent booking system abuse

#### Export Endpoints (`/api/export/*`)

- **Limit**: 3 requests per hour
- **Purpose**: Prevent resource-intensive export operations

#### Socket.IO Connections

- **Limit**: 5 connections per minute
- **Purpose**: Prevent Socket.IO connection flooding

## Abuse Protection

### Gradual Penalty System

The system implements a three-tier penalty escalation:

1. **First Violation** (Penalty Level 1)
   - Warning logged
   - No ban applied
   - User can continue with requests

2. **Second Violation** (Penalty Level 2)
   - 5-minute temporary ban
   - `429 Too Many Requests` response
   - `Retry-After` header set to ban duration

3. **Third+ Violation** (Penalty Level 3)
   - 1-hour temporary ban
   - `429 Too Many Requests` response
   - `Retry-After` header set to ban duration

### Suspicious Pattern Detection

The system automatically detects and flags:

#### 1. Rapid Requests

- **Detection**: More than 10 requests in 1 second
- **Action**: Flagged in violation record
- **Storage**: `suspiciousPatterns.rapidRequests: true`

#### 2. Large Payloads

- **Detection**: Content-Length > 10MB
- **Action**: Request rejected with `413 Payload Too Large`
- **Storage**: `suspiciousPatterns.largePayload: true`

#### 3. Suspicious Bots

- **Detection**: User-Agent matches known bot patterns
- **Patterns**: `bot`, `crawler`, `spider`, `scraper`, `curl`, `wget`, `python-requests`, `scrapy`
- **Action**: Flagged in violation record
- **Storage**: `suspiciousPatterns.suspiciousBot: true`

## Whitelist Mechanism

### Path Whitelist

The following paths are automatically whitelisted (no rate limiting):

- `/health` - Health check endpoint
- `/metrics` - Prometheus metrics endpoint
- `/api/health` - API health check

### IP Whitelist

Configure IP whitelist via environment variable:

```env
RATE_LIMIT_WHITELIST=192.168.1.1,10.0.0.0/8,172.16.0.1
```

### Development Bypass

In development mode, rate limiting can be disabled:

```env
NODE_ENV=development
SKIP_RATE_LIMIT=true
```

## API Response Headers

All requests include rate limit information in response headers:

### Standard Headers

- `X-RateLimit-Limit` - Maximum requests allowed in the window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - ISO 8601 timestamp when the limit resets

### On Rate Limit Exceeded

- `Retry-After` - Seconds until the client can retry
- HTTP Status: `429 Too Many Requests`

### Example Response

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-01T12:15:00.000Z
Retry-After: 300

{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 300,
  "limit": 100,
  "window": 900,
  "violationCount": 1
}
```

## Admin Controls

### API Endpoints

All admin endpoints require authentication and admin role.

#### 1. View Violations

```
GET /api/admin/rate-limits/violations
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)
- `isBanned` - Filter by ban status (true/false)
- `identifierType` - Filter by type (ip/userId)
- `sortBy` - Sort field (default: lastViolationAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "violations": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

#### 2. View Blocked IPs/Users

```
GET /api/admin/rate-limits/blocked
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blocked": [...],
    "count": 5
  }
}
```

#### 3. Unblock IP/User

```
POST /api/admin/rate-limits/unblock
```

**Request Body:**
```json
{
  "identifier": "ip:192.168.1.1",
  "endpoint": "/api/auth/login"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully unblocked 1 violation(s)",
    "unblocked": 1
  }
}
```

#### 4. View Statistics

```
GET /api/admin/rate-limits/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalViolations": 1250,
      "activeBans": 15,
      "recentViolations": 45
    },
    "byEndpoint": [
      {
        "_id": "/api/auth/login",
        "count": 523,
        "activeBans": 8
      }
    ],
    "byType": [
      {
        "_id": "ip",
        "count": 980
      },
      {
        "_id": "userId",
        "count": 270
      }
    ],
    "suspiciousPatterns": {
      "rapidRequests": 125,
      "largePayload": 45,
      "suspiciousBot": 230
    }
  }
}
```

#### 5. View Real-Time Metrics

```
GET /api/admin/rate-limits/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "realtime": {
      "violationsPerHour": 45,
      "violationsPerMinute": 2
    },
    "trend": [
      {
        "_id": "2024-01-01 12:00",
        "count": 15
      }
    ]
  }
}
```

#### 6. Add Notes to Violation

```
PUT /api/admin/rate-limits/violations/:id/notes
```

**Request Body:**
```json
{
  "notes": "Whitelisted for testing purposes"
}
```

## Alert System

### Logging

All rate limit violations are logged with the following information:

- Identifier (IP or User ID)
- Endpoint
- Violation count
- Penalty level
- Suspicious patterns detected

**Log Level**: `WARN`

**Example Log:**
```
[WARN] Rate limit violation: {
  identifier: "ip:192.168.1.1",
  endpoint: "/api/auth/login",
  violationCount: 2,
  penaltyLevel: 2,
  patterns: {
    rapidRequests: true,
    largePayload: false,
    suspiciousBot: false
  }
}
```

### Email/Webhook Alerts (Future Enhancement)

For production deployments, configure webhook alerts for:

- 3+ violations from same identifier in 1 hour
- 10+ active bans simultaneously
- Suspicious bot pattern detection spikes

## Configuration

### Environment Variables

```env
# Redis Configuration (required for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Cache Configuration
CACHE_ENABLED=true

# Rate Limit Configuration
RATE_LIMIT_WHITELIST=192.168.1.1,10.0.0.1
SKIP_RATE_LIMIT=false  # Set to true in development to disable

# Trust Proxy (required for accurate IP detection behind load balancer)
TRUST_PROXY=true
```

### Customizing Limits

Edit `/backend/middlewares/advancedRateLimit.mjs`:

```javascript
const RATE_LIMITS = {
  anonymous: {
    window: 15 * 60, // 15 minutes in seconds
    maxRequests: 100,
  },
  authenticated: {
    window: 15 * 60,
    maxRequests: 500,
  },
  endpoints: {
    '/api/auth': {
      window: 15 * 60,
      maxRequests: 5,
    },
    // Add more endpoints...
  },
};
```

## Usage Examples

### Applying to Routes

#### Global Rate Limiter

```javascript
import { advancedRateLimiter } from './middlewares/advancedRateLimit.mjs';

// Apply to all routes
app.use(advancedRateLimiter);
```

#### Endpoint-Specific Limiter

```javascript
import { createEndpointLimiter } from './middlewares/advancedRateLimit.mjs';

// 10 requests per 5 minutes
const customLimiter = createEndpointLimiter(10, 300);
router.post('/api/custom', customLimiter, controller);
```

#### Socket.IO Limiter

```javascript
import { socketRateLimiter } from './middlewares/socketRateLimiter.mjs';

io.use(socketRateLimiter);
```

## Monitoring and Debugging

### Check Rate Limit Status

Use Redis CLI to inspect rate limit keys:

```bash
# List all rate limit keys
redis-cli KEYS "gnb:ratelimit:*"

# View specific key
redis-cli ZRANGE "gnb:ratelimit:ip:192.168.1.1:/api/auth/login" 0 -1 WITHSCORES

# Check TTL
redis-cli TTL "gnb:ratelimit:ip:192.168.1.1:/api/auth/login"
```

### Database Queries

Query violation records:

```javascript
// Find all violations for an IP
await RateLimitViolation.find({ identifier: 'ip:192.168.1.1' });

// Find all currently banned
await RateLimitViolation.find({ 
  isBanned: true,
  banExpiresAt: { $gt: new Date() }
});

// Get statistics
const stats = await RateLimitViolation.getStats();
```

## Security Best Practices

1. **Always set TRUST_PROXY** in production behind a load balancer
2. **Use HTTPS** to prevent header spoofing
3. **Monitor violations** regularly for attack patterns
4. **Adjust limits** based on your application's legitimate usage patterns
5. **Keep whitelist minimal** - only essential internal services
6. **Enable Redis persistence** for production deployments
7. **Set up alerts** for unusual violation spikes
8. **Regular audit** of banned IPs to identify false positives

## Troubleshooting

### Rate Limiting Not Working

1. Check Redis connection:
   ```javascript
   import { pingRedis } from './config/redis.mjs';
   await pingRedis(); // Should return true
   ```

2. Verify middleware is applied:
   ```javascript
   // Should be before route handlers
   app.use(advancedRateLimiter);
   app.use('/api', routes);
   ```

3. Check for whitelist bypass:
   ```env
   SKIP_RATE_LIMIT=false
   RATE_LIMIT_WHITELIST=  # Empty or remove unwanted IPs
   ```

### False Positives

If legitimate users are being rate-limited:

1. Increase limits for authenticated users
2. Add specific IPs to whitelist
3. Create custom endpoint limits for high-traffic routes
4. Check for misconfigured reverse proxy (trust proxy settings)

### Redis Unavailable

The system automatically falls back to in-memory rate limiting. However:

- In-memory limits are per-instance (not distributed)
- Limits reset on server restart
- For production, ensure Redis high availability

## Performance Considerations

### Redis Load

- Each request performs 3-4 Redis operations
- Use Redis pipelining (already implemented)
- Consider Redis Cluster for high traffic (>10k req/s)

### Database Load

- Violations are only written on limit exceeds
- TTL index auto-cleans old records (30 days)
- Consider archiving old violations for analytics

### Memory Usage

- In-memory fallback: ~1KB per unique identifier
- Automatic cleanup every 60 seconds
- Monitor with admin metrics endpoint

## Future Enhancements

- [ ] Distributed ban list with Redis pub/sub
- [ ] Machine learning-based anomaly detection
- [ ] Geographic rate limiting
- [ ] Dynamic limit adjustment based on server load
- [ ] Rate limit visualization dashboard
- [ ] CAPTCHA integration for borderline cases
- [ ] Webhook alerts for critical violations
- [ ] IP reputation scoring integration

## Support

For issues or questions about rate limiting:

1. Check logs for detailed violation information
2. Use admin API to inspect violation records
3. Monitor Redis keys for debugging
4. Review this documentation for configuration options

## License

This rate limiting system is part of GNB Transfer and follows the same license.
