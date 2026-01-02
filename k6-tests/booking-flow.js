/**
 * K6 Load Test - Complete Booking Flow
 * 
 * Simulates a complete user journey:
 * 1. User registration/login
 * 2. Browse tours
 * 3. View tour details
 * 4. Create booking
 * 5. Process payment
 * 
 * Target: <200ms p95 response time, <1% error rate
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');
const paymentDuration = new Trend('payment_duration');
const successfulBookings = new Counter('successful_bookings');
const failedBookings = new Counter('failed_bookings');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'], // 95% of requests should be below 200ms
    'errors': ['rate<0.01'],             // Error rate should be below 1%
    'http_req_failed': ['rate<0.01'],    // Failed requests should be below 1%
    'booking_duration': ['p(95)<500'],   // 95% of bookings should complete in <500ms
    'payment_duration': ['p(95)<1000'],  // 95% of payments should complete in <1s
  },
};

// Environment variables
const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

// Test data
const testUsers = [];
for (let i = 0; i < 100; i++) {
  testUsers.push({
    email: `loadtest${i}@example.com`,
    password: 'LoadTest123!',
    name: `Test User ${i}`,
  });
}

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Setup function - runs once before tests
export function setup() {
  console.log('Setting up load test...');
  
  // Check if API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL };
}

// Main test scenario
export default function (data) {
  const user = getRandomUser();
  let authToken = null;
  
  // Group: User Authentication
  group('Authentication', () => {
    // Try to login first
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    
    const loginParams = {
      headers: { 'Content-Type': 'application/json' },
    };
    
    let loginRes = http.post(`${data.baseUrl}/auth/login`, loginPayload, loginParams);
    
    // If login fails (user doesn't exist), register
    if (loginRes.status !== 200) {
      const registerPayload = JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
      });
      
      const registerRes = http.post(`${data.baseUrl}/auth/register`, registerPayload, loginParams);
      
      const registerSuccess = check(registerRes, {
        'Registration successful': (r) => r.status === 201 || r.status === 200,
      });
      
      if (!registerSuccess) {
        errorRate.add(1);
        return;
      }
      
      // Login after registration
      loginRes = http.post(`${data.baseUrl}/auth/login`, loginPayload, loginParams);
    }
    
    const loginSuccess = check(loginRes, {
      'Login successful': (r) => r.status === 200,
      'Token received': (r) => r.json('data.token') !== undefined,
    });
    
    if (!loginSuccess) {
      errorRate.add(1);
      return;
    }
    
    authToken = loginRes.json('data.token');
  });
  
  sleep(1);
  
  // Group: Browse Tours
  group('Browse Tours', () => {
    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    };
    
    const toursRes = http.get(`${data.baseUrl}/tours`, params);
    
    const browsSuccess = check(toursRes, {
      'Tours list loaded': (r) => r.status === 200,
      'Tours data exists': (r) => r.json('data.tours') !== undefined,
    });
    
    if (!browsSuccess) {
      errorRate.add(1);
    }
  });
  
  sleep(2);
  
  // Group: View Tour Details
  let selectedTourId = null;
  group('View Tour Details', () => {
    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    };
    
    // Get first tour (in real scenario, we'd get a random one)
    const toursRes = http.get(`${data.baseUrl}/tours`, params);
    if (toursRes.status === 200) {
      const tours = toursRes.json('data.tours');
      if (tours && tours.length > 0) {
        selectedTourId = tours[0]._id || tours[0].id;
        
        const tourDetailRes = http.get(`${data.baseUrl}/tours/${selectedTourId}`, params);
        
        check(tourDetailRes, {
          'Tour details loaded': (r) => r.status === 200,
        });
      }
    }
  });
  
  sleep(3);
  
  // Group: Create Booking
  let bookingId = null;
  if (selectedTourId) {
    group('Create Booking', () => {
      const bookingStart = Date.now();
      
      const bookingPayload = JSON.stringify({
        tourId: selectedTourId,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        passengers: 2,
        pickupLocation: 'Test Hotel',
        dropoffLocation: 'Test Airport',
        specialRequests: 'Load test booking',
      });
      
      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      };
      
      const bookingRes = http.post(`${data.baseUrl}/bookings`, bookingPayload, params);
      
      const bookingSuccess = check(bookingRes, {
        'Booking created': (r) => r.status === 201 || r.status === 200,
        'Booking ID received': (r) => r.json('data.booking') !== undefined,
      });
      
      const bookingEnd = Date.now();
      bookingDuration.add(bookingEnd - bookingStart);
      
      if (bookingSuccess) {
        bookingId = bookingRes.json('data.booking._id') || bookingRes.json('data.booking.id');
        successfulBookings.add(1);
      } else {
        errorRate.add(1);
        failedBookings.add(1);
      }
    });
    
    sleep(2);
  }
  
  // Group: Process Payment
  if (bookingId) {
    group('Process Payment', () => {
      const paymentStart = Date.now();
      
      const paymentPayload = JSON.stringify({
        bookingId: bookingId,
        paymentMethod: 'card',
        amount: 100,
      });
      
      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      };
      
      const paymentRes = http.post(`${data.baseUrl}/bookings/${bookingId}/payment`, paymentPayload, params);
      
      const paymentSuccess = check(paymentRes, {
        'Payment processed': (r) => r.status === 200,
      });
      
      const paymentEnd = Date.now();
      paymentDuration.add(paymentEnd - paymentStart);
      
      if (!paymentSuccess) {
        errorRate.add(1);
      }
    });
  }
  
  sleep(1);
}

// Teardown function - runs once after all tests
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Base URL: ${data.baseUrl}`);
}
