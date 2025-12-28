#!/bin/bash
# Manual Test Script for Super Admin Endpoints
# This script tests the super admin functionality manually
# Requires: curl, jq (optional for pretty output)

set -e

# Configuration
BASE_URL="http://localhost:5000"
API_V1="${BASE_URL}/api/v1"

echo "=== Super Admin Core System Manual Test ==="
echo ""

# Function to make authenticated requests
make_request() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4
  
  if [ -n "$data" ]; then
    curl -s -X $method \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "${API_V1}${endpoint}"
  else
    curl -s -X $method \
      -H "Authorization: Bearer $token" \
      "${API_V1}${endpoint}"
  fi
}

echo "Prerequisites:"
echo "1. Server must be running on $BASE_URL"
echo "2. You need a valid super admin JWT token"
echo ""
echo "To generate a test token, run:"
echo "  node -e \"const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:'test',email:'super@test.com',role:'superadmin',name:'Test Super Admin'},'YOUR_JWT_SECRET',{expiresIn:'1h'}))\""
echo ""

# Check if token is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <superadmin_jwt_token> [admin_jwt_token]"
  echo ""
  echo "Example test flow (after getting tokens):"
  echo "  1. GET system settings"
  echo "  2. Update system settings"
  echo "  3. Activate kill switch"
  echo "  4. Restore system"
  echo "  5. Verify admin cannot access (if admin token provided)"
  exit 1
fi

SUPER_ADMIN_TOKEN=$1
ADMIN_TOKEN=$2

echo "=== Test 1: Get System Settings ==="
echo "GET ${API_V1}/super-admin/system-settings"
response=$(make_request GET /super-admin/system-settings "$SUPER_ADMIN_TOKEN")
echo "$response" | (command -v jq >/dev/null && jq . || cat)
echo ""

echo "=== Test 2: Update System Settings ==="
echo "PUT ${API_V1}/super-admin/system-settings"
data='{"bookingEnabled":true,"paymentEnabled":true,"registrationsEnabled":true}'
response=$(make_request PUT /super-admin/system-settings "$SUPER_ADMIN_TOKEN" "$data")
echo "$response" | (command -v jq >/dev/null && jq . || cat)
echo ""

echo "=== Test 3: Activate Kill Switch ==="
echo "POST ${API_V1}/super-admin/kill-switch"
data='{"message":"Test emergency maintenance","reason":"Manual testing"}'
response=$(make_request POST /super-admin/kill-switch "$SUPER_ADMIN_TOKEN" "$data")
echo "$response" | (command -v jq >/dev/null && jq . || cat)
echo ""

echo "=== Test 4: Restore System ==="
echo "POST ${API_V1}/super-admin/restore"
response=$(make_request POST /super-admin/restore "$SUPER_ADMIN_TOKEN")
echo "$response" | (command -v jq >/dev/null && jq . || cat)
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  echo "=== Test 5: Verify Admin Cannot Access (should return 403) ==="
  echo "GET ${API_V1}/super-admin/system-settings (with admin token)"
  response=$(make_request GET /super-admin/system-settings "$ADMIN_TOKEN")
  echo "$response" | (command -v jq >/dev/null && jq . || cat)
  echo ""
fi

echo "=== Manual Tests Complete ==="
echo ""
echo "To verify audit logs, check the AdminLog collection in MongoDB:"
echo "  db.adminlogs.find({action: {\$in: ['KILL_SWITCH_ACTIVATED', 'SYSTEM_SETTINGS_UPDATE']}}).sort({createdAt: -1})"
