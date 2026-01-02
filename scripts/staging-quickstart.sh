#!/bin/bash

###############################################################################
# GNB Transfer - Staging Environment Quick Start
###############################################################################
# 
# This script sets up and starts the complete staging environment.
#
# Usage:
#   ./scripts/staging-quickstart.sh
#
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  GNB Transfer - Staging Quick Start           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Step 2: Generate SSL certificates
echo -e "${BLUE}[2/6]${NC} Generating SSL certificates..."

if [ ! -f "$PROJECT_ROOT/ssl-certs/cert.pem" ]; then
    "${SCRIPT_DIR}/generate-ssl-certs.sh"
else
    echo -e "${YELLOW}⚠ SSL certificates already exist, skipping${NC}"
fi

# Step 3: Check environment file
echo -e "${BLUE}[3/6]${NC} Checking environment configuration..."

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}⚠ .env file not found, creating from example...${NC}"
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/.env" || true
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
fi

# Step 4: Build images
echo -e "${BLUE}[4/6]${NC} Building Docker images..."

cd "$PROJECT_ROOT"
docker-compose -f docker-compose.staging.yml build

echo -e "${GREEN}✓ Images built${NC}"

# Step 5: Start services
echo -e "${BLUE}[5/6]${NC} Starting services..."

docker-compose -f docker-compose.staging.yml up -d

echo -e "${GREEN}✓ Services started${NC}"

# Step 6: Wait for services to be ready
echo -e "${BLUE}[6/6]${NC} Waiting for services to be ready..."

sleep 10

# Check health
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    retry_count=$((retry_count + 1))
    echo -n "."
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    echo -e "${YELLOW}⚠ Backend health check timed out (this is normal on first run)${NC}"
fi

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✓ Staging environment is ready!${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "Access URLs:"
echo "  • Backend API:  http://localhost:5000"
echo "  • Frontend:     http://localhost:80"
echo "  • Prometheus:   http://localhost:9090"
echo "  • Grafana:      http://localhost:3001"
echo ""
echo "Grafana Login:"
echo "  • Username: admin"
echo "  • Password: admin123"
echo ""
echo "Next Steps:"
echo "  1. Seed database:"
echo "     docker-compose -f docker-compose.staging.yml run --rm backend node scripts/seed-staging.mjs"
echo ""
echo "  2. Run load tests:"
echo "     k6 run k6-tests/booking-flow.js"
echo ""
echo "  3. View logs:"
echo "     docker-compose -f docker-compose.staging.yml logs -f"
echo ""
echo "  4. Stop environment:"
echo "     docker-compose -f docker-compose.staging.yml down"
echo ""
echo "For detailed documentation, see: docs/STAGING_DEPLOYMENT.md"
echo ""
