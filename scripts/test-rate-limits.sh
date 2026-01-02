#!/bin/bash

# Rate Limiting Load Test Script
# Tests that rate limits are working correctly under load
#
# Usage: ./test-rate-limits.sh <backend-url>
# Example: ./test-rate-limits.sh http://localhost:5000

set -e

BACKEND_URL="${1:-http://localhost:5000}"
RESULTS_DIR="./load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== GNB Transfer Rate Limiting Load Test ==="
echo "Backend URL: $BACKEND_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local requests=$2
  local expected_limit=$3
  local test_name=$4
  
  echo "Testing: $test_name"
  echo "Endpoint: $endpoint"
  echo "Requests: $requests"
  echo "Expected limit: $expected_limit"
  
  local success_count=0
  local rate_limited_count=0
  local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.log"
  
  for i in $(seq 1 "$requests"); do
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
      ((success_count++))
      echo "Request $i: OK ($http_code)" >> "$output_file"
    elif [ "$http_code" = "429" ]; then
      ((rate_limited_count++))
      echo "Request $i: RATE LIMITED ($http_code)" >> "$output_file"
    else
      echo "Request $i: ERROR ($http_code)" >> "$output_file"
    fi
    
    # Show progress every 10 requests
    if [ $((i % 10)) -eq 0 ]; then
      echo -n "."
    fi
  done
  
  echo ""
  echo "Results:"
  echo "  Success: $success_count"
  echo "  Rate Limited: $rate_limited_count"
  
  # Verify rate limit was applied
  if [ "$rate_limited_count" -gt 0 ]; then
    echo -e "  ${GREEN}✓ Rate limiting is working${NC}"
  else
    echo -e "  ${YELLOW}⚠ No rate limiting detected${NC}"
  fi
  
  echo "  Log saved to: $output_file"
  echo ""
}

# Function to test with auth
test_with_auth() {
  local endpoint=$1
  local requests=$2
  local expected_limit=$3
  local test_name=$4
  local token=$5
  
  echo "Testing: $test_name (Authenticated)"
  echo "Endpoint: $endpoint"
  echo "Requests: $requests"
  echo "Expected limit: $expected_limit"
  
  local success_count=0
  local rate_limited_count=0
  local output_file="$RESULTS_DIR/${test_name}_auth_${TIMESTAMP}.log"
  
  for i in $(seq 1 "$requests"); do
    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $token" \
      "$BACKEND_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
      ((success_count++))
      echo "Request $i: OK ($http_code)" >> "$output_file"
    elif [ "$http_code" = "429" ]; then
      ((rate_limited_count++))
      echo "Request $i: RATE LIMITED ($http_code)" >> "$output_file"
    else
      echo "Request $i: ERROR ($http_code)" >> "$output_file"
    fi
    
    if [ $((i % 10)) -eq 0 ]; then
      echo -n "."
    fi
  done
  
  echo ""
  echo "Results:"
  echo "  Success: $success_count"
  echo "  Rate Limited: $rate_limited_count"
  
  if [ "$rate_limited_count" -gt 0 ]; then
    echo -e "  ${GREEN}✓ Rate limiting is working${NC}"
  else
    echo -e "  ${YELLOW}⚠ No rate limiting detected${NC}"
  fi
  
  echo "  Log saved to: $output_file"
  echo ""
}

# Test 1: Anonymous user limit (100 requests / 15 min)
echo "========================================="
echo "Test 1: Anonymous User Limit"
echo "========================================="
test_endpoint "/api/tours" 110 100 "anonymous_limit"

# Wait a bit between tests
sleep 2

# Test 2: Auth endpoint strict limit (5 requests / 15 min)
echo "========================================="
echo "Test 2: Auth Endpoint Strict Limit"
echo "========================================="
test_endpoint "/api/auth/refresh" 10 5 "auth_strict_limit"

# Wait between tests
sleep 2

# Test 3: Check rate limit headers
echo "========================================="
echo "Test 3: Rate Limit Headers"
echo "========================================="
echo "Making request to check headers..."

response=$(curl -s -i "$BACKEND_URL/api/tours" 2>&1)

echo "Headers:"
echo "$response" | grep -i "x-ratelimit" || echo "No rate limit headers found"
echo "$response" | grep -i "retry-after" || echo "No retry-after header (not rate limited)"
echo ""

# Test 4: Multiple rapid requests (suspicious pattern detection)
echo "========================================="
echo "Test 4: Rapid Request Detection"
echo "========================================="
echo "Sending 15 requests in rapid succession..."

for i in $(seq 1 15); do
  curl -s "$BACKEND_URL/api/tours" > /dev/null &
done

wait
echo "Rapid requests sent. Check logs for suspicious pattern detection."
echo ""

# Summary
echo "========================================="
echo "Load Test Summary"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Results saved in: $RESULTS_DIR"
echo ""
echo "Next steps:"
echo "1. Check admin API for violations: GET $BACKEND_URL/api/admin/rate-limits/violations"
echo "2. Review test logs in $RESULTS_DIR"
echo "3. Verify Redis keys: redis-cli KEYS 'gnb:ratelimit:*'"
echo ""
echo -e "${GREEN}Load test completed!${NC}"
