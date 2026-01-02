#!/bin/bash

#==============================================================================
# GNB Transfer - Backup & Recovery System Test
#==============================================================================
# This script tests the backup and recovery system without requiring
# a live MongoDB connection.
#==============================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test 1: Script permissions
test_script_permissions() {
    log_test "Testing script permissions..."
    
    if [[ -x "scripts/backup-database.sh" ]] && \
       [[ -x "scripts/restore-database.sh" ]] && \
       [[ -x "scripts/verify-backup.sh" ]]; then
        log_pass "All scripts are executable"
    else
        log_fail "Some scripts are not executable"
    fi
}

# Test 2: Script help messages
test_help_messages() {
    log_test "Testing script help messages..."
    
    local result=0
    ./scripts/backup-database.sh --help &>/dev/null || result=1
    ./scripts/restore-database.sh --help &>/dev/null || result=1
    ./scripts/verify-backup.sh --help &>/dev/null || result=1
    
    if [[ $result -eq 0 ]]; then
        log_pass "All scripts have working help messages"
    else
        log_fail "Some scripts have broken help messages"
    fi
}

# Test 3: Workflow files exist
test_workflow_files() {
    log_test "Testing workflow files existence..."
    
    if [[ -f ".github/workflows/backup.yml" ]] && \
       [[ -f ".github/workflows/backup-test.yml" ]]; then
        log_pass "All required workflow files exist"
    else
        log_fail "Some workflow files are missing"
    fi
}

# Test 4: YAML syntax validation
test_yaml_syntax() {
    log_test "Testing YAML syntax..."
    
    if python3 -c "
import yaml
with open('.github/workflows/backup.yml') as f: yaml.safe_load(f)
with open('.github/workflows/backup-test.yml') as f: yaml.safe_load(f)
" 2>/dev/null; then
        log_pass "All YAML files have valid syntax"
    else
        log_fail "YAML syntax validation failed"
    fi
}

# Test 5: Documentation exists
test_documentation() {
    log_test "Testing documentation..."
    
    if [[ -f "docs/DISASTER_RECOVERY.md" ]] && \
       [[ -f "scripts/README.md" ]]; then
        log_pass "All required documentation exists"
    else
        log_fail "Some documentation is missing"
    fi
}

# Test 6: Environment variables documented
test_env_variables() {
    log_test "Testing environment variables documentation..."
    
    if grep -q "BACKUP_ENCRYPTION_KEY" backend/.env.example && \
       grep -q "GCS_BACKUP_BUCKET" backend/.env.example && \
       grep -q "DISCORD_WEBHOOK_URL" backend/.env.example; then
        log_pass "All new environment variables are documented"
    else
        log_fail "Some environment variables are not documented"
    fi
}

# Test 7: .gitignore configuration
test_gitignore() {
    log_test "Testing .gitignore configuration..."
    
    if grep -q "backups/" .gitignore && \
       grep -q "*.metadata.json" .gitignore && \
       grep -q "*.tar.gz.enc" .gitignore; then
        log_pass ".gitignore properly configured for backups"
    else
        log_fail ".gitignore missing backup entries"
    fi
}

# Test 8: Workflow structure validation
test_workflow_structure() {
    log_test "Testing workflow structure..."
    
    # Check backup.yml has required jobs
    if grep -q "pre-deployment-backup" .github/workflows/production-deploy.yml && \
       grep -q "test-backup-restore" .github/workflows/backup-test.yml && \
       grep -q "backup-mongodb" .github/workflows/backup.yml; then
        log_pass "Workflow structure is correct"
    else
        log_fail "Workflow structure has issues"
    fi
}

# Test 9: Script error handling
test_error_handling() {
    log_test "Testing script error handling..."
    
    # Test backup script without MONGO_URI or mongodump
    if ./scripts/backup-database.sh --type full 2>&1 | grep -qE "(MONGO_URI.*not set|mongodump not found)"; then
        log_pass "Scripts have proper error handling"
    else
        log_fail "Error handling may be incomplete"
    fi
}

# Test 10: Documentation completeness
test_documentation_completeness() {
    log_test "Testing documentation completeness..."
    
    # Check DISASTER_RECOVERY.md has key sections
    if grep -q "RTO" docs/DISASTER_RECOVERY.md && \
       grep -q "RPO" docs/DISASTER_RECOVERY.md && \
       grep -q "Recovery Procedures" docs/DISASTER_RECOVERY.md && \
       grep -q "Incident Response" docs/DISASTER_RECOVERY.md; then
        log_pass "Documentation is comprehensive"
    else
        log_fail "Documentation is incomplete"
    fi
}

# Test 11: Notification support
test_notification_support() {
    log_test "Testing notification support..."
    
    # Check if workflows support both Slack and Discord
    if grep -q "SLACK_WEBHOOK_URL" .github/workflows/backup.yml && \
       grep -q "DISCORD_WEBHOOK_URL" .github/workflows/backup.yml && \
       grep -q "DISCORD_WEBHOOK_URL" .github/workflows/backup-test.yml; then
        log_pass "Notification support (Slack + Discord) implemented"
    else
        log_fail "Notification support incomplete"
    fi
}

# Test 12: Retention policies
test_retention_policies() {
    log_test "Testing retention policies..."
    
    # Check if retention policies are configured
    if grep -q "retention" .github/workflows/backup.yml && \
       grep -q "7 days" .github/workflows/backup.yml && \
       grep -q "90 days" docs/DISASTER_RECOVERY.md; then
        log_pass "Retention policies properly configured"
    else
        log_fail "Retention policies may be missing"
    fi
}

# Run all tests
main() {
    echo "========================================"
    echo "  Backup & Recovery System Test Suite"
    echo "========================================"
    echo ""
    
    cd "$(dirname "$0")/.."
    
    test_script_permissions
    test_help_messages
    test_workflow_files
    test_yaml_syntax
    test_documentation
    test_env_variables
    test_gitignore
    test_workflow_structure
    test_error_handling
    test_documentation_completeness
    test_notification_support
    test_retention_policies
    
    echo ""
    echo "========================================"
    echo "  Test Summary"
    echo "========================================"
    echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Failed:${NC} $TESTS_FAILED"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed!${NC}"
        exit 1
    fi
}

main
