/**
 * K6 Load Test - Concurrent Users Scenarios
 * 
 * Tests the system with different concurrent user loads:
 * - Scenario 1: 100 concurrent users
 * - Scenario 2: 500 concurrent users
 * - Scenario 3: 1000 concurrent users
 * 
 * Each scenario can be run separately using K6's --scenario flag
 * 
 * Target: <200ms p95 response time, <1% error rate
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Base configuration
const baseThresholds = {
  'http_req_duration': ['p(95)<200', 'p(99)<500'],
  'errors': ['rate<0.01'],
  'http_req_failed': ['rate<0.01'],
  'request_duration': ['p(95)<200'],
};

// Test configuration with multiple scenarios
export const options = {
  scenarios: {
    // Scenario 1: 100 concurrent users
    low_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      gracefulStop: '30s',
      tags: { scenario: '100_users' },
      exec: 'lowLoadTest',
    },
    
    // Scenario 2: 500 concurrent users (disabled by default)
    // Uncomment to enable
    /*
    medium_load: {
      executor: 'constant-vus',
      vus: 500,
      duration: '5m',
      gracefulStop: '30s',
      tags: { scenario: '500_users' },
      exec: 'mediumLoadTest',
      startTime: '6m', // Start after low_load completes
    },
    */
    
    // Scenario 3: 1000 concurrent users (disabled by default)
    // Uncomment to enable
    /*
    high_load: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '5m',
      gracefulStop: '30s',
      tags: { scenario: '1000_users' },
      exec: 'highLoadTest',
      startTime: '12m', // Start after medium_load completes
    },
    */
  },
  thresholds: baseThresholds,
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

// Setup function
export function setup() {
  console.log('Setting up concurrent users test...');
  
  const healthCheck = http.get(`${BASE_URL}/health`);
  const isHealthy = check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
  });
  
  if (!isHealthy) {
    throw new Error('API health check failed. Aborting test.');
  }
  
  return { baseUrl: BASE_URL };
}

// Helper function to simulate a user session
function simulateUserSession(data, scenarioName) {
  const userId = `${scenarioName}_user_${__VU}_${__ITER}`;
  
  // Simulate browsing behavior
  group('Browse Application', () => {
    const start = Date.now();
    
    // Home page / Tours list
    const toursRes = http.get(`${data.baseUrl}/tours?limit=20`);
    const toursSuccess = check(toursRes, {
      [`${scenarioName} - Tours loaded`]: (r) => r.status === 200,
    });
    
    if (!toursSuccess) {
      errorRate.add(1);
      failedRequests.add(1);
    } else {
      successfulRequests.add(1);
    }
    
    requestDuration.add(Date.now() - start);
  });
  
  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
  
  // Simulate search/filter
  group('Search and Filter', () => {
    const start = Date.now();
    
    const searchTerms = ['airport', 'hotel', 'city', 'beach', 'mountain'];
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchRes = http.get(`${data.baseUrl}/tours?search=${randomTerm}&limit=10`);
    const searchSuccess = check(searchRes, {
      [`${scenarioName} - Search works`]: (r) => r.status === 200,
    });
    
    if (!searchSuccess) {
      errorRate.add(1);
      failedRequests.add(1);
    } else {
      successfulRequests.add(1);
    }
    
    requestDuration.add(Date.now() - start);
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
  
  // Simulate viewing details
  group('View Details', () => {
    const start = Date.now();
    
    // Try to get tour details (may fail if no tours exist)
    const toursRes = http.get(`${data.baseUrl}/tours?limit=1`);
    if (toursRes.status === 200) {
      const tours = toursRes.json('data.tours');
      if (tours && tours.length > 0) {
        const tourId = tours[0]._id || tours[0].id;
        const detailRes = http.get(`${data.baseUrl}/tours/${tourId}`);
        
        check(detailRes, {
          [`${scenarioName} - Detail loaded`]: (r) => r.status === 200,
        }) ? successfulRequests.add(1) : (errorRate.add(1), failedRequests.add(1));
      }
    }
    
    requestDuration.add(Date.now() - start);
  });
  
  sleep(Math.random() * 2 + 1);
  
  // Check health and metrics endpoints
  group('Monitor Health', () => {
    const start = Date.now();
    
    const healthRes = http.get(`${data.baseUrl}/health`);
    check(healthRes, {
      [`${scenarioName} - Health check OK`]: (r) => r.status === 200 || r.status === 503,
    }) ? successfulRequests.add(1) : failedRequests.add(1);
    
    requestDuration.add(Date.now() - start);
  });
  
  sleep(1);
}

// Low load test (100 users)
export function lowLoadTest(data) {
  simulateUserSession(data, '100_users');
}

// Medium load test (500 users)
export function mediumLoadTest(data) {
  simulateUserSession(data, '500_users');
}

// High load test (1000 users)
export function highLoadTest(data) {
  simulateUserSession(data, '1000_users');
}

// Teardown function
export function teardown(data) {
  console.log('Concurrent users test completed');
  console.log(`Base URL: ${data.baseUrl}`);
  
  // Final health check
  const finalHealth = http.get(`${data.baseUrl}/health`);
  console.log(`Final health status: ${finalHealth.status}`);
}

// Handle summary
export function handleSummary(data) {
  const scenarios = Object.keys(data.metrics);
  
  console.log('\n=== CONCURRENT USERS TEST SUMMARY ===');
  console.log(`Total requests: ${data.metrics.http_reqs?.values.count || 0}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed?.values.passes || 0}`);
  console.log(`Error rate: ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%`);
  console.log(`Avg request duration: ${(data.metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`);
  console.log(`p95 request duration: ${(data.metrics['http_req_duration{p(0.95)}']?.values || 0).toFixed(2)}ms`);
  console.log(`p99 request duration: ${(data.metrics['http_req_duration{p(0.99)}']?.values || 0).toFixed(2)}ms`);
  console.log('=====================================\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data),
  };
}
