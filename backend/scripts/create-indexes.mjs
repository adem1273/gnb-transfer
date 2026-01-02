/**
 * Database Index Creation Script
 * 
 * This script creates optimized indexes for all models in the database.
 * It safely creates indexes in the background and provides performance comparisons.
 * 
 * Usage:
 *   node scripts/create-indexes.mjs [--drop-unused] [--dry-run]
 * 
 * Options:
 *   --drop-unused  Drop indexes that are not defined in models
 *   --dry-run      Show what would be done without making changes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import all models to ensure indexes are registered
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import BlogPost from '../models/BlogPost.mjs';
import Review from '../models/Review.mjs';
import Driver from '../models/Driver.mjs';
import Vehicle from '../models/Vehicle.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const dropUnused = args.includes('--drop-unused');
const dryRun = args.includes('--dry-run');

/**
 * Get all indexes for a collection
 */
async function getExistingIndexes(model) {
  try {
    const indexes = await model.collection.getIndexes();
    return Object.keys(indexes).map(name => ({
      name,
      key: indexes[name].key,
      ...indexes[name]
    }));
  } catch (error) {
    console.error(`Error getting indexes for ${model.modelName}:`, error.message);
    return [];
  }
}

/**
 * Format index key for display
 */
function formatIndexKey(key) {
  return Object.entries(key)
    .map(([field, order]) => `${field}:${order}`)
    .join(', ');
}

/**
 * Compare model indexes with existing database indexes
 */
async function analyzeIndexes(model) {
  console.log(`\n📊 Analyzing ${model.modelName} collection...`);
  
  const existingIndexes = await getExistingIndexes(model);
  const modelIndexes = model.schema.indexes();
  
  console.log(`  Existing indexes: ${existingIndexes.length}`);
  console.log(`  Model indexes: ${modelIndexes.length}`);
  
  // List existing indexes
  console.log('\n  Current indexes:');
  existingIndexes.forEach(idx => {
    console.log(`    - ${idx.name}: ${formatIndexKey(idx.key)}`);
  });
  
  return { existingIndexes, modelIndexes };
}

/**
 * Create indexes for a model
 */
async function createIndexes(model) {
  const { existingIndexes, modelIndexes } = await analyzeIndexes(model);
  
  if (dryRun) {
    console.log(`\n  [DRY RUN] Would create ${modelIndexes.length} indexes`);
    return { created: 0, dropped: 0 };
  }
  
  console.log(`\n  Creating indexes for ${model.modelName}...`);
  
  try {
    // Ensure all indexes defined in the model
    await model.syncIndexes();
    console.log(`  ✓ Indexes synchronized successfully`);
    
    // Drop unused indexes if requested
    let droppedCount = 0;
    if (dropUnused) {
      const modelIndexNames = new Set(
        modelIndexes.map(([fields, options]) => {
          // Generate index name similar to MongoDB
          const keyStr = Object.entries(fields)
            .map(([k, v]) => `${k}_${v}`)
            .join('_');
          return options.name || keyStr;
        })
      );
      
      for (const existingIdx of existingIndexes) {
        // Never drop the _id index
        if (existingIdx.name === '_id_') continue;
        
        if (!modelIndexNames.has(existingIdx.name)) {
          console.log(`  Dropping unused index: ${existingIdx.name}`);
          try {
            await model.collection.dropIndex(existingIdx.name);
            droppedCount++;
          } catch (error) {
            console.error(`  ✗ Failed to drop ${existingIdx.name}:`, error.message);
          }
        }
      }
    }
    
    return { created: modelIndexes.length, dropped: droppedCount };
  } catch (error) {
    console.error(`  ✗ Error creating indexes for ${model.modelName}:`, error.message);
    return { created: 0, dropped: 0 };
  }
}

/**
 * Test query performance before and after indexing
 */
async function testQueryPerformance(model, query) {
  try {
    const explain = await model.find(query).explain('executionStats');
    const stats = explain.executionStats || explain;
    
    return {
      executionTimeMs: stats.executionTimeMs,
      totalDocsExamined: stats.totalDocsExamined,
      nReturned: stats.nReturned,
      indexUsed: stats.executionStages?.inputStage?.indexName || 
                 explain.queryPlanner?.winningPlan?.inputStage?.indexName || 
                 'COLLSCAN'
    };
  } catch (error) {
    console.error('Error testing query performance:', error.message);
    return null;
  }
}

/**
 * Performance test queries for different models
 */
const performanceTests = {
  User: [
    { email: 'test@example.com' },
    { role: 'admin' },
    { isCorporate: true, role: 'user' }
  ],
  Booking: [
    { status: 'confirmed' },
    { date: { $gte: new Date('2024-01-01') } },
    { user: new mongoose.Types.ObjectId(), status: 'pending' }
  ],
  Tour: [
    { active: true, isCampaign: true },
    { price: { $lte: 100 } },
    { category: 'transfer' }
  ],
  BlogPost: [
    { status: 'published', language: 'en' },
    { category: 'travel', status: 'published' },
    { slug: 'test-slug' }
  ],
  Review: [
    { status: 'approved', showOnHomepage: true },
    { rating: { $gte: 4 } },
    { driver: new mongoose.Types.ObjectId() }
  ],
  Driver: [
    { status: 'active' },
    { rating: { $gte: 4.5 } },
    { email: 'driver@example.com' }
  ]
};

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log('\n🔬 Running performance tests...\n');
  
  const models = [User, Booking, Tour, BlogPost, Review, Driver];
  
  for (const model of models) {
    const queries = performanceTests[model.modelName] || [];
    if (queries.length === 0) continue;
    
    console.log(`\n${model.modelName} Performance Tests:`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const queryStr = JSON.stringify(query).substring(0, 80);
      
      const stats = await testQueryPerformance(model, query);
      if (stats) {
        const indexStatus = stats.indexUsed === 'COLLSCAN' ? '❌ COLLSCAN' : `✓ ${stats.indexUsed}`;
        console.log(`  Query ${i + 1}: ${queryStr}`);
        console.log(`    ${indexStatus}`);
        console.log(`    Time: ${stats.executionTimeMs}ms, Examined: ${stats.totalDocsExamined}, Returned: ${stats.nReturned}`);
        
        if (stats.indexUsed === 'COLLSCAN' && stats.totalDocsExamined > 100) {
          console.log(`    ⚠️  Warning: Collection scan on large dataset!`);
        }
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Database Index Creation Script\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Drop unused indexes: ${dropUnused ? 'YES' : 'NO'}\n`);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer');
    console.log('✓ Connected to database\n');
    
    // Models to process
    const models = [User, Booking, Tour, BlogPost, Review, Driver, Vehicle];
    
    let totalCreated = 0;
    let totalDropped = 0;
    
    // Create indexes for each model
    for (const model of models) {
      const { created, dropped } = await createIndexes(model);
      totalCreated += created;
      totalDropped += dropped;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary');
    console.log('='.repeat(60));
    console.log(`Total indexes created/synced: ${totalCreated}`);
    if (dropUnused) {
      console.log(`Total unused indexes dropped: ${totalDropped}`);
    }
    
    // Run performance tests
    if (!dryRun) {
      await runPerformanceTests();
    }
    
    console.log('\n✅ Index creation completed successfully!\n');
    
    // Recommendations
    console.log('💡 Recommendations:');
    console.log('  - Monitor query performance using explain() in production');
    console.log('  - Target: 80%+ queries should use indexes (avoid COLLSCAN)');
    console.log('  - Review slow queries (>100ms) and add indexes as needed');
    console.log('  - Run this script after model schema changes\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run the script
main();
