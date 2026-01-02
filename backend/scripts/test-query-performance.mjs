/**
 * Query Performance Test Script
 * 
 * Tests query performance with and without indexes
 * Run this script to validate index effectiveness
 * 
 * Usage:
 *   node scripts/test-query-performance.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import models
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import Tour from '../models/Tour.mjs';
import BlogPost from '../models/BlogPost.mjs';
import Review from '../models/Review.mjs';
import Driver from '../models/Driver.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Test a single query and return performance metrics
 */
async function testQuery(model, query, description) {
  try {
    const explain = await model.find(query).explain('executionStats');
    const stats = explain.executionStats || explain;
    
    const indexUsed = stats.executionStages?.inputStage?.indexName || 
                     explain.queryPlanner?.winningPlan?.inputStage?.indexName ||
                     (stats.totalDocsExamined === stats.nReturned ? 'Covered Query' : 'COLLSCAN');
    
    const efficiency = stats.totalDocsExamined > 0 
      ? ((stats.nReturned / stats.totalDocsExamined) * 100).toFixed(1)
      : 100;
    
    return {
      description,
      model: model.modelName,
      query: JSON.stringify(query),
      executionTimeMs: stats.executionTimeMs,
      docsExamined: stats.totalDocsExamined,
      docsReturned: stats.nReturned,
      indexUsed,
      efficiency: `${efficiency}%`,
      status: indexUsed === 'COLLSCAN' ? '❌' : '✅'
    };
  } catch (error) {
    return {
      description,
      model: model.modelName,
      error: error.message,
      status: '❌'
    };
  }
}

/**
 * Run all performance tests
 */
async function runTests() {
  console.log('\n🔬 Query Performance Test Suite\n');
  console.log('='.repeat(80));
  
  const tests = [
    // User model tests
    {
      model: User,
      query: { email: 'test@example.com' },
      description: 'User login by email'
    },
    {
      model: User,
      query: { role: 'admin' },
      description: 'Admin users list'
    },
    {
      model: User,
      query: { isCorporate: true, role: 'user' },
      description: 'Corporate users'
    },
    
    // Booking model tests
    {
      model: Booking,
      query: { status: 'confirmed' },
      description: 'Confirmed bookings'
    },
    {
      model: Booking,
      query: { status: 'pending', date: { $gte: new Date('2024-01-01') } },
      description: 'Pending bookings from date'
    },
    {
      model: Booking,
      query: { paymentMethod: 'stripe', status: 'paid' },
      description: 'Stripe payments report'
    },
    
    // Tour model tests
    {
      model: Tour,
      query: { active: true, isCampaign: true },
      description: 'Active campaign tours'
    },
    {
      model: Tour,
      query: { active: true, category: 'transfer' },
      description: 'Active transfers by category'
    },
    {
      model: Tour,
      query: { price: { $gte: 50, $lte: 150 } },
      description: 'Tours in price range'
    },
    
    // BlogPost model tests
    {
      model: BlogPost,
      query: { status: 'published', language: 'en' },
      description: 'Published English posts'
    },
    {
      model: BlogPost,
      query: { category: 'travel', status: 'published' },
      description: 'Travel blog posts'
    },
    {
      model: BlogPost,
      query: { slug: 'test-post' },
      description: 'Blog post by slug'
    },
    
    // Review model tests
    {
      model: Review,
      query: { status: 'approved', showOnHomepage: true },
      description: 'Homepage testimonials'
    },
    {
      model: Review,
      query: { status: 'approved', rating: { $gte: 4 } },
      description: 'High-rated approved reviews'
    },
    
    // Driver model tests
    {
      model: Driver,
      query: { status: 'active', rating: { $gte: 4.5 } },
      description: 'Top-rated active drivers'
    },
    {
      model: Driver,
      query: { email: 'driver@example.com' },
      description: 'Driver by email'
    }
  ];
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    const result = await testQuery(test.model, test.query, test.description);
    results.push(result);
    
    if (result.status === '✅') passCount++;
    else failCount++;
    
    // Print result
    console.log(`\n${result.status} ${result.description}`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Query: ${result.query.substring(0, 70)}${result.query.length > 70 ? '...' : ''}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   Index: ${result.indexUsed}`);
      console.log(`   Time: ${result.executionTimeMs}ms`);
      console.log(`   Examined: ${result.docsExamined}, Returned: ${result.docsReturned}`);
      console.log(`   Efficiency: ${result.efficiency}`);
      
      // Warnings
      if (result.indexUsed === 'COLLSCAN' && result.docsExamined > 100) {
        console.log(`   ⚠️  Warning: Collection scan on potentially large dataset!`);
      }
      if (result.executionTimeMs > 100) {
        console.log(`   ⚠️  Warning: Slow query detected (>100ms)`);
      }
      if (parseFloat(result.efficiency) < 50) {
        console.log(`   ⚠️  Warning: Low efficiency (<50%), consider index optimization`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Summary');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed (Using Index): ${passCount}`);
  console.log(`❌ Failed (COLLSCAN): ${failCount}`);
  console.log(`Index Usage Rate: ${((passCount / tests.length) * 100).toFixed(1)}%`);
  
  // Performance stats
  const times = results.filter(r => !r.error).map(r => r.executionTimeMs);
  if (times.length > 0) {
    const avgTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log(`\nPerformance Metrics:`);
    console.log(`  Average query time: ${avgTime}ms`);
    console.log(`  Fastest query: ${minTime}ms`);
    console.log(`  Slowest query: ${maxTime}ms`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (failCount > 0) {
    console.log(`  - ${failCount} queries are not using indexes (COLLSCAN)`);
    console.log('  - Run: node scripts/create-indexes.mjs to create missing indexes');
  }
  
  const slowQueries = results.filter(r => !r.error && r.executionTimeMs > 100);
  if (slowQueries.length > 0) {
    console.log(`  - ${slowQueries.length} slow queries detected (>100ms)`);
    console.log('  - Consider adding indexes or optimizing query patterns');
  }
  
  if (passCount / tests.length >= 0.8) {
    console.log('  ✅ Good! 80%+ queries are using indexes');
  } else {
    console.log('  ⚠️  Target: 80%+ queries should use indexes');
  }
  
  console.log('\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📡 Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to database');
    
    await runTests();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

main();
