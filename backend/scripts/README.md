# Database Optimization Scripts

This directory contains scripts for managing database indexes and testing query performance.

## Available Scripts

### Index Optimization

#### `optimize-indexes.js` ⭐ NEW

**Comprehensive index optimization with performance testing and reporting.**

**Usage:**
```bash
# Full optimization with performance tests
node scripts/optimize-indexes.js

# Dry run (no changes, see what would happen)
node scripts/optimize-indexes.js --dry-run

# Drop unused indexes
node scripts/optimize-indexes.js --drop-unused

# Force rebuild all indexes
node scripts/optimize-indexes.js --force
```

**Features:**
- ✅ Processes all 34 models
- ✅ Before/after performance comparisons
- ✅ Background index creation
- ✅ Unused index detection
- ✅ TTL index support
- ✅ Detailed progress logging
- ✅ Automatic report generation
- ✅ Error handling and recovery

**Output:**
- Console progress with color-coded status
- Performance metrics for each collection
- Generated report at `docs/INDEX_OPTIMIZATION_REPORT.md`
- Summary of improvements

**When to run:**
- After deploying to production (via GitHub Actions)
- After major schema changes
- Monthly for maintenance
- When query performance degrades

### Index Management

#### `create-indexes.mjs`

Creates and synchronizes database indexes for all models.

**Usage:**
```bash
# Create/sync indexes (live mode)
npm run db:indexes

# Dry run (show what would be done)
npm run db:indexes:dry-run

# Create indexes and drop unused ones
npm run db:indexes:drop-unused
```

**Features:**
- ✅ Safe background index creation
- ✅ Checks existing indexes before creating
- ✅ Optional unused index removal
- ✅ Performance analysis with explain()
- ✅ Detailed logging

**When to run:**
- After deploying model schema changes
- When adding new indexes to models
- Monthly as part of database maintenance
- Before production deployments

### Performance Testing

#### `test-query-performance.mjs`

Tests query performance and validates index usage.

**Usage:**
```bash
npm run db:test-performance
```

**What it does:**
- Runs common query patterns from all models
- Checks if indexes are being used
- Measures execution time and efficiency
- Identifies collection scans (COLLSCAN)
- Provides optimization recommendations

**Output:**
```
🔬 Query Performance Test Suite
================================================================================

✅ User login by email
   Model: User
   Query: {"email":"test@example.com"}
   Index: email_1
   Time: 3ms
   Examined: 1, Returned: 1
   Efficiency: 100.0%

❌ Unindexed query
   Model: Booking
   Query: {"customField":"value"}
   Index: COLLSCAN
   Time: 156ms
   Examined: 12450, Returned: 342
   Efficiency: 2.7%
   ⚠️  Warning: Collection scan on potentially large dataset!

================================================================================
📊 Summary
================================================================================
Total Tests: 17
✅ Passed (Using Index): 15
❌ Failed (COLLSCAN): 2
Index Usage Rate: 88.2%

Performance Metrics:
  Average query time: 12.5ms
  Fastest query: 1ms
  Slowest query: 156ms

💡 Recommendations:
  ✅ Good! 80%+ queries are using indexes
```

### Other Scripts

#### `seed.mjs`

Seeds the database with test data.

**Usage:**
```bash
npm run seed              # Seed all data
npm run seed:users        # Seed users only
npm run seed:tours        # Seed tours only
npm run seed:reset        # Reset and reseed
```

## Best Practices

### Index Creation

1. **Always use dry-run first** in production:
   ```bash
   npm run db:indexes:dry-run
   ```

2. **Review changes** before applying:
   - Check which indexes will be created
   - Verify no critical indexes will be dropped
   - Estimate impact on write performance

3. **Monitor during creation**:
   - Watch CPU and disk I/O
   - Indexes are created in background mode
   - Large collections may take time

4. **Schedule maintenance**:
   - Run during low-traffic periods
   - Monthly index review and cleanup
   - After each deployment with model changes

### Performance Testing

1. **Baseline testing**:
   ```bash
   # Before optimization
   npm run db:test-performance > before.txt
   
   # After optimization
   npm run db:test-performance > after.txt
   
   # Compare results
   diff before.txt after.txt
   ```

2. **Monitor key metrics**:
   - **Index Usage Rate**: Target ≥80%
   - **Average Query Time**: Target <50ms
   - **Collection Scans**: Target <20%

3. **Address warnings**:
   - Add indexes for COLLSCAN queries
   - Optimize queries >100ms
   - Review low efficiency queries (<50%)

## Common Issues

### Issue: Index creation taking too long

**Solution:**
- Indexes are created in background by default
- For very large collections (>1M docs), expect longer times
- Monitor with `db.currentOp()` in MongoDB shell

### Issue: Index not being used

**Possible causes:**
1. Index doesn't match query pattern
2. Query selectivity too low (MongoDB chooses COLLSCAN)
3. Query uses operators not supported by index

**Debug:**
```javascript
// In MongoDB shell or your code
db.collection.find({ field: value }).explain('executionStats')
```

### Issue: Too many indexes affecting write performance

**Solution:**
1. Review index usage:
   ```bash
   npm run db:indexes:dry-run
   ```

2. Remove unused indexes:
   ```bash
   npm run db:indexes:drop-unused
   ```

3. Consolidate indexes:
   - Use compound indexes instead of multiple single-field indexes
   - Remove redundant indexes

## Monitoring in Production

### Check Index Usage

```javascript
// MongoDB shell
db.collection.aggregate([
  { $indexStats: {} }
])
```

### Find Slow Queries

```javascript
// Enable profiler
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 })
```

### Index Size

```javascript
// Check index sizes
db.collection.stats().indexSizes
```

## Integration with CI/CD

### Pre-deployment checks

Add to your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Validate indexes
  run: |
    npm run db:indexes:dry-run
    npm run db:test-performance
```

### Post-deployment

```yaml
- name: Sync indexes
  run: npm run db:indexes
```

## Related Documentation

- [Database Indexing Strategy](../../docs/DATABASE_INDEXES.md) - Comprehensive index documentation
- [MongoDB Index Documentation](https://docs.mongodb.com/manual/indexes/)
- [Mongoose Index Documentation](https://mongoosejs.com/docs/guide.html#indexes)

## Support

For questions or issues:
1. Check [DATABASE_INDEXES.md](../../docs/DATABASE_INDEXES.md)
2. Review MongoDB logs
3. Use explain() to analyze query plans
4. Contact the development team
