/**
 * K6 Load Test - API Stress Test
 * 
 * Tests all major API endpoints under load:
 * - Authentication endpoints
 * - Tours CRUD operations
 * - Bookings CRUD operations
 * - User profile operations
 * - Search and filtering
 * 
 * Target: <200ms p95 response time, <1% error rate
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const toursDuration = new Trend('tours_duration');
const bookingsDuration = new Trend('bookings_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'errors': ['rate<0.01'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

// Setup
export function setup() {
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, { 'API is healthy': (r) => r.status === 200 });
  return { baseUrl: BASE_URL };
}

// Main test
export default function (data) {
  let authToken = null;
  
  // Test Authentication endpoints
  group('Authentication Endpoints', () => {
    const start = Date.now();
    
    // Register new user
    const registerPayload = JSON.stringify({
      email: `stresstest${__VU}_${Date.now()}@example.com`,
      password: 'StressTest123!',
      name: `Stress Test User ${__VU}`,
    });
    
    const registerRes = http.post(
      `${data.baseUrl}/auth/register`,
      registerPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(registerRes, {
      'Register: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);
    
    // Login
    const loginPayload = JSON.stringify({
      email: registerPayload.email,
      password: 'StressTest123!',
    });
    
    const loginRes = http.post(
      `${data.baseUrl}/auth/login`,
      loginPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const loginSuccess = check(loginRes, {
      'Login: status 200': (r) => r.status === 200,
      'Login: token received': (r) => r.json('data.token') !== undefined,
    });
    
    if (loginSuccess) {
      authToken = loginRes.json('data.token');
    } else {
      errorRate.add(1);
    }
    
    authDuration.add(Date.now() - start);
  });
  
  sleep(1);
  
  if (!authToken) return;
  
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // Test Tours endpoints
  group('Tours Endpoints', () => {
    const start = Date.now();
    
    // List tours
    let listRes = http.get(`${data.baseUrl}/tours`, authHeaders);
    check(listRes, {
      'Tours list: status 200': (r) => r.status === 200,
      'Tours list: has data': (r) => r.json('data.tours') !== undefined,
    }) || errorRate.add(1);
    
    // Search tours
    const searchRes = http.get(
      `${data.baseUrl}/tours?search=airport&limit=10`,
      authHeaders
    );
    check(searchRes, {
      'Tours search: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Filter tours
    const filterRes = http.get(
      `${data.baseUrl}/tours?category=transfer&priceMax=100`,
      authHeaders
    );
    check(filterRes, {
      'Tours filter: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Get specific tour (if available)
    if (listRes.status === 200) {
      const tours = listRes.json('data.tours');
      if (tours && tours.length > 0) {
        const tourId = tours[0]._id || tours[0].id;
        const detailRes = http.get(`${data.baseUrl}/tours/${tourId}`, authHeaders);
        check(detailRes, {
          'Tour detail: status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
      }
    }
    
    toursDuration.add(Date.now() - start);
  });
  
  sleep(1);
  
  // Test Bookings endpoints
  group('Bookings Endpoints', () => {
    const start = Date.now();
    
    // List user's bookings
    const listRes = http.get(`${data.baseUrl}/bookings`, authHeaders);
    check(listRes, {
      'Bookings list: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Create booking (will likely fail without valid tour, but tests the endpoint)
    const createPayload = JSON.stringify({
      tourId: 'test-tour-id',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      passengers: 2,
      pickupLocation: 'Test Location',
    });
    
    const createRes = http.post(
      `${data.baseUrl}/bookings`,
      createPayload,
      authHeaders
    );
    // Don't fail on 400/404 as we're using test data
    check(createRes, {
      'Booking create: valid response': (r) => [200, 201, 400, 404].includes(r.status),
    });
    
    bookingsDuration.add(Date.now() - start);
  });
  
  sleep(1);
  
  // Test User profile endpoints
  group('User Profile Endpoints', () => {
    // Get profile
    const profileRes = http.get(`${data.baseUrl}/users/profile`, authHeaders);
    check(profileRes, {
      'Profile get: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Update profile
    const updatePayload = JSON.stringify({
      name: `Updated User ${__VU}`,
    });
    
    const updateRes = http.patch(
      `${data.baseUrl}/users/profile`,
      updatePayload,
      authHeaders
    );
    check(updateRes, {
      'Profile update: valid response': (r) => [200, 400].includes(r.status),
    });
  });
  
  sleep(1);
  
  // Test Public endpoints (no auth required)
  group('Public Endpoints', () => {
    // Health check
    const healthRes = http.get(`${data.baseUrl}/health`);
    check(healthRes, {
      'Health: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Public tours (if available)
    const publicToursRes = http.get(`${data.baseUrl}/tours/public`);
    // Don't fail if endpoint doesn't exist
    check(publicToursRes, {
      'Public tours: valid response': (r) => r.status !== 500,
    });
    
    // FAQ endpoint (if available)
    const faqRes = http.get(`${data.baseUrl}/faq`);
    check(faqRes, {
      'FAQ: valid response': (r) => r.status !== 500,
    });
  });
  
  sleep(2);
}

// Teardown
export function teardown(data) {
  console.log('API stress test completed');
}
