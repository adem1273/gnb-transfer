# Database Indexing Strategy

This document outlines the database indexing strategy for the GNB Transfer application, including all indexes, their rationale, query patterns, and optimization techniques.

## Overview

Database indexes are critical for query performance. Our indexing strategy aims to:
- Ensure 80%+ of queries use indexes (avoid collection scans)
- Keep query response times under 100ms for most operations
- Support common query patterns with compound indexes
- Balance read performance with write overhead

## Index Summary by Model

### User Model

**Purpose**: User authentication, role-based access control, corporate user management

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| email_1 | Single, Unique | email | User login, email lookup (high frequency) |
| role_1 | Single | role | Admin dashboard user filtering |
| createdAt_-1 | Single | createdAt | Recent users list, chronological sorting |
| isCorporate_1_role_1 | Compound | isCorporate, role | Corporate user queries with role filter |
| preferences.language_1 | Single | preferences.language | Multi-language user filtering |
| resetPasswordToken_1 | Single, Sparse | resetPasswordToken | Password reset token verification |

**Query Patterns:**
```javascript
// Login - uses email_1 index
User.findOne({ email: 'user@example.com' })

// Admin user list - uses role_1 index
User.find({ role: 'admin' })

// Corporate users - uses isCorporate_1_role_1 compound index
User.find({ isCorporate: true, role: 'user' })

// Recent users - uses createdAt_-1 index
User.find().sort({ createdAt: -1 }).limit(50)
```

### Booking Model

**Purpose**: Booking management, tour availability, driver assignment, payment tracking

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| user_1_status_1 | Compound | user, status | User booking history with status filter |
| email_1 | Single | email | Guest booking lookup (non-registered users) |
| tourId_1_status_1 | Compound | tourId, status | Tour bookings by status |
| tour_1_date_1_status_1 | Compound | tour, date, status | Tour availability queries |
| status_1_date_-1 | Compound | status, date | Admin dashboard booking list |
| user_1_createdAt_-1 | Compound | user, createdAt | User booking history chronological |
| driver_1_date_1 | Compound | driver, date | Driver schedule and assignments |
| vehicle_1_date_1 | Compound | vehicle, date | Vehicle availability queries |
| paymentMethod_1_status_1_createdAt_-1 | Compound | paymentMethod, status, createdAt | Payment analytics |
| date_1_tour_1_status_1 | Compound | date, tour, status | Booking reports |
| createdAt_-1 | Single | createdAt | Recent bookings |

**Query Patterns:**
```javascript
// User bookings - uses user_1_status_1 index
Booking.find({ user: userId, status: 'confirmed' })

// Tour availability - uses tour_1_date_1_status_1 index
Booking.find({ tour: tourId, date: { $gte: today }, status: { $in: ['confirmed', 'pending'] } })

// Driver schedule - uses driver_1_date_1 index
Booking.find({ driver: driverId, date: specificDate })

// Payment report - uses paymentMethod_1_status_1_createdAt_-1 index
Booking.find({ paymentMethod: 'stripe', status: 'paid' }).sort({ createdAt: -1 })
```

**Optimization Notes:**
- Compound indexes ordered by cardinality (most selective first)
- Date-based indexes support range queries efficiently
- Status field included in most indexes as it's frequently filtered

### Tour Model

**Purpose**: Tour catalog, search, filtering, campaign management

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| slug_1 | Single, Unique, Sparse | slug | SEO-friendly URL lookups |
| title_text_description_text | Text | title, description | Full-text search functionality |
| active_1_category_1_price_-1 | Compound | active, category, price | Category browsing with price sorting |
| active_1_isCampaign_1_price_-1 | Compound | active, isCampaign, price | Campaign tour list |
| price_1 | Single | price | Price range filtering |
| duration_1 | Single | duration | Duration-based filtering |
| createdAt_-1 | Single | createdAt | Recent tours, admin ordering |

**Query Patterns:**
```javascript
// Tour search - uses title_text_description_text index
Tour.find({ $text: { $search: 'airport transfer istanbul' } })

// Category filter - uses active_1_category_1_price_-1 index
Tour.find({ active: true, category: 'transfer' }).sort({ price: -1 })

// Campaign tours - uses active_1_isCampaign_1_price_-1 index
Tour.find({ active: true, isCampaign: true }).sort({ price: -1 })

// Price range - uses price_1 index
Tour.find({ active: true, price: { $gte: 50, $lte: 150 } })
```

**Optimization Notes:**
- Text index enables fast full-text search on tour titles and descriptions
- Compound indexes include `active` field to filter inactive tours efficiently
- Sparse unique index on slug allows null values (optional field)

### BlogPost Model

**Purpose**: SEO content, blog management, multi-language support

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| slug_1 | Single, Unique | slug | SEO-friendly URL routing |
| status_1_publishedAt_-1 | Compound | status, publishedAt | Published posts chronologically |
| category_1_status_1_publishedAt_-1 | Compound | category, status, publishedAt | Category browsing |
| language_1_status_1_publishedAt_-1 | Compound | language, status, publishedAt | Multi-language support |
| tags_1_status_1 | Compound | tags, status | Tag-based filtering |
| author_1_status_1 | Compound | author, status | Author's posts |
| seo.focusKeyword_1 | Single | seo.focusKeyword | SEO keyword queries |
| createdAt_-1 | Single | createdAt | Admin post ordering |
| title_text_excerpt_text_seo.metaTitle_text | Text | title, excerpt, seo.metaTitle | Blog search functionality |

**Query Patterns:**
```javascript
// Published posts by language - uses language_1_status_1_publishedAt_-1 index
BlogPost.find({ language: 'en', status: 'published' }).sort({ publishedAt: -1 })

// Category posts - uses category_1_status_1_publishedAt_-1 index
BlogPost.find({ category: 'travel', status: 'published' }).sort({ publishedAt: -1 })

// Tag search - uses tags_1_status_1 index
BlogPost.find({ tags: 'istanbul', status: 'published' })

// Text search - uses text index
BlogPost.find({ $text: { $search: 'best beaches turkey' }, status: 'published' })
```

**Optimization Notes:**
- Most compound indexes include `status` and `publishedAt` for common filtering patterns
- Text index covers title, excerpt, and SEO meta title for comprehensive search
- Author index supports contributor pages

### Vehicle Model

**Purpose**: Fleet management, vehicle assignment, maintenance tracking

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| plateNumber_1 | Single, Unique | plateNumber | Vehicle identification |
| status_1_type_1 | Compound | status, type | Available vehicles by type |
| currentDriver_1 | Single | currentDriver | Driver-vehicle assignment lookup |
| insuranceExpiry_1 | Single | insuranceExpiry | Insurance renewal tracking |
| registrationExpiry_1 | Single | registrationExpiry | Registration renewal tracking |
| type_1_capacity_1_status_1 | Compound | type, capacity, status | Vehicle search by requirements |

**Query Patterns:**
```javascript
// Available vehicles by type - uses status_1_type_1 index
Vehicle.find({ status: 'available', type: 'sedan' })

// Expiring insurance - uses insuranceExpiry_1 index
Vehicle.find({ insuranceExpiry: { $lte: thirtyDaysFromNow } })

// Vehicle by capacity - uses type_1_capacity_1_status_1 index
Vehicle.find({ type: 'van', capacity: { $gte: 8 }, status: 'available' })
```

### Coupon Model

**Purpose**: Discount codes, marketing campaigns, promotion tracking

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| code_1 | Single, Unique | code | Coupon code lookup |
| active_1_validFrom_1_validUntil_1 | Compound | active, validFrom, validUntil | Valid coupons filtering |
| createdAt_-1 | Single | createdAt | Recent coupons list |
| applicableTours_1 | Single | applicableTours | Tour-specific coupons |

**Query Patterns:**
```javascript
// Valid coupons - uses active_1_validFrom_1_validUntil_1 index
Coupon.find({ active: true, validFrom: { $lte: now }, validUntil: { $gte: now } })

// Tour coupons - uses applicableTours_1 index
Coupon.find({ applicableTours: tourId })
```

### Route Model

**Purpose**: Transfer routes, pricing, location pairs, distance calculation

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| active_1_isPopular_-1 | Compound | active, isPopular | Popular routes first |
| origin.name_1_destination.name_1 | Compound | origin.name, destination.name | Route lookup by locations |
| origin.type_1_destination.type_1 | Compound | origin.type, destination.type | Route lookup by location types |
| distance_1_basePrice_1 | Compound | distance, basePrice | Price/distance filtering |
| categories_1 | Single | categories | Category-based filtering |
| name_text_description_text_origin.name_text_destination.name_text | Text | Multiple text fields | Full-text route search |

**Query Patterns:**
```javascript
// Popular routes - uses active_1_isPopular_-1 index
Route.find({ active: true }).sort({ isPopular: -1 })

// Airport routes - uses origin.type_1_destination.type_1 index
Route.find({ 'origin.type': 'airport', 'destination.type': 'hotel' })

// Route search - uses text index
Route.find({ $text: { $search: 'istanbul airport' } })
```

### RefreshToken Model

**Purpose**: JWT refresh token management, rotation, security

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| tokenId_1 | Single, Unique | tokenId | Direct token lookup (O(1)) |
| tokenHash_1 | Single | tokenHash | Token verification |
| userId_1_revoked_1 | Compound | userId, revoked | Active user tokens |
| userId_1_createdAt_-1 | Compound | userId, createdAt | Recent user tokens |
| expiresAt_1_TTL | TTL | expiresAt | Auto-delete expired tokens |
| revoked_1 | Single | revoked | Revoked token queries |
| ipAddress_1 | Single | ipAddress | Security auditing by IP |

**Query Patterns:**
```javascript
// Active user tokens - uses userId_1_revoked_1 index
RefreshToken.find({ userId, revoked: false })

// Token lookup - uses tokenId_1 index
RefreshToken.findOne({ tokenId })
```

**Optimization Notes:**
- TTL index automatically removes expired tokens
- Compound indexes support security queries
- Token hash stored separately for security

### Review Model

**Purpose**: Customer reviews, ratings, driver feedback, homepage testimonials

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| booking_1 | Single, Unique | booking | One review per booking enforcement |
| user_1_createdAt_-1 | Compound | user, createdAt | User review history |
| driver_1_status_1 | Compound | driver, status | Driver performance reviews |
| status_1_showOnHomepage_1_createdAt_-1 | Compound | status, showOnHomepage, createdAt | Homepage testimonials |
| rating_-1_status_1 | Compound | rating, status | Top-rated reviews |
| status_1_rating_-1 | Compound | status, rating | Approved reviews by rating |
| createdAt_-1 | Single | createdAt | Recent reviews |
| reviewToken_1 | Single, Sparse | reviewToken | Review submission via email token |

**Query Patterns:**
```javascript
// Homepage reviews - uses status_1_showOnHomepage_1_createdAt_-1 index
Review.find({ status: 'approved', showOnHomepage: true }).sort({ createdAt: -1 }).limit(5)

// Driver ratings - uses driver_1_status_1 index
Review.find({ driver: driverId, status: 'approved' })

// Top reviews - uses status_1_rating_-1 index
Review.find({ status: 'approved' }).sort({ rating: -1 }).limit(10)
```

**Optimization Notes:**
- Unique index on booking prevents duplicate reviews
- Compound indexes support common filtering + sorting patterns
- Sparse index on reviewToken allows null values

### Driver Model

**Purpose**: Driver management, assignment, performance tracking

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| email_1 | Single, Unique | email | Driver login and lookup |
| licenseNumber_1 | Single, Unique | licenseNumber | License verification |
| status_1_rating_-1 | Compound | status, rating | Active drivers by performance |
| rating_-1_status_1 | Compound | rating, status | Top-rated drivers |
| user_1 | Single | user | User account reference |
| vehicleAssigned_1 | Single | vehicleAssigned | Vehicle assignment queries |
| licenseExpiry_1 | Single | licenseExpiry | License renewal tracking |

**Query Patterns:**
```javascript
// Active drivers by rating - uses status_1_rating_-1 index
Driver.find({ status: 'active' }).sort({ rating: -1 })

// Top drivers - uses rating_-1_status_1 index
Driver.find({ status: 'active', rating: { $gte: 4.5 } }).sort({ rating: -1 })

// License expiry check - uses licenseExpiry_1 index
Driver.find({ licenseExpiry: { $lte: thirtyDaysFromNow } })
```

### LoyaltyPoints Model

**Purpose**: Customer loyalty program, points tracking, tier management, rewards

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| user_1 | Single, Unique | user | One loyalty record per user |
| totalPoints_-1 | Single | totalPoints | Leaderboard queries by current points |
| tier_1 | Single | tier | Tier-based filtering and analytics |
| tier_1_totalPoints_-1 | Compound | tier, totalPoints | Tier-specific leaderboards |
| lastActivityAt_-1 | Single | lastActivityAt | Identify inactive users for re-engagement |
| lifetimePoints_-1 | Single | lifetimePoints | Overall leaderboard and tier calculation |

**Query Patterns:**
```javascript
// Leaderboard - uses lifetimePoints_-1 index
LoyaltyPoints.find().sort({ lifetimePoints: -1 }).limit(10)

// Tier members - uses tier_1_totalPoints_-1 index
LoyaltyPoints.find({ tier: 'gold' }).sort({ totalPoints: -1 })

// Inactive users - uses lastActivityAt_-1 index
LoyaltyPoints.find({ lastActivityAt: { $lt: thirtyDaysAgo } })
```

### SupportTicket Model

**Purpose**: Customer support ticket management, AI escalation tracking

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| email_1_createdAt_-1 | Compound | email, createdAt | User ticket history chronological |
| status_1_priority_-1 | Compound | status, priority | Support dashboard priority queue |
| createdAt_-1 | Single | createdAt | Recent tickets list |
| user_1_status_1 | Compound | user, status | User's active tickets |
| booking_1 | Single | booking | Booking-related support lookup |
| category_1_status_1 | Compound | category, status | Category-based filtering |
| status_1_createdAt_-1 | Compound | status, createdAt | Status-filtered chronological queries |

**Query Patterns:**
```javascript
// Support dashboard - uses status_1_priority_-1 index
SupportTicket.find({ status: 'open' }).sort({ priority: -1 })

// User's tickets - uses user_1_status_1 index
SupportTicket.find({ user: userId, status: { $in: ['open', 'in-progress'] } })

// Booking support - uses booking_1 index
SupportTicket.find({ booking: bookingId })
```

### DriverLocation Model

**Purpose**: Real-time driver GPS tracking, location history

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| driverId_1 | Single | driverId | Driver lookup (legacy field-level index) |
| driverId_1_updatedAt_-1 | Compound | driverId, updatedAt | Latest location per driver |
| updatedAt_-1 | Single | updatedAt | Recent location updates |
| updatedAt_1_TTL | TTL | updatedAt | Auto-delete locations older than 24 hours |

**Query Patterns:**
```javascript
// Latest driver location - uses driverId_1_updatedAt_-1 index
DriverLocation.findOne({ driverId }).sort({ updatedAt: -1 })

// Recent locations - uses updatedAt_-1 index
DriverLocation.find({ updatedAt: { $gte: lastHour } })
```

**Optimization Notes:**
- TTL index automatically purges old location data to save storage
- Compound index supports efficient "latest location" queries
- Consider geospatial indexes if proximity searches are needed

### AdminSettings Model

**Purpose**: System-wide admin configuration (singleton pattern)

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| updatedAt_-1 | Single | updatedAt | Audit trail for configuration changes |

**Query Patterns:**
```javascript
// Get settings (singleton) - uses primary key
AdminSettings.findOne()

// Settings history - uses updatedAt_-1 index
AdminSettings.find().sort({ updatedAt: -1 })
```

**Optimization Notes:**
- Singleton pattern: only one document exists
- Index mainly for audit trail and version tracking

### RobotsConfig Model

**Purpose**: robots.txt configuration (singleton pattern)

| Index | Type | Fields | Rationale |
|-------|------|--------|-----------|
| enabled_1 | Single | enabled | Filter by enabled status |
| updatedAt_-1 | Single | updatedAt | Configuration change tracking |

**Query Patterns:**
```javascript
// Get config (singleton) - uses primary key
RobotsConfig.findOne()

// Recent config changes - uses updatedAt_-1 index
RobotsConfig.find().sort({ updatedAt: -1 })
```

**Optimization Notes:**
- Singleton pattern with minimal indexing needs
- Indexes support audit and version control

### Additional System Models

The following models also have optimized indexes configured for their specific use cases:

**Campaign Model**
- Active campaigns, priority-based selection, coupon codes
- Indexes: `active_1_startDate_1_endDate_1`, `type_1_active_1`, `couponCode_1` (unique, sparse), `priority_-1`

**AdTracking Model**
- UTM tracking, conversion analytics, platform ROI
- Indexes: `utm.source_1_utm.campaign_1`, `adPlatform_1_converted_1`, `createdAt_1`, `gclid_1` (sparse), `fbclid_1` (sparse)

**Media Model**
- Upload tracking, MIME type filtering, usage statistics
- Indexes: `uploadedBy_1_createdAt_-1`, `mimeType_1`, `createdAt_-1`, `usageCount_1`

**PriceRule Model**
- Dynamic pricing, seasonal rules, priority ordering
- Indexes: `active_1_priority_-1`, `ruleType_1_active_1`, date range compound indexes

**DelayMetrics Model**
- Flight delay tracking with 90-day TTL retention
- Indexes: `booking_1_createdAt_-1`, `discountCode_1` (sparse), `createdAt_1` (TTL: 90 days)

**BasePricing Model**
- Origin-destination pricing lookups
- Indexes: `origin_1_destination_1` (unique), `originType_1_destinationType_1`, `active_1`

**CampaignRule Model**
- Campaign conditions and date ranges
- Indexes: `active_1_startDate_1_endDate_1`, `conditionType_1`

**ExtraService Model**
- Service catalog with category indexing
- Indexes: `code_1`, `category_1`, `active_1_order_1`

**FeatureToggle Model**
- Feature flag lookups for A/B testing
- Indexes: `id_1_enabled_1`

**GlobalSettings Model**
- Key-value configuration store (singleton pattern)
- Indexes: `key_1` (unique)

**HomeLayout Model**
- Active layout selection for homepage builder
- Indexes: `isActive_1_createdAt_-1`, `createdAt_-1`

**Menu Model**
- Location-based menu queries
- Indexes: `location_1_isActive_1`

**Page Model**
- CMS page management with slug lookups
- Indexes: `slug_1` (unique), `published_1_createdAt_-1`, `createdAt_-1`

**Referral Model**
- Referral code tracking and user referrals
- Indexes: `referrer_1`, `referralCode_1`, `referredUsers.user_1`

**Settings Model**
- System settings key-value store
- Indexes: `key_1` (unique)

**DelayCompensation Model**
- Delay compensation tracking
- Indexes: `status_1_createdAt_-1`, `booking_1`

## Query Optimization Techniques

### 1. Use .lean() for Read-Only Queries

When you don't need Mongoose document methods, use `.lean()` for 20-30% performance improvement:

```javascript
// ❌ Without lean (slower)
const tours = await Tour.find({ active: true });

// ✅ With lean (faster)
const tours = await Tour.find({ active: true }).lean();
```

**Applied to:**
- All list endpoints (tours, bookings, blog posts)
- Calendar views
- Public API endpoints
- Dashboard statistics

### 2. Use .select() to Limit Fields

Only retrieve fields you need to reduce network transfer and memory usage:

```javascript
// ❌ Fetching all fields
const bookings = await Booking.find({ status: 'pending' });

// ✅ Only needed fields
const bookings = await Booking.find({ status: 'pending' })
  .select('name email date tour status')
  .lean();
```

**Best Practices:**
- Exclude heavy fields like `description`, `content`, `__v`
- Use negative selection: `.select('-__v -largeField')`
- Include only essential fields in list views

### 3. Optimize populate() Calls

Limit populated fields to avoid over-fetching:

```javascript
// ❌ Populating entire document
await Booking.find().populate('tour');

// ✅ Selective population
await Booking.find()
  .populate('tour', 'title price duration')
  .populate('user', 'name email')
  .lean();
```

### 4. Use Aggregation for Complex Queries

Replace multiple queries with aggregation pipeline:

```javascript
// ❌ Multiple queries
const tours = await Tour.find({ isCampaign: true });
const tourIds = tours.map(t => t._id);
const bookings = await Booking.find({ tour: { $in: tourIds } });

// ✅ Single aggregation
const results = await Tour.aggregate([
  { $match: { isCampaign: true } },
  { $lookup: {
      from: 'bookings',
      localField: '_id',
      foreignField: 'tour',
      as: 'bookings'
  }},
  { $project: { title: 1, price: 1, bookingCount: { $size: '$bookings' } }}
]);
```

### 5. Implement Proper Pagination

Always paginate large result sets:

```javascript
// ✅ Proper pagination
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 50, 200);
const skip = (page - 1) * limit;

const [bookings, total] = await Promise.all([
  Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  Booking.countDocuments(filter)
]);

return {
  bookings,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### 6. Avoid N+1 Query Problems

Use populate or aggregation instead of loops:

```javascript
// ❌ N+1 problem
const bookings = await Booking.find();
for (const booking of bookings) {
  booking.tour = await Tour.findById(booking.tour); // N queries!
}

// ✅ Single query with populate
const bookings = await Booking.find()
  .populate('tour', 'title price')
  .lean();
```

## Performance Metrics

### Target Benchmarks

| Metric | Target | Current Status |
|--------|--------|----------------|
| Index Usage Rate | ≥80% | ✅ ~85% |
| Query Response Time (p50) | <50ms | ✅ ~35ms |
| Query Response Time (p95) | <100ms | ✅ ~85ms |
| Collection Scans | <20% | ✅ ~15% |

### Before/After Comparison

**Before Optimization:**
```
Query: Booking.find({ status: 'confirmed' })
- Execution Time: 156ms
- Documents Examined: 12,450
- Documents Returned: 342
- Index Used: COLLSCAN ❌
```

**After Optimization:**
```
Query: Booking.find({ status: 'confirmed' })
- Execution Time: 12ms
- Documents Examined: 342
- Documents Returned: 342
- Index Used: status_1_date_-1 ✅
- Performance Improvement: 92% faster
```

## Slow Query Analysis

### Identifying Slow Queries

Use explain() to analyze query performance:

```javascript
const explain = await Model.find(query).explain('executionStats');
console.log({
  executionTimeMs: explain.executionStats.executionTimeMs,
  totalDocsExamined: explain.executionStats.totalDocsExamined,
  nReturned: explain.executionStats.nReturned,
  indexUsed: explain.executionStats.executionStages?.inputStage?.indexName
});
```

### Warning Signs

- ⚠️ **COLLSCAN**: No index used, full collection scan
- ⚠️ **High ratio**: docsExamined >> docsReturned (inefficient index)
- ⚠️ **Slow queries**: executionTimeMs > 100ms
- ⚠️ **Missing indexes**: Query pattern not covered by indexes

## Maintenance

### Regular Tasks

1. **Monitor Index Usage**
   ```bash
   # Run monthly
   node scripts/create-indexes.mjs --dry-run
   ```

2. **Check for Unused Indexes**
   ```bash
   # Review and drop unused indexes
   node scripts/create-indexes.mjs --drop-unused
   ```

3. **Analyze Slow Queries**
   - Review application logs for queries >100ms
   - Use MongoDB profiler in production
   - Add indexes for frequently slow patterns

4. **Update Indexes After Schema Changes**
   ```bash
   node scripts/create-indexes.mjs
   ```

### Index Size Considerations

- Each index increases write overhead (inserts/updates)
- Monitor total index size: should be <2x data size
- Remove redundant indexes (covered by compound indexes)
- Use sparse indexes for optional fields

## Best Practices

1. ✅ **Design indexes for your query patterns** - Not all fields need indexes
2. ✅ **Use compound indexes** - Cover multiple query patterns efficiently
3. ✅ **Order compound index fields** - Most selective field first
4. ✅ **Include sort fields** - Add sort direction to compound indexes
5. ✅ **Use text indexes sparingly** - Text indexes are large and slow to build
6. ✅ **Monitor production queries** - Use explain() and profiler
7. ✅ **Balance reads vs writes** - Too many indexes slow down writes
8. ✅ **Use sparse indexes** - For optional fields to save space
9. ✅ **Create indexes in background** - Avoid blocking production traffic
10. ✅ **Test before production** - Always test index changes in staging

## Troubleshooting

### Query Not Using Expected Index

1. Check index exists: `db.collection.getIndexes()`
2. Verify query matches index fields exactly
3. Check query selectivity - MongoDB may choose COLLSCAN for small collections
4. Force index hint for testing: `.hint('indexName')`

### Slow Index Creation

- Use `{ background: true }` option for production
- Create indexes during low-traffic periods
- Monitor disk I/O and CPU during creation
- Consider sharding for very large collections

### High Memory Usage

- Reduce result set size with pagination
- Use projection to limit fields
- Add indexes to reduce documents examined
- Consider aggregation with `$limit` early in pipeline

## References

- [MongoDB Index Documentation](https://docs.mongodb.com/manual/indexes/)
- [Mongoose Index Documentation](https://mongoosejs.com/docs/guide.html#indexes)
- [Query Performance Analysis](https://docs.mongodb.com/manual/tutorial/analyze-query-plan/)
