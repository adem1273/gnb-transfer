# K6 Load Testing Suite

This directory contains K6 load testing scripts for the GNB Transfer API.

## Overview

The test suite includes three main scenarios:

1. **booking-flow.js** - Complete user booking journey
2. **api-stress.js** - Comprehensive API endpoint testing
3. **concurrent-users.js** - Concurrent user load scenarios

## Prerequisites

Install K6:

```bash
# macOS (using Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (using Chocolatey)
choco install k6
```

## Running Tests

### Basic Usage

```bash
# Run a test
k6 run booking-flow.js

# Run with custom API URL
k6 run -e API_URL=http://staging-server:5000/api booking-flow.js

# Run with custom duration/VUs
k6 run --vus 50 --duration 5m api-stress.js
```

### Advanced Options

```bash
# Generate HTML report
k6 run --out html=results/test-report.html booking-flow.js

# Generate JSON output
k6 run --out json=results/test-results.json booking-flow.js

# Run specific scenario (for concurrent-users.js)
k6 run --scenario-name low_load concurrent-users.js

# Disable thresholds (run without failing)
k6 run --no-thresholds booking-flow.js

# Quiet mode
k6 run --quiet booking-flow.js
```

## Test Details

### 1. Booking Flow Test (`booking-flow.js`)

Simulates a complete user journey from registration to payment.

**Test Stages:**
- Ramp up to 10 users (2 min)
- Hold at 10 users (5 min)
- Ramp up to 50 users (2 min)
- Hold at 50 users (5 min)
- Ramp up to 100 users (2 min)
- Hold at 100 users (5 min)
- Ramp down to 0 (2 min)

**Total Duration:** ~23 minutes

**Scenarios Tested:**
1. User registration
2. User login
3. Browse tours
4. View tour details
5. Create booking
6. Process payment

**Performance Thresholds:**
- p95 request duration < 200ms
- Error rate < 1%
- Booking completion time < 500ms (p95)
- Payment processing time < 1000ms (p95)

**Example Run:**

```bash
k6 run k6-tests/booking-flow.js
```

### 2. API Stress Test (`api-stress.js`)

Tests all major API endpoints under load.

**Test Stages:**
- Ramp up to 20 users (1 min)
- Hold at 20 users (3 min)
- Ramp up to 50 users (1 min)
- Hold at 50 users (3 min)
- Ramp up to 100 users (1 min)
- Hold at 100 users (3 min)
- Ramp down to 0 (1 min)

**Total Duration:** ~13 minutes

**Endpoints Tested:**
- Authentication (register, login)
- Tours (list, search, filter, detail)
- Bookings (list, create)
- User Profile (get, update)
- Public endpoints (health, FAQ, etc.)

**Performance Thresholds:**
- p95 request duration < 200ms
- Error rate < 1%

**Example Run:**

```bash
k6 run k6-tests/api-stress.js
```

### 3. Concurrent Users Test (`concurrent-users.js`)

Tests system behavior with different concurrent user loads.

**Scenarios:**
- **Low Load**: 100 concurrent users for 5 minutes
- **Medium Load**: 500 concurrent users for 5 minutes (disabled by default)
- **High Load**: 1000 concurrent users for 5 minutes (disabled by default)

**Enable Scenarios:**

Edit `concurrent-users.js` and uncomment the desired scenario in the `options.scenarios` object.

**Actions Performed:**
- Browse tours
- Search/filter
- View details
- Health monitoring

**Performance Thresholds:**
- p95 request duration < 200ms
- p99 request duration < 500ms
- Error rate < 1%

**Example Run:**

```bash
# Run low load (100 users)
k6 run k6-tests/concurrent-users.js

# Run medium load (500 users) - after enabling in the file
k6 run k6-tests/concurrent-users.js

# Run high load (1000 users) - after enabling in the file
k6 run k6-tests/concurrent-users.js
```

## Interpreting Results

### Key Metrics

K6 provides several important metrics:

```
✓ checks.........................: 98.50% ✓ 9850  ✗ 150
✓ data_received.................: 1.2 MB 40 kB/s
✓ data_sent.....................: 890 kB 30 kB/s
✓ http_req_blocked..............: avg=1.2ms  min=0.5ms  med=1.0ms  max=25ms   p(90)=2.1ms  p(95)=3.5ms
✓ http_req_connecting...........: avg=0.8ms  min=0.3ms  med=0.7ms  max=20ms   p(90)=1.5ms  p(95)=2.1ms
✓ http_req_duration.............: avg=45ms   min=12ms   med=38ms   max=250ms  p(90)=95ms   p(95)=150ms
✓ http_req_failed...............: 0.23%  ✓ 23    ✗ 9977
✓ http_req_receiving............: avg=0.5ms  min=0.1ms  med=0.4ms  max=5ms    p(90)=1ms    p(95)=1.5ms
✓ http_req_sending..............: avg=0.3ms  min=0.1ms  med=0.2ms  max=3ms    p(90)=0.5ms  p(95)=0.8ms
✓ http_req_tls_handshaking......: avg=0ms    min=0ms    med=0ms    max=0ms    p(90)=0ms    p(95)=0ms
✓ http_req_waiting..............: avg=44ms   min=11ms   med=37ms   max=245ms  p(90)=93ms   p(95)=148ms
✓ http_reqs.....................: 10000  166.67/s
✓ iteration_duration............: avg=2.1s   min=1.8s   med=2.0s   max=3.5s   p(90)=2.4s   p(95)=2.8s
✓ iterations....................: 2000   33.33/iter/s
✓ vus...........................: 100    min=10   max=100
✓ vus_max.......................: 100    min=100  max=100
```

**Important Metrics Explained:**

- **checks**: Percentage of successful checks (validation assertions)
- **http_req_duration**: Total request duration (time from request to response)
  - **p(95)**: 95th percentile - 95% of requests completed within this time
  - **p(99)**: 99th percentile - 99% of requests completed within this time
- **http_req_failed**: Percentage of failed HTTP requests
- **http_reqs**: Total number of requests and requests per second
- **iteration_duration**: Time to complete one full iteration of the test
- **vus**: Number of virtual users

### Success Criteria

A test is considered successful if:

1. **Checks Pass Rate** ≥ 95%
2. **Error Rate** < 1% (http_req_failed < 0.01)
3. **p95 Response Time** < 200ms
4. **p99 Response Time** < 500ms
5. **No Critical Failures** (5xx errors)

### Performance Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| p95 Response Time | < 100ms | < 200ms | > 500ms |
| p99 Response Time | < 200ms | < 500ms | > 1000ms |
| Error Rate | < 0.1% | < 1% | > 5% |
| Throughput | > 200 req/s | > 100 req/s | < 50 req/s |
| Success Rate | > 99.9% | > 99% | < 95% |

## Custom Metrics

Each test exports custom metrics for detailed analysis:

### booking-flow.js
- `errors` - Overall error rate
- `booking_duration` - Time to create a booking
- `payment_duration` - Time to process a payment
- `successful_bookings` - Counter of successful bookings
- `failed_bookings` - Counter of failed bookings

### api-stress.js
- `errors` - Overall error rate
- `auth_duration` - Authentication endpoint duration
- `tours_duration` - Tours endpoint duration
- `bookings_duration` - Bookings endpoint duration

### concurrent-users.js
- `errors` - Overall error rate
- `request_duration` - Individual request duration
- `successful_requests` - Counter of successful requests
- `failed_requests` - Counter of failed requests

## Troubleshooting

### Common Issues

#### High Error Rates

```bash
# Check API health
curl http://localhost:5000/api/health

# Check logs
docker-compose logs backend

# Reduce load
# Edit test file to reduce VUs or duration
```

#### Connection Timeouts

```bash
# Increase timeout in test
export K6_HTTP_TIMEOUT=30s
k6 run booking-flow.js

# Or modify test file:
http.setDefaultTimeout(30000); // 30 seconds
```

#### Memory Issues

```bash
# Run with limited VUs
k6 run --vus 10 booking-flow.js

# Use batch mode for large datasets
k6 run --batch 10 booking-flow.js
```

#### Authentication Failures

```bash
# Seed test users
docker-compose run backend node scripts/seed-staging.mjs

# Check credentials in test file
# Verify API endpoint URLs
```

## Best Practices

1. **Start Small**: Begin with low load and gradually increase
2. **Monitor Resources**: Watch CPU, memory, and disk during tests
3. **Use Realistic Data**: Test with production-like data volumes
4. **Test Regularly**: Run load tests before each release
5. **Compare Results**: Track metrics over time to spot regressions
6. **Test Edge Cases**: Include error scenarios and edge cases
7. **Clean Up**: Reset test data between runs
8. **Document Findings**: Record performance bottlenecks and solutions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 1' # Run every Monday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Load Tests
        run: |
          k6 run --out json=results.json k6-tests/booking-flow.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

## Additional Resources

- [K6 Documentation](https://k6.io/docs/)
- [K6 Examples](https://k6.io/docs/examples/)
- [K6 Metrics Guide](https://k6.io/docs/using-k6/metrics/)
- [K6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)

---

**Last Updated**: 2024-01-02
