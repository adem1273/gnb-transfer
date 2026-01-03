# Database Index Optimization - Testing Guide

This guide provides instructions for testing and validating the database index optimization implementation.

## Prerequisites

1. MongoDB database connection (MONGO_URI)
2. Node.js 18+ installed
3. Backend dependencies installed (`cd backend && npm install`)

## Testing the Optimization Script

### 1. Dry Run Test (Safe - No Changes)

First, test the script in dry-run mode to see what would be changed without making actual modifications:

```bash
cd backend
node scripts/optimize-indexes.js --dry-run
```

**Expected Output:**
- List of all collections to be processed
- Current index count for each collection
- Planned index operations
- No actual database changes

### 2. Live Run with Performance Testing

Run the script to actually create indexes and measure performance improvements:

```bash
cd backend
node scripts/optimize-indexes.js
```

**Expected Output:**
- Index creation progress for each collection
- Before/after performance test results
- Performance improvement percentages
- Total time taken
- Generated report at `docs/INDEX_OPTIMIZATION_REPORT.md`

### 3. Drop Unused Indexes

To clean up indexes that are no longer used:

```bash
cd backend
node scripts/optimize-indexes.js --drop-unused
```

**Warning:** This will drop indexes that haven't been accessed. Only use after verifying index stats.

### 4. Force Rebuild All Indexes

To rebuild all indexes from scratch (useful after major schema changes):

```bash
cd backend
node scripts/optimize-indexes.js --force
```

**Warning:** This drops and recreates all indexes. May cause temporary performance degradation.

## Verification Steps

### Step 1: Verify Index Creation

After running the script, verify indexes were created correctly:

```bash
# Connect to MongoDB shell
mongosh $MONGO_URI

# Check indexes for a specific collection
use gnb_transfer  # or your database name
db.bookings.getIndexes()
```

### Step 2: Check Index Usage

Monitor which indexes are being used:

```javascript
// In MongoDB shell
db.bookings.aggregate([{ $indexStats: {} }])
```

Look for:
- `accesses.ops`: Number of times index was used
- High access counts indicate well-used indexes
- Zero accesses may indicate unused indexes

### Step 3: Test Query Performance

Run the performance test script:

```bash
cd backend
node scripts/test-query-performance.mjs
```

This will test common queries and report:
- Execution time
- Documents examined vs returned
- Index used (or COLLSCAN if no index)

### Step 4: Review Optimization Report

Check the generated report:

```bash
cat backend/docs/INDEX_OPTIMIZATION_REPORT.md
```

Look for:
- Collections processed successfully
- Performance improvements (should be >50% for previously unindexed queries)
- Any errors that need addressing

## Performance Benchmarks

### Expected Results

| Metric | Before Optimization | After Optimization | Target |
|--------|-------------------|-------------------|---------|
| Index Usage Rate | Variable | >80% | ≥80% |
| Avg Query Time (p50) | Variable | <50ms | <50ms |
| Avg Query Time (p95) | Variable | <100ms | <100ms |
| Collection Scans | >20% | <15% | <20% |

### Common Query Performance

| Query Type | Expected Improvement |
|-----------|---------------------|
| User login (email lookup) | 90-95% |
| Status filtering | 80-90% |
| Date range queries | 70-85% |
| Text search | 60-75% |
| Compound filters | 85-95% |

## Testing Checklist

- [ ] Run dry-run mode successfully
- [ ] Verify dry-run shows expected indexes
- [ ] Run live optimization
- [ ] Check optimization report
- [ ] Verify all collections processed
- [ ] Confirm no critical errors
- [ ] Test sample queries manually
- [ ] Verify index usage with $indexStats
- [ ] Run performance test script
- [ ] Compare before/after metrics
- [ ] Check for collection scans in common queries
- [ ] Verify TTL indexes working (check old data deletion)
- [ ] Test compound index queries
- [ ] Validate text search performance

## Troubleshooting

### Issue: Script fails to connect to MongoDB

**Solution:**
```bash
# Verify MONGO_URI is set correctly
echo $MONGO_URI

# Test connection
mongosh $MONGO_URI --eval "db.adminCommand('ping')"
```

### Issue: Permission denied to create indexes

**Solution:**
- Ensure MongoDB user has `dbAdmin` or `readWrite` role
- Check connection string includes authentication credentials

### Issue: Index creation takes too long

**Solution:**
- Large collections take time to index
- Run during low-traffic periods
- Consider using `--dry-run` first to estimate time
- Background index creation is automatic

### Issue: Queries still using COLLSCAN

**Possible Causes:**
1. Query doesn't match index fields exactly
2. Small collection (MongoDB may choose COLLSCAN)
3. Index not built yet (check index status)
4. Query selectivity too low

**Debugging:**
```javascript
// Use explain to see why index wasn't used
db.collection.find({query}).explain("executionStats")
```

### Issue: Out of memory during index creation

**Solution:**
- Reduce number of concurrent index operations
- Increase MongoDB server memory
- Create indexes one collection at a time

## GitHub Actions Testing

### Manual Trigger

Test the workflow manually through GitHub UI:

1. Go to Actions tab
2. Select "Database Index Optimization"
3. Click "Run workflow"
4. Choose options:
   - Dry run: Yes (for testing)
   - Drop unused: No (for safety)
5. Monitor workflow execution
6. Download artifact with optimization report

### Scheduled Run

The workflow runs weekly on Sundays at 2 AM UTC in dry-run mode by default.

Check results:
- View workflow runs in Actions tab
- Review job summary
- Check for any failure notifications (issues created)

## Production Deployment

### Pre-Deployment

1. Test in staging environment first
2. Run dry-run to verify changes
3. Schedule during low-traffic window
4. Have rollback plan ready

### Deployment Steps

1. Deploy to staging
2. Run optimization script
3. Monitor for 24 hours
4. Verify performance improvements
5. Deploy to production
6. Run optimization script
7. Monitor performance metrics

### Post-Deployment

1. Review optimization report
2. Monitor application logs
3. Check slow query logs
4. Verify no regressions
5. Document any issues

## Maintenance Schedule

### Weekly
- Review GitHub Actions dry-run results
- Check for new unused indexes

### Monthly
- Review index usage statistics
- Drop unused indexes if confirmed unnecessary
- Update documentation

### Quarterly
- Full index audit
- Performance benchmarking
- Review and update index strategy
- Check for new query patterns

## Resources

- MongoDB Index Documentation: https://docs.mongodb.com/manual/indexes/
- Mongoose Index Documentation: https://mongoosejs.com/docs/guide.html#indexes
- Query Performance Analysis: https://docs.mongodb.com/manual/tutorial/analyze-query-plan/
- Index Naming Conventions: https://docs.mongodb.com/manual/core/index-names/

## Success Criteria

The optimization is considered successful when:

✅ All 34 collections have optimized indexes
✅ >80% of queries use indexes (not COLLSCAN)
✅ Average query time <50ms (p50)
✅ No critical errors in optimization
✅ Performance improvements documented
✅ GitHub Actions workflow runs successfully
✅ Optimization report generated
✅ All tests pass
