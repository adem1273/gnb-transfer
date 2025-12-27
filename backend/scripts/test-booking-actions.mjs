#!/usr/bin/env node
/**
 * Manual Validation Script for Admin Booking Actions
 * 
 * This script demonstrates the admin booking action endpoints
 * by making HTTP requests to a running server.
 * 
 * Usage:
 *   1. Start the backend server: npm run dev
 *   2. Run this script: node scripts/test-booking-actions.mjs
 * 
 * NOTE: Requires a running MongoDB instance and backend server.
 */

import http from 'http';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = `test-admin-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Helper function to make HTTP requests
async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test scenarios
async function runTests() {
  console.log('🧪 Starting Manual Validation Tests for Admin Booking Actions\n');
  console.log('================================================\n');

  try {
    // 1. Register an admin user
    console.log('1️⃣  Registering admin user...');
    const registerResponse = await makeRequest('POST', '/api/users/register', {
      name: 'Test Admin',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'admin'
    });

    if (registerResponse.status !== 201 && registerResponse.status !== 200) {
      throw new Error(`Failed to register admin: ${JSON.stringify(registerResponse.data)}`);
    }

    const adminToken = registerResponse.data.token || registerResponse.data.data?.token;
    console.log('✅ Admin registered successfully\n');

    // 2. Get a tour ID (we need this to create a booking)
    console.log('2️⃣  Fetching tours...');
    const toursResponse = await makeRequest('GET', '/api/tours');
    const tours = toursResponse.data.data || toursResponse.data;
    
    if (!tours || tours.length === 0) {
      console.log('⚠️  No tours found. Please create a tour first.');
      return;
    }

    const tourId = tours[0]._id || tours[0].id;
    console.log(`✅ Found tour: ${tours[0].title} (${tourId})\n`);

    // 3. Create a test booking
    console.log('3️⃣  Creating a pending booking...');
    const bookingResponse = await makeRequest('POST', '/api/bookings', {
      name: 'Test Customer',
      email: 'customer@test.com',
      tourId: tourId,
      paymentMethod: 'cash',
      guests: 1,
      adultsCount: 1,
      passengers: [{ firstName: 'John', lastName: 'Doe', type: 'adult' }]
    });

    if (bookingResponse.status !== 201 && bookingResponse.status !== 200) {
      throw new Error(`Failed to create booking: ${JSON.stringify(bookingResponse.data)}`);
    }

    const bookingId = bookingResponse.data.data?._id || bookingResponse.data._id;
    console.log(`✅ Booking created: ${bookingId}\n`);
    console.log(`   Status: ${bookingResponse.data.data?.status || 'pending'}\n`);

    // 4. Test APPROVE endpoint
    console.log('4️⃣  Testing APPROVE endpoint...');
    const approveResponse = await makeRequest(
      'PATCH',
      `/api/admin/bookings/${bookingId}/approve`,
      null,
      adminToken
    );

    console.log(`   Status Code: ${approveResponse.status}`);
    console.log(`   Response: ${JSON.stringify(approveResponse.data, null, 2)}`);
    
    if (approveResponse.status === 200) {
      console.log('✅ APPROVE endpoint working correctly\n');
    } else {
      console.log('❌ APPROVE endpoint failed\n');
    }

    // 5. Test CANCEL endpoint
    console.log('5️⃣  Testing CANCEL endpoint...');
    const cancelResponse = await makeRequest(
      'PATCH',
      `/api/admin/bookings/${bookingId}/cancel`,
      null,
      adminToken
    );

    console.log(`   Status Code: ${cancelResponse.status}`);
    console.log(`   Response: ${JSON.stringify(cancelResponse.data, null, 2)}`);
    
    if (cancelResponse.status === 200) {
      console.log('✅ CANCEL endpoint working correctly\n');
    } else {
      console.log('❌ CANCEL endpoint failed\n');
    }

    // 6. Test COMPLETE endpoint on a cancelled booking (should fail)
    console.log('6️⃣  Testing COMPLETE endpoint on cancelled booking (should fail with 400)...');
    const completeResponse = await makeRequest(
      'PATCH',
      `/api/admin/bookings/${bookingId}/complete`,
      null,
      adminToken
    );

    console.log(`   Status Code: ${completeResponse.status}`);
    console.log(`   Response: ${JSON.stringify(completeResponse.data, null, 2)}`);
    
    if (completeResponse.status === 400) {
      console.log('✅ COMPLETE endpoint correctly rejected cancelled booking\n');
    } else {
      console.log('❌ COMPLETE endpoint should have returned 400\n');
    }

    // 7. Create another booking and test complete
    console.log('7️⃣  Creating another booking to test COMPLETE...');
    const booking2Response = await makeRequest('POST', '/api/bookings', {
      name: 'Test Customer 2',
      email: 'customer2@test.com',
      tourId: tourId,
      paymentMethod: 'cash',
      guests: 1,
      adultsCount: 1,
      passengers: [{ firstName: 'Jane', lastName: 'Doe', type: 'adult' }]
    });

    const booking2Id = booking2Response.data.data?._id || booking2Response.data._id;
    console.log(`✅ Second booking created: ${booking2Id}\n`);

    // Approve it first
    await makeRequest(
      'PATCH',
      `/api/admin/bookings/${booking2Id}/approve`,
      null,
      adminToken
    );

    // Now complete it
    console.log('8️⃣  Testing COMPLETE endpoint on confirmed booking...');
    const complete2Response = await makeRequest(
      'PATCH',
      `/api/admin/bookings/${booking2Id}/complete`,
      null,
      adminToken
    );

    console.log(`   Status Code: ${complete2Response.status}`);
    console.log(`   Response: ${JSON.stringify(complete2Response.data, null, 2)}`);
    
    if (complete2Response.status === 200) {
      console.log('✅ COMPLETE endpoint working correctly\n');
    } else {
      console.log('❌ COMPLETE endpoint failed\n');
    }

    console.log('\n================================================');
    console.log('✅ All manual validation tests completed!');
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if backend server is running...');
makeRequest('GET', '/api/tours')
  .then(() => {
    console.log('✅ Server is running\n');
    return runTests();
  })
  .catch((error) => {
    console.error('❌ Cannot connect to backend server.');
    console.error('Please ensure:');
    console.error('  1. Backend server is running (npm run dev in backend/)');
    console.error('  2. MongoDB is connected');
    console.error('  3. Server is accessible at', BASE_URL);
    console.error('\nError:', error.message);
    process.exit(1);
  });
