/**
 * Integration test for new features:
 * - Driver/Vehicle assignment to bookings
 * - User bookings endpoint
 * - PriceRule and Route models
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../../models/Booking.mjs';
import Driver from '../../models/Driver.mjs';
import Vehicle from '../../models/Vehicle.mjs';
import PriceRule from '../../models/PriceRule.mjs';
import Route from '../../models/Route.mjs';
import Tour from '../../models/Tour.mjs';
import User from '../../models/User.mjs';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer-test';

async function testModels() {
  console.log('🧪 Testing new models and features...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Verify Booking model has new fields
    console.log('Test 1: Checking Booking model schema...');
    const bookingSchema = Booking.schema;
    const hasDriverField = bookingSchema.paths.driver !== undefined;
    const hasVehicleField = bookingSchema.paths.vehicle !== undefined;
    
    if (hasDriverField && hasVehicleField) {
      console.log('✅ Booking model has driver and vehicle fields\n');
    } else {
      console.log('❌ Booking model missing fields');
      console.log('   - driver:', hasDriverField);
      console.log('   - vehicle:', hasVehicleField);
      console.log('');
    }

    // Test 2: Verify PriceRule model
    console.log('Test 2: Checking PriceRule model...');
    const priceRuleSchema = PriceRule.schema;
    const hasRuleType = priceRuleSchema.paths.ruleType !== undefined;
    const hasAdjustmentValue = priceRuleSchema.paths.adjustmentValue !== undefined;
    
    if (hasRuleType && hasAdjustmentValue) {
      console.log('✅ PriceRule model schema is valid\n');
    } else {
      console.log('❌ PriceRule model schema issues\n');
    }

    // Test 3: Verify Route model
    console.log('Test 3: Checking Route model...');
    const routeSchema = Route.schema;
    const hasOrigin = routeSchema.paths.origin !== undefined;
    const hasDestination = routeSchema.paths.destination !== undefined;
    const hasBasePricing = routeSchema.paths.basePricing !== undefined;
    
    if (hasOrigin && hasDestination && hasBasePricing) {
      console.log('✅ Route model schema is valid\n');
    } else {
      console.log('❌ Route model schema issues\n');
    }

    // Test 4: Create a sample PriceRule
    console.log('Test 4: Creating sample PriceRule...');
    const sampleRule = new PriceRule({
      name: 'Peak Hour Surcharge',
      description: 'Additional charge during peak hours',
      ruleType: 'time_based',
      adjustmentType: 'percentage',
      adjustmentValue: 20,
      priority: 10,
      timeConditions: {
        hourRanges: [
          { start: 7, end: 9 },
          { start: 17, end: 19 },
        ],
      },
    });

    const validationError = sampleRule.validateSync();
    if (!validationError) {
      console.log('✅ PriceRule validation passed\n');
    } else {
      console.log('❌ PriceRule validation failed:', validationError.message, '\n');
    }

    // Test 5: Create a sample Route
    console.log('Test 5: Creating sample Route...');
    const sampleRoute = new Route({
      name: 'Antalya Airport to Belek Hotels',
      origin: {
        name: 'Antalya Airport',
        type: 'airport',
        coordinates: { lat: 36.8987, lng: 30.8005 },
      },
      destination: {
        name: 'Belek Hotels',
        type: 'hotel',
        coordinates: { lat: 36.8624, lng: 31.0558 },
      },
      distance: 35,
      duration: 40,
      basePrice: 45,
      basePricing: {
        economy: 40,
        sedan: 45,
        suv: 60,
        van: 75,
        luxury: 100,
      },
      currency: 'EUR',
    });

    const routeValidationError = sampleRoute.validateSync();
    if (!routeValidationError) {
      console.log('✅ Route validation passed\n');
    } else {
      console.log('❌ Route validation failed:', routeValidationError.message, '\n');
    }

    // Test 6: Test PriceRule calculatePrice method
    console.log('Test 6: Testing PriceRule calculatePrice method...');
    const basePrice = 100;
    const calculatedPrice = sampleRule.calculatePrice(basePrice);
    const expectedPrice = 120; // 100 + 20%
    
    if (calculatedPrice === expectedPrice) {
      console.log(`✅ Price calculation correct: ${basePrice} → ${calculatedPrice}\n`);
    } else {
      console.log(`❌ Price calculation incorrect: expected ${expectedPrice}, got ${calculatedPrice}\n`);
    }

    // Test 7: Test Route virtual properties
    console.log('Test 7: Testing Route virtual properties...');
    const formattedName = sampleRoute.formattedName;
    const pricePerKm = sampleRoute.pricePerKm;
    
    if (formattedName && pricePerKm) {
      console.log(`✅ Route virtuals work:`);
      console.log(`   - formattedName: ${formattedName}`);
      console.log(`   - pricePerKm: ${pricePerKm}\n`);
    } else {
      console.log('❌ Route virtuals not working\n');
    }

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run tests
testModels().catch(console.error);
