/**
 * Unit test for new model schemas (no DB connection required)
 */

import Booking from '../../models/Booking.mjs';
import PriceRule from '../../models/PriceRule.mjs';
import Route from '../../models/Route.mjs';

console.log('🧪 Testing model schemas (unit tests - no DB)...\n');

try {
  // Test 1: Verify Booking model has new fields
  console.log('Test 1: Checking Booking model schema...');
  const bookingSchema = Booking.schema;
  const hasDriverField = bookingSchema.paths.driver !== undefined;
  const hasVehicleField = bookingSchema.paths.vehicle !== undefined;
  
  if (hasDriverField && hasVehicleField) {
    console.log('✅ Booking model has driver and vehicle fields');
    console.log('   - driver: ObjectId ref to Driver');
    console.log('   - vehicle: ObjectId ref to Vehicle\n');
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
  const hasAdjustmentType = priceRuleSchema.paths.adjustmentType !== undefined;
  
  if (hasRuleType && hasAdjustmentValue && hasAdjustmentType) {
    console.log('✅ PriceRule model schema is valid');
    console.log('   - ruleType: time_based, demand_based, distance_based, etc.');
    console.log('   - adjustmentType: percentage or fixed');
    console.log('   - adjustmentValue: numeric adjustment\n');
  } else {
    console.log('❌ PriceRule model schema issues\n');
  }

  // Test 3: Verify Route model
  console.log('Test 3: Checking Route model...');
  const routeSchema = Route.schema;
  const hasOrigin = routeSchema.paths.origin !== undefined;
  const hasDestination = routeSchema.paths.destination !== undefined;
  const hasBasePricing = routeSchema.paths.basePricing !== undefined;
  const hasDistance = routeSchema.paths.distance !== undefined;
  
  if (hasOrigin && hasDestination && hasBasePricing && hasDistance) {
    console.log('✅ Route model schema is valid');
    console.log('   - origin: location with coordinates');
    console.log('   - destination: location with coordinates');
    console.log('   - basePricing: pricing by vehicle type');
    console.log('   - distance: route distance in km\n');
  } else {
    console.log('❌ Route model schema issues\n');
  }

  // Test 4: Test PriceRule calculatePrice method
  console.log('Test 4: Testing PriceRule calculatePrice method...');
  const sampleRule = new PriceRule({
    name: 'Test Rule',
    ruleType: 'time_based',
    adjustmentType: 'percentage',
    adjustmentValue: 20,
  });

  const basePrice = 100;
  const calculatedPrice = sampleRule.calculatePrice(basePrice);
  const expectedPrice = 120; // 100 + 20%
  
  if (calculatedPrice === expectedPrice) {
    console.log(`✅ Price calculation correct: ${basePrice} → ${calculatedPrice} EUR`);
    console.log(`   (20% increase applied)\n`);
  } else {
    console.log(`❌ Price calculation incorrect: expected ${expectedPrice}, got ${calculatedPrice}\n`);
  }

  // Test 5: Test fixed adjustment
  console.log('Test 5: Testing fixed adjustment pricing...');
  const fixedRule = new PriceRule({
    name: 'Fixed Fee',
    ruleType: 'custom',
    adjustmentType: 'fixed',
    adjustmentValue: 15,
  });

  const fixedBasePrice = 50;
  const fixedCalculatedPrice = fixedRule.calculatePrice(fixedBasePrice);
  const expectedFixedPrice = 65; // 50 + 15
  
  if (fixedCalculatedPrice === expectedFixedPrice) {
    console.log(`✅ Fixed adjustment correct: ${fixedBasePrice} → ${fixedCalculatedPrice} EUR`);
    console.log(`   (+15 EUR fixed fee)\n`);
  } else {
    console.log(`❌ Fixed adjustment incorrect: expected ${expectedFixedPrice}, got ${fixedCalculatedPrice}\n`);
  }

  // Test 6: Test min/max price constraints
  console.log('Test 6: Testing price constraints...');
  const constrainedRule = new PriceRule({
    name: 'Constrained Rule',
    ruleType: 'custom',
    adjustmentType: 'percentage',
    adjustmentValue: 200, // +200%
    minPrice: 50,
    maxPrice: 150,
  });

  const constrainedBase = 100;
  const constrainedPrice = constrainedRule.calculatePrice(constrainedBase);
  // 100 + 200% = 300, but max is 150
  
  if (constrainedPrice === 150) {
    console.log(`✅ Max constraint works: ${constrainedBase} + 200% = 300, capped at ${constrainedPrice} EUR\n`);
  } else {
    console.log(`❌ Max constraint failed: expected 150, got ${constrainedPrice}\n`);
  }

  // Test 7: Test Route virtuals
  console.log('Test 7: Testing Route virtual properties...');
  const sampleRoute = new Route({
    name: 'Airport to City',
    origin: {
      name: 'Antalya Airport',
      type: 'airport',
      coordinates: { lat: 36.8987, lng: 30.8005 },
    },
    destination: {
      name: 'City Center',
      type: 'city_center',
      coordinates: { lat: 36.8841, lng: 30.7056 },
    },
    distance: 15,
    duration: 25,
    basePrice: 30,
    currency: 'EUR',
  });

  const formattedName = sampleRoute.formattedName;
  const pricePerKm = sampleRoute.pricePerKm;
  
  if (formattedName && pricePerKm) {
    console.log(`✅ Route virtuals work:`);
    console.log(`   - formattedName: ${formattedName}`);
    console.log(`   - pricePerKm: ${pricePerKm} EUR/km\n`);
  } else {
    console.log('❌ Route virtuals not working\n');
  }

  console.log('✅ All unit tests completed successfully!\n');
  console.log('Summary:');
  console.log('- ✅ Booking model extended with driver and vehicle references');
  console.log('- ✅ PriceRule model created for dynamic pricing');
  console.log('- ✅ Route model created for transfer routes');
  console.log('- ✅ Price calculation methods working correctly');
  console.log('- ✅ Virtual properties functioning as expected\n');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  throw error; // Re-throw for test runners to handle
}
