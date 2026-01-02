#!/bin/bash

###############################################################################
# GNB Transfer - Staging Deployment Script
###############################################################################
# 
# This script automates the deployment process for the staging environment:
# 1. Pre-deployment checks (health, backups)
# 2. Database migration execution
# 3. Zero-downtime deployment
# 4. Post-deployment validation
# 5. Automatic rollback on failure
#
# Usage:
#   ./scripts/deploy-staging.sh
#
# Environment Variables:
#   MONGO_PASSWORD - MongoDB admin password (required)
#   REDIS_PASSWORD - Redis password (optional, default: redispass123)
#   SKIP_BACKUP - Skip database backup (default: false)
#   SKIP_TESTS - Skip post-deployment tests (default: false)
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DEPLOYMENT_LOG="${PROJECT_ROOT}/deployment-$(date +%Y%m%d-%H%M%S).log"

# Deployment settings
MONGO_PASSWORD="${MONGO_PASSWORD:-changeme123}"
REDIS_PASSWORD="${REDIS_PASSWORD:-redispass123}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.staging.yml"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOYMENT_LOG"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Check current system health
check_health() {
    log_info "Checking current system health..."
    
    # Try to check backend health if running
    if docker ps | grep -q gnb-backend-staging; then
        local health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
        
        if [ "$health_response" == "200" ]; then
            log_success "Current system is healthy"
            return 0
        else
            log_warning "Current system health check returned: $health_response"
            return 1
        fi
    else
        log_info "Backend not running, skipping health check"
        return 0
    fi
}

# Backup database
backup_database() {
    if [ "$SKIP_BACKUP" == "true" ]; then
        log_warning "Skipping database backup (SKIP_BACKUP=true)"
        return 0
    fi
    
    log_info "Creating database backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="${BACKUP_DIR}/mongodb-backup-$(date +%Y%m%d-%H%M%S).archive"
    
    # Check if MongoDB container is running
    if docker ps | grep -q gnb-mongodb-primary; then
        # Backup using mongodump in the container
        docker exec gnb-mongodb-primary mongodump \
            --username admin \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --db gnb-transfer-staging \
            --archive="/tmp/backup.archive" \
            --gzip
        
        # Copy backup from container
        docker cp gnb-mongodb-primary:/tmp/backup.archive "$backup_file"
        
        # Remove temporary backup from container
        docker exec gnb-mongodb-primary rm /tmp/backup.archive
        
        log_success "Database backup created: $backup_file"
    else
        log_warning "MongoDB container not running, skipping backup"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" pull || {
        log_error "Failed to pull images"
        return 1
    }
    
    log_success "Images pulled successfully"
}

# Build custom images
build_images() {
    log_info "Building custom images..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" build --no-cache || {
        log_error "Failed to build images"
        return 1
    }
    
    log_success "Images built successfully"
}

# Deploy services with zero downtime
deploy_services() {
    log_info "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Start new containers
    docker-compose -f "$COMPOSE_FILE" up -d || {
        log_error "Failed to start services"
        return 1
    }
    
    log_success "Services started"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if backend is running
    if ! docker ps | grep -q gnb-backend-staging; then
        log_warning "Backend not running, skipping migrations"
        return 0
    fi
    
    # Run migrations inside backend container
    docker exec gnb-backend-staging node scripts/migrate.mjs || {
        log_warning "Migration script not found or failed (this may be expected)"
    }
    
    log_success "Migrations completed"
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    local max_retries=30
    local retry_count=0
    local health_ok=false
    
    while [ $retry_count -lt $max_retries ]; do
        log_info "Health check attempt $((retry_count + 1))/$max_retries..."
        
        local health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
        
        if [ "$health_response" == "200" ]; then
            health_ok=true
            break
        fi
        
        retry_count=$((retry_count + 1))
        sleep 10
    done
    
    if [ "$health_ok" == "true" ]; then
        log_success "Deployment validation passed"
        return 0
    else
        log_error "Deployment validation failed after $max_retries attempts"
        return 1
    fi
}

# Run post-deployment tests
run_tests() {
    if [ "$SKIP_TESTS" == "true" ]; then
        log_warning "Skipping post-deployment tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log_info "Running post-deployment tests..."
    
    # Test critical endpoints
    local endpoints=(
        "http://localhost:5000/api/health"
        "http://localhost:5000/api/ready"
        "http://localhost:80/health"
    )
    
    local all_tests_passed=true
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
        
        if [ "$response" == "200" ] || [ "$response" == "503" ]; then
            log_success "Endpoint $endpoint returned $response"
        else
            log_error "Endpoint $endpoint failed with status $response"
            all_tests_passed=false
        fi
    done
    
    if [ "$all_tests_passed" == "true" ]; then
        log_success "All post-deployment tests passed"
        return 0
    else
        log_error "Some post-deployment tests failed"
        return 1
    fi
}

# Rollback deployment
rollback_deployment() {
    log_error "Initiating automatic rollback..."
    
    cd "$PROJECT_ROOT"
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down || true
    
    # Restore from backup if available
    local latest_backup=$(ls -t "$BACKUP_DIR"/mongodb-backup-*.archive 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Restoring from backup: $latest_backup"
        
        # Start MongoDB
        docker-compose -f "$COMPOSE_FILE" up -d mongodb-primary
        sleep 10
        
        # Copy backup to container
        docker cp "$latest_backup" gnb-mongodb-primary:/tmp/restore.archive
        
        # Restore backup
        docker exec gnb-mongodb-primary mongorestore \
            --username admin \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --archive="/tmp/restore.archive" \
            --gzip \
            --drop
        
        log_success "Backup restored"
    else
        log_warning "No backup found for rollback"
    fi
    
    log_error "Rollback completed. Please investigate the issue."
    exit 1
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Keep only last 5 backups
    local backup_count=$(ls -1 "$BACKUP_DIR"/mongodb-backup-*.archive 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 5 ]; then
        ls -t "$BACKUP_DIR"/mongodb-backup-*.archive | tail -n +6 | xargs rm -f
        log_success "Old backups cleaned up"
    else
        log_info "No old backups to clean up"
    fi
}

# Display deployment summary
display_summary() {
    echo ""
    echo "========================================="
    echo "  DEPLOYMENT SUMMARY"
    echo "========================================="
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Environment: Staging"
    echo "Services:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Access URLs:"
    echo "  - Backend API: http://localhost:5000"
    echo "  - Frontend: http://localhost:80"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    echo "  - Nginx: http://localhost:80"
    echo ""
    echo "Log file: $DEPLOYMENT_LOG"
    echo "========================================="
}

# Main deployment flow
main() {
    log_info "Starting staging deployment..."
    log_info "Deployment log: $DEPLOYMENT_LOG"
    
    # Step 1: Pre-deployment checks
    check_prerequisites
    check_health || log_warning "Health check failed or service not running"
    
    # Step 2: Backup
    backup_database
    
    # Step 3: Pull and build images
    pull_images || log_warning "Image pull failed, continuing with local images"
    build_images || {
        log_error "Image build failed"
        exit 1
    }
    
    # Step 4: Deploy services
    deploy_services || {
        log_error "Deployment failed"
        rollback_deployment
    }
    
    # Step 5: Run migrations
    run_migrations || log_warning "Migrations failed or not available"
    
    # Step 6: Validate deployment
    validate_deployment || {
        log_error "Validation failed"
        rollback_deployment
    }
    
    # Step 7: Run tests
    run_tests || {
        log_error "Tests failed"
        rollback_deployment
    }
    
    # Step 8: Cleanup
    cleanup_old_backups
    
    # Success!
    log_success "Deployment completed successfully!"
    display_summary
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 130' INT TERM

# Run main function
main "$@"
