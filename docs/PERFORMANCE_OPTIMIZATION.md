# Performance & Cost Optimization Guide

## Overview
This document describes the performance and cost optimizations implemented in GNB Transfer to achieve 2x faster operation with 30%+ lower monthly costs.

## Implemented Optimizations

### 1. MongoDB Database Optimization

#### New Indexes Added
**User Model:**
- `email` (1) - Fast email lookups
- `role` (1) - Role-based queries
- `preferences.language` (1) - Language filtering

**Booking Model:**
- `user` (1) + `status` (1) - User's bookings by status
- `tour` (1) + `date` (1) - Tour availability
- `date` (1) - Date-based queries
- `createdAt` (-1) - Recent bookings
- `user` (1) + `createdAt` (-1) - User booking history

**Tour Model:**
- `price` (1) - Price filtering
- `duration` (1) - Duration-based queries
- `createdAt` (-1) - Recent tours

#### Query Optimization
- Added `.lean()` to 15+ read-only queries for 30-50% faster execution
- Optimized aggregation pipelines with proper index usage
- Limited result sets with appropriate `.limit()` values

**Expected Impact:**
- 30-50% faster query execution
- Reduced memory usage
- Better scalability

### 2. Server-Side Caching

#### Cache Strategy
Using `node-cache` in-memory caching with TTL (Time To Live):

**Tours:**
- `/api/tours` - 10 minutes (600s)
- `/api/tours/campaigns` - 15 minutes (900s)
- `/api/tours/most-popular` - 30 minutes (1800s)
- `/api/tours/:id` - 15 minutes (900s)

**Bookings:**
- `/api/bookings` - 5 minutes (300s)
- `/api/bookings/:id` - 5 minutes (300s)

**Packages:**
- `/api/packages/my-recommendation` - 10 minutes (600s)

**Delay Metrics:**
- `/api/delay/:bookingId` - 10 minutes (600s)
- `/api/delay/admin/all` - 5 minutes (300s)

#### Cache Invalidation
Cache is automatically cleared on:
- Tour create/update/delete
- Booking create/update/delete
- Delay calculation

**Expected Impact:**
- 50-70% faster response times for cached endpoints
- 60-80% cache hit rate for frequently accessed data
- Reduced database load

### 3. AI API Batch Processing

#### Batch Service Features
- **Request Queuing**: Collects requests for 2 seconds before processing
- **Batch Size**: Processes up to 10 requests together
- **Deduplication**: Uses MD5 hashing to identify duplicate requests
- **Caching**: Stores responses for 1 hour
- **Parallel Processing**: Processes batch requests in parallel

#### Cost Optimization
**Before:**
- Each chat message = 1 API call
- Each intent classification = 1 API call
- Each tour recommendation = 1 API call
- Each translation = 1 API call

**After:**
- Multiple requests batched together (up to 10)
- Duplicate requests served from cache
- Identical requests deduplicated

**Expected Impact:**
- 40% reduction in OpenAI API costs
- Faster response times due to caching
- Better handling of concurrent requests

### 4. Frontend Optimization

#### Lazy Loading
**Lazy Loaded Components:**
- LiveChat (8.91 kB)
- Feedback (3.08 kB)
- All page components
- All admin components
- Stripe payment components

**Eager Loaded (Critical):**
- Header
- Footer
- Sidebar
- Loading component

#### Code Splitting
**Vendor Chunks:**
- react-vendor: 176.70 kB (gzip: 57.23 kB)
- animation-vendor: 78.44 kB (gzip: 24.44 kB)
- i18n-vendor: 55.01 kB (gzip: 16.14 kB)
- api-vendor: 35.79 kB (gzip: 14.03 kB)
- stripe-vendor: 1.91 kB (gzip: 0.89 kB)

#### Image Optimization
**OptimizedImage Component:**
- Native lazy loading (`loading="lazy"`)
- WebP format support with fallbacks
- Responsive images with `srcSet` and `sizes`
- Error handling with SVG placeholders
- Smooth fade-in transitions

#### Compression
- Gzip: 60-70% size reduction
- Brotli: 75-80% size reduction

**Expected Impact:**
- 40-50% faster initial page load
- Reduced bandwidth usage
- Better mobile performance

### 5. Error Handling

#### ErrorBoundary
- Catches errors in lazy-loaded components
- Prevents full app crashes
- User-friendly error messages
- Reload functionality

**Expected Impact:**
- Better user experience
- Reduced support requests
- Easier debugging

## Performance Metrics

### Expected Improvements

**Backend:**
- Database queries: 30-50% faster
- Cached endpoints: 50-70% faster
- AI API costs: 40% reduction

**Frontend:**
- Initial load: 40-50% faster
- Bundle size: Optimized with code splitting
- Image loading: Deferred until visible

**Overall:**
- **Performance**: 2x faster operation
- **Cost**: 30%+ reduction in monthly costs

## Monitoring

### Cache Statistics
Access cache stats at: `GET /api/health`

```json
{
  "cache": {
    "keys": 45,
    "hits": 234,
    "misses": 89,
    "ksize": 45,
    "vsize": 1024000
  }
}
```

### Batch Processing Statistics
The batch service logs:
- Queue length
- Cache hits
- Processing time
- API call reduction

Check console logs for:
```
[AI Batch] Processing 10 requests
[AI Batch] Cache hit
[AI Batch] Added to queue (5 pending)
```

## Best Practices

### When to Use Caching
✅ **Do cache:**
- Read-only endpoints
- Expensive database queries
- Aggregations
- Static or slowly changing data

❌ **Don't cache:**
- User-specific mutations
- Real-time data
- Authentication responses
- Payment transactions

### When to Use .lean()
✅ **Do use .lean():**
- Read-only queries
- API responses
- Data transformations
- Aggregations

❌ **Don't use .lean():**
- When you need to call `.save()`
- When using Mongoose methods
- When modifying documents
- Before calling model instance methods

### When to Use Batch Processing
✅ **Do batch:**
- Non-urgent AI requests
- Multiple similar requests
- Chat messages
- Translations

❌ **Don't batch:**
- Critical real-time requests
- Single high-priority requests
- Time-sensitive operations

## Troubleshooting

### High Cache Memory Usage
If cache grows too large:
1. Reduce TTL values
2. Clear cache manually: `clearAllCache()`
3. Implement LRU eviction policy

### Low Cache Hit Rate
If hit rate is below 40%:
1. Increase TTL values
2. Check cache key consistency
3. Review cache invalidation logic

### Slow Batch Processing
If batch processing is slow:
1. Reduce `BATCH_DELAY_MS` (currently 2000ms)
2. Increase `MAX_BATCH_SIZE` (currently 10)
3. Check API response times

## Future Improvements

### Potential Enhancements
1. **Redis Cache**: Replace node-cache with Redis for distributed caching
2. **CDN**: Use CDN for static assets and images
3. **Image Optimization**: Implement automatic WebP conversion
4. **Service Worker**: Add offline support and caching
5. **GraphQL**: Consider GraphQL for more efficient data fetching
6. **Database Sharding**: Implement sharding for horizontal scaling

### Cost Reduction Ideas
1. **AI Model**: Switch to smaller models for simple tasks
2. **Database**: Use MongoDB Atlas free tier or self-hosted
3. **Hosting**: Use serverless functions for API
4. **Image Storage**: Use free-tier object storage (Cloudflare R2)

## Support

For questions or issues related to these optimizations:
1. Check console logs for errors
2. Review cache statistics in `/api/health`
3. Monitor API usage in OpenAI dashboard
4. Check MongoDB indexes with `db.collection.getIndexes()`

## Changelog

### v1.0.0 - 2024-11-07
- Initial implementation of all optimizations
- Added 10+ database indexes
- Implemented server-side caching
- Created AI batch processing service
- Frontend lazy loading and code splitting
- Image optimization components
- Error boundaries
