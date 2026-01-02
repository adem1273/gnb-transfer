# Rate Limiting Quick Start Guide

This guide helps you quickly configure and understand the rate limiting system in GNB Transfer.

## Quick Setup

### 1. Required Environment Variables

Add to your `backend/.env`:

```env
# Redis (recommended for production)
REDIS_URL=redis://localhost:6379

# Trust proxy (required in production)
TRUST_PROXY=true

# Cache (enables Redis caching)
CACHE_ENABLED=true
```

### 2. Optional Configuration

```env
# Whitelist internal services
RATE_LIMIT_WHITELIST=192.168.1.1,10.0.0.1

# Development bypass (dev only)
SKIP_RATE_LIMIT=false
```

## Default Rate Limits

| User Type | Limit | Window | Identifier |
|-----------|-------|--------|------------|
| Anonymous | 100 requests | 15 minutes | IP address |
| Authenticated | 500 requests | 15 minutes | User ID |

## Endpoint-Specific Limits

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/*` | 5 requests | 15 minutes | Prevent brute force |
| `/api/bookings` | 20 requests | 15 minutes | Prevent booking abuse |
| `/api/export/*` | 3 requests | 1 hour | Rate limit expensive operations |
| Socket.IO | 5 connections | 1 minute | Prevent connection flooding |

## Penalty System

1. **First Violation**: Warning logged (no ban)
2. **Second Violation**: 5-minute ban
3. **Third+ Violation**: 1-hour ban

Bans expire automatically. Admins can manually unblock users via the API.

## Admin API Endpoints

All endpoints require authentication and admin role.

### View Violations

```bash
GET /api/admin/rate-limits/violations?page=1&limit=50
```

### View Blocked Users

```bash
GET /api/admin/rate-limits/blocked
```

### Unblock a User

```bash
POST /api/admin/rate-limits/unblock
Content-Type: application/json

{
  "identifier": "ip:192.168.1.1",
  "endpoint": "/api/auth/login"
}
```

### View Statistics

```bash
GET /api/admin/rate-limits/stats
```

### View Real-Time Metrics

```bash
GET /api/admin/rate-limits/metrics
```

## Response Headers

All requests include:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When the limit resets (ISO 8601)

When rate limit exceeded:

- `Retry-After`: Seconds until retry allowed
- HTTP Status: `429 Too Many Requests`

## Common Scenarios

### Scenario 1: User Exceeds Anonymous Limit

1. User makes 101 requests in 15 minutes
2. System returns `429 Too Many Requests`
3. Response includes `Retry-After` header
4. First violation logged (warning, no ban)

### Scenario 2: Brute Force Attack on Login

1. Attacker tries login 6 times in 15 minutes
2. First 5 attempts allowed
3. 6th attempt blocked (1st violation - warning)
4. 7th attempt blocked (2nd violation - 5min ban)
5. Further attempts blocked until ban expires

### Scenario 3: Legitimate User Authenticated

1. User logs in successfully
2. Rate limit switches from IP-based to user-based
3. User gets 500 requests per 15 minutes
4. IP-based limit still applies to their IP for other requests

## Troubleshooting

### Rate Limiting Not Working

1. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return PONG
   ```

2. Verify `TRUST_PROXY` is set correctly (especially in production)

3. Check middleware order in server.mjs (rate limiter should be before routes)

### False Positives

If legitimate users are being rate-limited:

1. Check if they're behind a shared proxy/VPN
2. Increase limits for authenticated users
3. Add their IP to whitelist if internal
4. Consider custom endpoint limits

### Redis Unavailable

The system automatically falls back to in-memory rate limiting. However:

- Limits are per-instance (not distributed)
- Limits reset on server restart
- Not recommended for production

## Best Practices

1. **Always use Redis in production** for distributed rate limiting
2. **Set TRUST_PROXY=true** when behind a reverse proxy
3. **Monitor violations regularly** using admin API
4. **Whitelist health check endpoints** to avoid false alerts
5. **Adjust limits** based on your application's usage patterns
6. **Enable Redis persistence** for production deployments

## Testing

### Test Rate Limits Locally

```bash
# Install dependencies
cd backend
npm install

# Run tests
npm test tests/advancedRateLimit.test.mjs
npm test tests/rateLimitIntegration.test.mjs
```

### Manual Testing with curl

```bash
# Test anonymous limit
for i in {1..105}; do
  curl -i http://localhost:5000/api/tours
done

# Test auth limit
for i in {1..6}; do
  curl -i -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
done
```

## Security Considerations

1. **Never disable rate limiting in production**
2. **Keep whitelist minimal** (only essential services)
3. **Monitor violation logs** for attack patterns
4. **Regularly review banned IPs** for false positives
5. **Use HTTPS** to prevent header spoofing
6. **Set up alerts** for unusual violation spikes

## Documentation

For complete documentation, see:

- [Full Rate Limiting Documentation](./RATE_LIMITING.md)
- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [API Documentation](http://localhost:5000/api/v1/api-docs)

## Support

For issues or questions:

1. Check logs for detailed violation information
2. Use admin API to inspect violation records
3. Review Redis keys for debugging
4. Refer to full documentation for advanced configuration
