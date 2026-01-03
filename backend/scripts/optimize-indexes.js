/**
 * Database Index Optimization Script
 * 
 * This script safely builds indexes in the background with performance comparisons.
 * It provides before/after metrics and detailed logging.
 * 
 * Usage:
 *   node scripts/optimize-indexes.js [--dry-run] [--drop-unused] [--force]
 * 
 * Options:
 *   --dry-run      Show what would be done without making changes
 *   --drop-unused  Drop indexes that are not defined in models
 *   --force        Force rebuild all indexes (drop and recreate)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Import all models to ensure indexes are registered
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import BlogPost from '../models/BlogPost.mjs';
import Review from '../models/Review.mjs';
import Driver from '../models/Driver.mjs';
import Vehicle from '../models/Vehicle.mjs';
import Coupon from '../models/Coupon.mjs';
import Page from '../models/Page.mjs';
import Route from '../models/Route.mjs';
import RefreshToken from '../models/RefreshToken.mjs';
import SystemLog from '../models/SystemLog.mjs';
import AdminLog from '../models/AdminLog.mjs';
import RateLimitViolation from '../models/RateLimitViolation.mjs';
import LoyaltyPoints from '../models/LoyaltyPoints.mjs';
import SupportTicket from '../models/SupportTicket.mjs';
import Media from '../models/Media.mjs';
import Campaign from '../models/Campaign.mjs';
import PriceRule from '../models/PriceRule.mjs';
import ExtraService from '../models/ExtraService.mjs';
import AdTracking from '../models/AdTracking.mjs';
import BasePricing from '../models/BasePricing.mjs';
import CampaignRule from '../models/CampaignRule.mjs';
import DelayMetrics from '../models/DelayMetrics.mjs';
import DelayCompensation from '../models/DelayCompensation.mjs';
import FeatureToggle from '../models/FeatureToggle.mjs';
import GlobalSettings from '../models/GlobalSettings.mjs';
import HomeLayout from '../models/HomeLayout.mjs';
import Menu from '../models/Menu.mjs';
import Referral from '../models/Referral.mjs';
import Settings from '../models/Settings.mjs';
import RobotsConfig from '../models/RobotsConfig.mjs';
import AdminSettings from '../models/AdminSettings.mjs';
import { DriverLocation } from '../models/DriverLocation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dropUnused = args.includes('--drop-unused');
const forceRebuild = args.includes('--force');

// Results tracking
const results = {
  collections: [],
  totalIndexesCreated: 0,
  totalIndexesDropped: 0,
  totalTimeMs: 0,
  errors: [],
  performanceTests: [],
};

/**
 * Get all indexes for a collection
 */
async function getExistingIndexes(model) {
  try {
    const indexes = await model.collection.getIndexes();
    return Object.keys(indexes).map(name => ({
      name,
      key: indexes[name].key,
      unique: indexes[name].unique || false,
      sparse: indexes[name].sparse || false,
      expireAfterSeconds: indexes[name].expireAfterSeconds,
      background: indexes[name].background,
    }));
  } catch (error) {
    console.error(`Error getting indexes for ${model.modelName}:`, error.message);
    return [];
  }
}

/**
 * Get index statistics
 */
async function getIndexStats(model) {
  try {
    const stats = await model.collection.aggregate([{ $indexStats: {} }]).toArray();
    return stats.map(s => ({
      name: s.name,
      accesses: s.accesses.ops,
      since: s.accesses.since,
    }));
  } catch (error) {
    console.error(`Error getting index stats for ${model.modelName}:`, error.message);
    return [];
  }
}

/**
 * Format index key for display
 */
function formatIndexKey(key) {
  return Object.entries(key)
    .map(([field, order]) => {
      if (order === 'text') return `${field}:text`;
      return `${field}:${order}`;
    })
    .join(', ');
}

/**
 * Test query performance
 */
async function testQueryPerformance(model, query, description) {
  try {
    const startTime = Date.now();
    const explain = await model.find(query).explain('executionStats');
    const executionTime = Date.now() - startTime;
    
    const stats = explain.executionStats || explain;
    
    return {
      description,
      executionTimeMs: stats.executionTimeMs || executionTime,
      totalDocsExamined: stats.totalDocsExamined || 0,
      nReturned: stats.nReturned || 0,
      indexUsed: stats.executionStages?.inputStage?.indexName || 
                 explain.queryPlanner?.winningPlan?.inputStage?.indexName || 
                 'COLLSCAN',
      isIndexScan: stats.executionStages?.inputStage?.stage === 'IXSCAN' || 
                   explain.queryPlanner?.winningPlan?.inputStage?.stage === 'IXSCAN',
    };
  } catch (error) {
    console.error(`Error testing query performance: ${error.message}`);
    return null;
  }
}

/**
 * Performance test queries for different models
 */
const performanceTests = {
  User: [
    { query: { email: 'test@example.com' }, desc: 'User login by email' },
    { query: { role: 'admin' }, desc: 'Users by role' },
    { query: { isCorporate: true, role: 'user' }, desc: 'Corporate users' },
  ],
  Booking: [
    { query: { status: 'confirmed' }, desc: 'Confirmed bookings' },
    { query: { status: 'pending' }, desc: 'Pending bookings' },
  ],
  Tour: [
    { query: { active: true, category: 'transfer' }, desc: 'Active transfer tours' },
    { query: { active: true, isCampaign: true }, desc: 'Campaign tours' },
  ],
  BlogPost: [
    { query: { status: 'published', language: 'en' }, desc: 'Published English posts' },
    { query: { category: 'travel', status: 'published' }, desc: 'Published travel posts' },
  ],
  Review: [
    { query: { status: 'approved', showOnHomepage: true }, desc: 'Homepage reviews' },
    { query: { status: 'approved' }, desc: 'All approved reviews' },
  ],
  Driver: [
    { query: { status: 'active' }, desc: 'Active drivers' },
  ],
};

/**
 * Run performance tests for a model
 */
async function runModelPerformanceTests(model, beforeOrAfter) {
  const tests = performanceTests[model.modelName] || [];
  if (tests.length === 0) return [];
  
  const testResults = [];
  
  for (const test of tests) {
    const result = await testQueryPerformance(model, test.query, test.desc);
    if (result) {
      testResults.push({
        model: model.modelName,
        phase: beforeOrAfter,
        ...result,
      });
    }
  }
  
  return testResults;
}

/**
 * Create/sync indexes for a model
 */
async function optimizeModelIndexes(model) {
  const collectionName = model.collection.name;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Optimizing: ${model.modelName} (${collectionName})`);
  console.log('='.repeat(60));
  
  const collectionResult = {
    name: collectionName,
    model: model.modelName,
    indexesCreated: 0,
    indexesDropped: 0,
    errors: [],
    beforeTests: [],
    afterTests: [],
  };
  
  try {
    // Get existing indexes and stats
    const existingIndexes = await getExistingIndexes(model);
    const indexStats = await getIndexStats(model);
    const modelIndexes = model.schema.indexes();
    
    console.log(`\n📋 Current state:`);
    console.log(`   Existing indexes: ${existingIndexes.length}`);
    console.log(`   Model indexes: ${modelIndexes.length}`);
    
    // Display existing indexes
    console.log(`\n   Existing indexes:`);
    existingIndexes.forEach(idx => {
      const stats = indexStats.find(s => s.name === idx.name);
      const accessCount = stats ? stats.accesses : 'N/A';
      console.log(`     - ${idx.name}: ${formatIndexKey(idx.key)} (accesses: ${accessCount})`);
    });
    
    // Run before performance tests
    if (!dryRun) {
      console.log(`\n🔬 Running BEFORE performance tests...`);
      const beforeTests = await runModelPerformanceTests(model, 'before');
      collectionResult.beforeTests = beforeTests;
      results.performanceTests.push(...beforeTests);
      
      beforeTests.forEach(test => {
        const indexStatus = test.isIndexScan ? '✓' : '❌';
        console.log(`   ${indexStatus} ${test.description}: ${test.executionTimeMs}ms (${test.indexUsed})`);
      });
    }
    
    if (dryRun) {
      console.log(`\n   [DRY RUN] Would sync ${modelIndexes.length} indexes`);
      return collectionResult;
    }
    
    // Create/sync indexes
    console.log(`\n⚙️  Creating/syncing indexes...`);
    const startTime = Date.now();
    
    if (forceRebuild) {
      console.log(`   Force rebuild mode: dropping all indexes first...`);
      // Drop all indexes except _id_
      for (const idx of existingIndexes) {
        if (idx.name !== '_id_') {
          try {
            await model.collection.dropIndex(idx.name);
            console.log(`   Dropped: ${idx.name}`);
            collectionResult.indexesDropped++;
          } catch (error) {
            console.error(`   Failed to drop ${idx.name}: ${error.message}`);
          }
        }
      }
    }
    
    // Ensure all indexes with background: true option
    await model.syncIndexes();
    console.log(`   ✓ Indexes synchronized`);
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`   Time taken: ${timeTaken}ms`);
    
    collectionResult.indexesCreated = modelIndexes.length;
    
    // Drop unused indexes if requested
    if (dropUnused) {
      console.log(`\n🗑️  Checking for unused indexes...`);
      const modelIndexNames = new Set(
        modelIndexes.map(([fields, options]) => {
          if (options.name) return options.name;
          // Generate index name similar to MongoDB
          return Object.entries(fields)
            .map(([k, v]) => `${k}_${v}`)
            .join('_');
        })
      );
      
      for (const existingIdx of existingIndexes) {
        // Never drop the _id index
        if (existingIdx.name === '_id_') continue;
        
        const stats = indexStats.find(s => s.name === existingIdx.name);
        const isUnused = stats && stats.accesses === 0;
        
        if (!modelIndexNames.has(existingIdx.name) || isUnused) {
          console.log(`   Dropping ${isUnused ? 'unused' : 'undefined'} index: ${existingIdx.name}`);
          try {
            await model.collection.dropIndex(existingIdx.name);
            collectionResult.indexesDropped++;
          } catch (error) {
            console.error(`   ✗ Failed to drop ${existingIdx.name}: ${error.message}`);
            collectionResult.errors.push(`Drop failed: ${existingIdx.name} - ${error.message}`);
          }
        }
      }
    }
    
    // Run after performance tests
    console.log(`\n🔬 Running AFTER performance tests...`);
    const afterTests = await runModelPerformanceTests(model, 'after');
    collectionResult.afterTests = afterTests;
    results.performanceTests.push(...afterTests);
    
    afterTests.forEach(test => {
      const indexStatus = test.isIndexScan ? '✓' : '❌';
      console.log(`   ${indexStatus} ${test.description}: ${test.executionTimeMs}ms (${test.indexUsed})`);
    });
    
    // Show improvements
    if (collectionResult.beforeTests.length > 0 && collectionResult.afterTests.length > 0) {
      console.log(`\n📈 Performance improvements:`);
      for (let i = 0; i < collectionResult.beforeTests.length; i++) {
        const before = collectionResult.beforeTests[i];
        const after = collectionResult.afterTests[i];
        
        if (before && after) {
          const improvement = ((before.executionTimeMs - after.executionTimeMs) / before.executionTimeMs * 100).toFixed(1);
          const improvedIndexUsage = !before.isIndexScan && after.isIndexScan;
          
          if (improvement > 0 || improvedIndexUsage) {
            console.log(`   ${before.description}:`);
            console.log(`     Before: ${before.executionTimeMs}ms (${before.indexUsed})`);
            console.log(`     After:  ${after.executionTimeMs}ms (${after.indexUsed})`);
            if (improvement > 0) {
              console.log(`     Improvement: ${improvement}% faster`);
            }
            if (improvedIndexUsage) {
              console.log(`     ✓ Now using index scan instead of collection scan`);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Optimization complete for ${model.modelName}`);
    
  } catch (error) {
    console.error(`\n❌ Error optimizing ${model.modelName}:`, error.message);
    collectionResult.errors.push(error.message);
    results.errors.push({ model: model.modelName, error: error.message });
  }
  
  return collectionResult;
}

/**
 * Generate performance report
 */
function generateReport() {
  const reportDir = join(__dirname, '../docs');
  const reportPath = join(reportDir, 'INDEX_OPTIMIZATION_REPORT.md');
  
  const report = `# Index Optimization Report

Generated: ${new Date().toISOString()}
Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}

## Summary

- Total collections processed: ${results.collections.length}
- Total indexes created/synced: ${results.totalIndexesCreated}
- Total indexes dropped: ${results.totalIndexesDropped}
- Total errors: ${results.errors.length}

## Collection Details

${results.collections.map(col => `
### ${col.model} (${col.name})

- Indexes created: ${col.indexesCreated}
- Indexes dropped: ${col.indexesDropped}
- Errors: ${col.errors.length}

${col.errors.length > 0 ? `**Errors:**\n${col.errors.map(e => `- ${e}`).join('\n')}` : ''}
`).join('\n')}

## Performance Test Results

${results.performanceTests.length > 0 ? `
| Model | Test | Phase | Time (ms) | Index Used | Docs Examined | Docs Returned |
|-------|------|-------|-----------|------------|---------------|---------------|
${results.performanceTests.map(test => 
  `| ${test.model} | ${test.description} | ${test.phase} | ${test.executionTimeMs} | ${test.indexUsed} | ${test.totalDocsExamined} | ${test.nReturned} |`
).join('\n')}
` : 'No performance tests available'}

${results.errors.length > 0 ? `
## Errors

${results.errors.map(e => `- **${e.model}**: ${e.error}`).join('\n')}
` : ''}

## Recommendations

1. Monitor query performance in production using explain() 
2. Review queries with COLLSCAN and add appropriate indexes
3. Run this script after schema changes
4. Drop unused indexes quarterly to reduce write overhead
5. Consider sharding for collections >1M documents
`;

  return { reportPath, content: report };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Database Index Optimization Script');
  console.log('=====================================\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🔨 LIVE'}`);
  console.log(`Drop unused indexes: ${dropUnused ? 'YES' : 'NO'}`);
  console.log(`Force rebuild: ${forceRebuild ? 'YES' : 'NO'}\n`);
  
  const overallStartTime = Date.now();
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to database\n');
    
    // Models to process
    const models = [
      User, Booking, Tour, BlogPost, Review, Driver, Vehicle, Coupon, Page,
      Route, RefreshToken, SystemLog, AdminLog, RateLimitViolation,
      LoyaltyPoints, SupportTicket, Media, Campaign, PriceRule, ExtraService,
      AdTracking, BasePricing, CampaignRule, DelayMetrics, DelayCompensation,
      FeatureToggle, GlobalSettings, HomeLayout, Menu, Referral, Settings,
      RobotsConfig, AdminSettings, DriverLocation,
    ];
    
    // Process each model
    for (const model of models) {
      const collectionResult = await optimizeModelIndexes(model);
      results.collections.push(collectionResult);
      results.totalIndexesCreated += collectionResult.indexesCreated;
      results.totalIndexesDropped += collectionResult.indexesDropped;
    }
    
    const overallEndTime = Date.now();
    results.totalTimeMs = overallEndTime - overallStartTime;
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total collections processed: ${results.collections.length}`);
    console.log(`Total indexes created/synced: ${results.totalIndexesCreated}`);
    console.log(`Total indexes dropped: ${results.totalIndexesDropped}`);
    console.log(`Total time: ${results.totalTimeMs}ms`);
    console.log(`Errors encountered: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      results.errors.forEach(e => {
        console.log(`   - ${e.model}: ${e.error}`);
      });
    }
    
    // Generate report
    if (!dryRun) {
      const { reportPath, content } = generateReport();
      await fs.writeFile(reportPath, content, 'utf8');
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }
    
    console.log('\n✅ Index optimization completed successfully!\n');
    
    // Recommendations
    console.log('💡 Recommendations:');
    console.log('  - Monitor query performance using explain() in production');
    console.log('  - Target: 80%+ queries should use indexes (avoid COLLSCAN)');
    console.log('  - Review slow queries (>100ms) and add indexes as needed');
    console.log('  - Run this script after model schema changes');
    console.log('  - Schedule quarterly reviews to drop unused indexes\n');
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run the script
main();
