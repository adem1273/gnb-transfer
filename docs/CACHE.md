# Redis Cache Layer Documentation

## Overview

The GNB Transfer backend implements a comprehensive Redis-based caching layer with automatic invalidation and graceful degradation. The cache system improves API response times and reduces database load while maintaining data consistency.

## Architecture

### Components

1. **Redis Configuration** (`backend/config/redis.mjs`)
   - Redis connection manager with retry logic
   - Automatic reconnection on failures
   - Connection health monitoring
   - Graceful shutdown handling

2. **Cache Utility** (`backend/utils/cache.mjs`)
   - Core cache operations (get, set, delete, clear)
   - Tag-based cache invalidation
   - Pattern-based key deletion
   - Cache hit/miss metrics tracking
   - In-memory fallback when Redis unavailable

3. **Cache Middleware** (`backend/middlewares/cacheMiddleware.mjs`)
   - Express middleware for response caching
   - Custom cache key generation
   - User-specific cache support
   - Automatic cache invalidation on mutations

4. **Model Hooks**
   - Mongoose post-save/update/delete hooks
   - Automatic tag invalidation on data changes

## Cache Strategy

### Key Prefixing

All cache keys use the prefix `gnb:cache:` to:
- Avoid key collisions with other Redis data
- Enable efficient pattern-based operations
- Improve cache organization

Example: `gnb:cache:route:/api/tours`

### TTL Configuration

| Endpoint | TTL | Reason |
|----------|-----|--------|
| `GET /api/tours` | 5 min (300s) | Tour data changes moderately |
| `GET /api/blog` | 1 hour (3600s) | Blog content changes rarely |
| `GET /api/pricing/calc` | 10 min (600s) | Pricing rules update occasionally |
| `GET /api/admin/settings/public` | 1 hour (3600s) | Settings change infrequently |
| `GET /api/bookings` | 5 min (300s) | Booking data updates frequently |

### Tag-Based Invalidation

Tags group related cache entries for efficient invalidation:

- `tours` - All tour-related endpoints
  - `tours:list` - Tour list endpoint
  - `tours:campaigns` - Campaign tours
  - `tours:popular` - Popular tours
- `blog` - All blog-related endpoints
  - `blog:list` - Blog list
  - `blog:categories` - Category list
- `bookings` - All booking-related endpoints
  - `bookings:list` - Booking list
- `settings` - All settings endpoints
  - `settings:public` - Public settings

### Invalidation Rules

#### Automatic Invalidation

Cache is automatically invalidated when:

1. **Tour Model Changes**
   - Tag invalidated: `tours`
   - Triggers: save, update, delete operations
   - Affected endpoints: All tour endpoints

2. **Blog Model Changes**
   - Tag invalidated: `blog`
   - Triggers: save, update, delete operations
   - Affected endpoints: All blog endpoints

3. **Booking Model Changes**
   - Tag invalidated: `bookings`
   - Triggers: save, update, delete operations
   - Affected endpoints: All booking endpoints

4. **Settings Model Changes**
   - Tag invalidated: `settings`
   - Triggers: save, update operations
   - Affected endpoints: All settings endpoints

#### Manual Invalidation

Admins can manually clear cache via:
- `POST /api/admin/cache/clear` - Clears all cache entries
- Useful after bulk data imports or critical updates

## Configuration

### Environment Variables

```bash
# Redis connection URL (optional - uses in-memory cache if not set)
REDIS_URL=redis://localhost:6379

# Enable/disable cache (default: true in production, false in development)
CACHE_ENABLED=true

# Default cache TTL in seconds (fallback value)
CACHE_TTL=3600

# Cache cleanup check period in seconds
CACHE_CHECK_PERIOD=600
```

### Redis URL Format

```
redis://[:password@]host[:port][/database]
```

Examples:
- Local: `redis://localhost:6379`
- With password: `redis://:mypassword@localhost:6379`
- Remote: `redis://user:password@redis.example.com:6379/0`

## Graceful Degradation

The cache system gracefully handles Redis failures:

1. **Redis Unavailable**
   - Falls back to in-memory cache (Map-based)
   - Logs warning but continues operation
   - Memory cache has periodic cleanup (every 2 minutes)

2. **Redis Connection Lost**
   - Automatic retry with exponential backoff
   - Max 10 retry attempts with jitter
   - Switches to in-memory cache during outage

3. **Cache Operation Errors**
   - Errors are logged but don't break requests
   - Application continues without caching
   - Metrics track error count

## Monitoring & Metrics

### Available Metrics

Access via `GET /api/admin/cache/stats`:

```json
{
  "success": true,
  "data": {
    "cache": {
      "type": "redis",
      "connected": true,
      "metrics": {
        "hits": 1250,
        "misses": 350,
        "sets": 380,
        "deletes": 45,
        "errors": 2,
        "hitRate": "78.13%"
      },
      "memory": {
        "entries": 0,
        "taggedEntries": 0
      }
    },
    "redis": {
      "enabled": true,
      "connected": true,
      "status": "ready",
      "connectionAttempts": 0,
      "type": "redis"
    }
  }
}
```

### Cache Headers

Responses include cache status headers:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response generated and cached

### Admin Dashboard

Cache metrics are included in `GET /api/admin/stats`:
- Hit rate percentage
- Total hits and misses
- Cache size
- Redis connection status

## Usage Examples

### Basic Cache Usage

```javascript
// In routes
import { cacheResponse } from '../middlewares/cacheMiddleware.mjs';

// Cache for 5 minutes (300 seconds)
router.get('/tours', cacheResponse(300), async (req, res) => {
  const tours = await Tour.find();
  res.json(tours);
});
```

### Cache with Tags

```javascript
// Cache with tags for grouped invalidation
router.get('/tours', cacheResponse(300, { 
  tags: ['tours', 'tours:list'] 
}), async (req, res) => {
  const tours = await Tour.find();
  res.json(tours);
});
```

### User-Specific Cache

```javascript
// Cache varies by authenticated user
router.get('/bookings', 
  requireAuth(['admin']),
  cacheResponse(300, { 
    tags: ['bookings'],
    varyByUser: true 
  }), 
  async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
  }
);
```

### Custom Key Generation

```javascript
// Custom cache key based on query parameters
router.get('/search', cacheResponse(300, {
  keyGenerator: (req) => `search:${req.query.q}:${req.query.category}`
}), async (req, res) => {
  // Search logic
});
```

### Cache Invalidation on Mutation

```javascript
import { clearCacheByTags } from '../middlewares/cacheMiddleware.mjs';

// Clear tour cache when creating/updating tours
router.post('/tours', 
  requireAuth(['admin']),
  clearCacheByTags(['tours']),
  async (req, res) => {
    const tour = await Tour.create(req.body);
    res.json(tour);
  }
);
```

### Direct Cache Operations

```javascript
import { get, set, invalidateTag, clear } from '../utils/cache.mjs';

// Get from cache
const data = await get('my-key');

// Set with TTL and tags
await set('my-key', data, 600, ['my-tag']);

// Invalidate by tag
await invalidateTag('my-tag');

// Clear all cache
await clear();
```

## Performance Impact

### Before Cache (Average Response Times)
- `GET /api/tours`: ~150ms
- `GET /api/blog`: ~200ms
- `GET /api/bookings`: ~180ms

### After Cache (Average Response Times)
- Cache Hit: ~5-10ms (95% faster)
- Cache Miss: ~150-200ms (same as before, but cached for next request)

### Expected Hit Rates
- Tour endpoints: 70-80% (moderate changes)
- Blog endpoints: 85-95% (rare changes)
- Settings endpoints: 90-95% (very rare changes)
- Booking endpoints: 60-70% (frequent changes)

## Best Practices

1. **TTL Selection**
   - Short TTL (1-5 min) for frequently changing data
   - Medium TTL (10-30 min) for moderate changes
   - Long TTL (1+ hour) for rarely changing data

2. **Tag Organization**
   - Use hierarchical tags (e.g., `tours`, `tours:list`)
   - Tag granularity should match invalidation needs
   - Don't over-tag (affects invalidation performance)

3. **Cache Keys**
   - Keep keys descriptive but concise
   - Include version in key for breaking changes
   - Use consistent naming patterns

4. **Monitoring**
   - Track hit rates regularly
   - Alert on high error rates
   - Monitor memory usage for fallback cache

5. **Testing**
   - Test both cache hit and miss scenarios
   - Verify invalidation triggers correctly
   - Test graceful degradation without Redis

## Troubleshooting

### Low Hit Rate
- Check TTL configuration (may be too short)
- Verify cache is not being invalidated too frequently
- Review cache key generation (ensure consistency)

### High Memory Usage (In-Memory Fallback)
- Redis connection may be failing
- Check Redis URL configuration
- Verify Redis server is running
- Review cleanup interval settings

### Stale Data
- Verify model hooks are triggering
- Check tag configuration on endpoints
- Ensure invalidation middleware is applied
- Test manual cache clear

### Cache Not Working
- Verify `CACHE_ENABLED` is true
- Check Redis connection in logs
- Ensure middleware is applied to routes
- Test with direct cache operations

## Security Considerations

1. **Cache Poisoning Prevention**
   - Only cache GET requests
   - Validate cache keys
   - Don't cache authentication tokens

2. **User Data Isolation**
   - Use `varyByUser` for user-specific data
   - Include user ID in cache keys when needed
   - Never cache sensitive data without encryption

3. **Admin Access**
   - Cache clear endpoint requires admin role
   - Log all cache clear operations
   - Audit cache access patterns

## Future Enhancements

Potential improvements:
- [ ] Cache warming on server start
- [ ] Distributed cache invalidation (multi-server)
- [ ] Advanced cache strategies (LRU, LFU)
- [ ] Cache compression for large responses
- [ ] Cache analytics and visualization
- [ ] Automatic TTL optimization based on hit rates

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Caching Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/caching)
