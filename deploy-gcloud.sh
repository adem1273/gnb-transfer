#!/bin/bash

# ============================================================================
# GNB Transfer - Google Cloud Deployment Script
# ============================================================================
# This script automates the deployment to Google Cloud Run
# Usage: ./deploy-gcloud.sh [environment]
# Example: ./deploy-gcloud.sh production
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-""}
REGION=${REGION:-us-central1}
SERVICE_NAME=${SERVICE_NAME:-gnb-transfer}
MEMORY=${MEMORY:-2Gi}
CPU=${CPU:-1}
MIN_INSTANCES=${MIN_INSTANCES:-1}
MAX_INSTANCES=${MAX_INSTANCES:-10}
TIMEOUT=${TIMEOUT:-300}

# Print functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "============================================================================"
    echo "$1"
    echo "============================================================================"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from:"
        print_error "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_info "✓ gcloud CLI is installed"
    
    # Check if docker is installed (optional, for local testing)
    if command -v docker &> /dev/null; then
        print_info "✓ Docker is installed"
    else
        print_warn "Docker is not installed (optional for local testing)"
    fi
    
    # Check if logged in to gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        print_error "Not logged in to gcloud. Run: gcloud auth login"
        exit 1
    fi
    print_info "✓ Logged in to gcloud"
    
    # Get or prompt for project ID
    if [ -z "$PROJECT_ID" ]; then
        CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
        if [ -z "$CURRENT_PROJECT" ]; then
            print_error "No project ID set. Set it with:"
            print_error "export GOOGLE_CLOUD_PROJECT=your-project-id"
            print_error "or run: gcloud config set project your-project-id"
            exit 1
        fi
        PROJECT_ID=$CURRENT_PROJECT
    fi
    print_info "✓ Using project: $PROJECT_ID"
    
    # Set the project
    gcloud config set project $PROJECT_ID
}

# Enable required APIs
enable_apis() {
    print_header "Enabling Required Google Cloud APIs"
    
    print_info "Enabling Cloud Run API..."
    gcloud services enable run.googleapis.com
    
    print_info "Enabling Cloud Build API..."
    gcloud services enable cloudbuild.googleapis.com
    
    print_info "Enabling Container Registry API..."
    gcloud services enable containerregistry.googleapis.com
    
    print_info "✓ All required APIs enabled"
}

# Build and deploy
deploy_to_cloud_run() {
    print_header "Deploying to Cloud Run"
    
    print_info "Building and deploying $SERVICE_NAME..."
    print_info "Region: $REGION"
    print_info "Memory: $MEMORY"
    print_info "CPU: $CPU"
    print_info "Min instances: $MIN_INSTANCES"
    print_info "Max instances: $MAX_INSTANCES"
    
    # Deploy using source-based deployment (Cloud Build will handle the build)
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory $MEMORY \
        --cpu $CPU \
        --timeout $TIMEOUT \
        --min-instances $MIN_INSTANCES \
        --max-instances $MAX_INSTANCES \
        --set-env-vars "NODE_ENV=production"
    
    print_info "✓ Deployment complete!"
}

# Get service URL
get_service_url() {
    print_header "Deployment Information"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format 'value(status.url)')
    
    print_info "Service URL: $SERVICE_URL"
    print_info "Health check: $SERVICE_URL/api/health"
    print_info "API docs: $SERVICE_URL/api/docs"
    print_info ""
    print_info "To view logs:"
    print_info "  gcloud run logs read --service=$SERVICE_NAME --region=$REGION"
    print_info ""
    print_info "To update environment variables:"
    print_info "  gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars \"VAR=value\""
    print_info ""
    print_info "To view service details:"
    print_info "  gcloud run services describe $SERVICE_NAME --region=$REGION"
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [ -z "$SERVICE_URL" ]; then
        print_warn "Could not get service URL. Skipping health check."
        return
    fi
    
    print_info "Testing health endpoint: $SERVICE_URL/api/health"
    
    # Wait a few seconds for service to be ready
    sleep 5
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_info "✓ Health check passed (HTTP $HTTP_CODE)"
    else
        print_warn "Health check returned HTTP $HTTP_CODE"
        print_warn "The service may still be starting up. Check logs with:"
        print_warn "  gcloud run logs read --service=$SERVICE_NAME --region=$REGION"
    fi
}

# Main execution
main() {
    print_header "GNB Transfer - Google Cloud Deployment"
    print_info "Environment: $ENVIRONMENT"
    print_info "Starting deployment process..."
    
    check_prerequisites
    enable_apis
    deploy_to_cloud_run
    get_service_url
    test_deployment
    
    print_header "Deployment Complete!"
    print_info "Next steps:"
    print_info "1. Configure environment variables in Cloud Console"
    print_info "2. Set up custom domain (optional)"
    print_info "3. Configure monitoring and alerts"
    print_info "4. Set up continuous deployment from GitHub"
    print_info ""
    print_info "See docs/DEPLOY_GOOGLE_CLOUD.md for detailed instructions"
}

# Run main function
main
