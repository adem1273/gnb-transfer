#!/usr/bin/env node

/**
 * Test Environment Verification Script
 * 
 * Checks if the environment is properly configured for running API tests
 */

import { createRequire } from 'module';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

console.log('🔍 Verifying Test Environment...\n');

let hasErrors = false;

// Check 1: Node.js version
console.log('1️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (required: >=18)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (required: >=18)`);
  console.log(`   Please upgrade Node.js to version 18 or higher\n`);
  hasErrors = true;
}

// Check 2: Dependencies
console.log('2️⃣  Checking test dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const requiredDeps = ['jest', 'supertest', '@jest/globals'];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!pkg.devDependencies?.[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length === 0) {
    console.log('   ✅ All test dependencies installed\n');
  } else {
    console.log(`   ❌ Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   Run: npm install\n');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ❌ Could not read package.json\n');
  hasErrors = true;
}

// Check 3: Test files
console.log('3️⃣  Checking test files...');
const requiredFiles = [
  'tests/api.test.mjs',
  'tests/setup.mjs',
  'jest.config.mjs',
  '.env.test'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} not found`);
    allFilesExist = false;
    hasErrors = true;
  }
}
if (allFilesExist) {
  console.log();
}

// Check 4: MongoDB connection
console.log('4️⃣  Checking MongoDB connection...');
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.test' });
  
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer-test';
  console.log(`   📍 MongoDB URI: ${mongoUri}`);
  
  // Try to connect to MongoDB
  try {
    const mongoose = await import('mongoose');
    await mongoose.default.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('   ✅ Successfully connected to MongoDB\n');
    await mongoose.default.connection.close();
  } catch (error) {
    console.log('   ❌ Could not connect to MongoDB');
    console.log(`   Error: ${error.message}`);
    console.log('\n   💡 Solutions:');
    console.log('      - Start MongoDB: sudo systemctl start mongod');
    console.log('      - Or use Docker: docker run -d -p 27017:27017 mongo:7');
    console.log('      - Or update MONGO_URI in .env.test with Atlas connection\n');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ⚠️  Could not check MongoDB connection');
  console.log(`   Error: ${error.message}\n`);
}

// Check 5: Test script
console.log('5️⃣  Checking test script...');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (pkg.scripts?.test && pkg.scripts.test.includes('jest')) {
    console.log('   ✅ Test script configured in package.json\n');
  } else {
    console.log('   ⚠️  Test script not properly configured');
    console.log('   Expected: "test": "NODE_OPTIONS=\'--experimental-vm-modules\' jest --config jest.config.mjs"\n');
  }
} catch (error) {
  console.log('   ❌ Could not check test script\n');
}

// Summary
console.log('━'.repeat(60));
if (hasErrors) {
  console.log('\n❌ Environment check failed. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('\n✅ Environment is ready for testing!\n');
  console.log('Run tests with: npm test\n');
  process.exit(0);
}
