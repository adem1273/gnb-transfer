#!/bin/bash

#==============================================================================
# GNB Transfer - Backup Verification Script
#==============================================================================
# This script verifies backup integrity through checksum validation and
# performs a test restore to ensure backups can be successfully restored.
#
# Usage:
#   ./verify-backup.sh [OPTIONS]
#
# Options:
#   --backup-file FILE         Path to backup file (required)
#   --metadata-file FILE       Path to metadata file (auto-detected if not provided)
#   --decrypt                  Decrypt backup before verification
#   --test-restore             Perform test restore to verify backup
#   --mongo-uri URI            Test MongoDB URI for restore test
#   --help                     Show this help message
#
# Environment Variables:
#   BACKUP_ENCRYPTION_KEY      AES-256 decryption key (if encrypted)
#   TEST_MONGO_URI             Test MongoDB URI for restore verification
#
# Examples:
#   ./verify-backup.sh --backup-file backups/gnb-transfer-backup-20260102_120000.tar.gz.enc --decrypt
#   ./verify-backup.sh --backup-file backups/latest.tar.gz --test-restore
#==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKUP_FILE=""
METADATA_FILE=""
DECRYPT_BACKUP=false
TEST_RESTORE=false
MONGO_URI="${TEST_MONGO_URI:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
TEMP_DIR="/tmp/gnb-verify-$$"

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    head -n 26 "$0" | tail -n 24 | sed 's/^# //;s/^#//'
    exit 0
}

# Cleanup function
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-file)
                BACKUP_FILE="$2"
                shift 2
                ;;
            --metadata-file)
                METADATA_FILE="$2"
                shift 2
                ;;
            --decrypt)
                DECRYPT_BACKUP=true
                shift
                ;;
            --test-restore)
                TEST_RESTORE=true
                shift
                ;;
            --mongo-uri)
                MONGO_URI="$2"
                shift 2
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

# Validate requirements
validate_requirements() {
    log_info "Validating requirements..."
    
    # Check backup file
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file not specified. Use --backup-file option."
        exit 1
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # Auto-detect metadata file if not provided
    if [[ -z "$METADATA_FILE" ]]; then
        local BASE_NAME="${BACKUP_FILE%.tar.gz.enc}"
        BASE_NAME="${BASE_NAME%.tar.gz}"
        METADATA_FILE="${BASE_NAME}.metadata.json"
    fi
    
    # Check decryption key if decryption is enabled
    if [[ "$DECRYPT_BACKUP" == true && -z "$ENCRYPTION_KEY" ]]; then
        log_error "Decryption enabled but BACKUP_ENCRYPTION_KEY is not set"
        exit 1
    fi
    
    # Check MongoDB URI if test restore is enabled
    if [[ "$TEST_RESTORE" == true ]]; then
        if ! command -v mongorestore &> /dev/null; then
            log_error "mongorestore not found. Please install MongoDB Database Tools."
            exit 1
        fi
        
        if [[ -z "$MONGO_URI" ]]; then
            log_error "Test restore enabled but TEST_MONGO_URI is not set"
            exit 1
        fi
    fi
    
    log_success "Requirements validated"
}

# Create temporary directory
create_temp_dir() {
    log_info "Creating temporary directory: $TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    log_success "Temporary directory created"
}

# Verify file exists and is readable
verify_file_access() {
    log_info "Verifying file access..."
    
    if [[ ! -r "$BACKUP_FILE" ]]; then
        log_error "Cannot read backup file: $BACKUP_FILE"
        exit 1
    fi
    
    local SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
    local SIZE_HUMAN=$(du -h "$BACKUP_FILE" | cut -f1)
    
    if [[ $SIZE -eq 0 ]]; then
        log_error "Backup file is empty"
        exit 1
    fi
    
    log_success "Backup file is accessible: $SIZE_HUMAN"
}

# Verify checksum against metadata
verify_checksum() {
    log_info "Verifying backup checksums..."
    
    if [[ ! -f "$METADATA_FILE" ]]; then
        log_warning "Metadata file not found: $METADATA_FILE"
        log_info "Skipping checksum verification"
        return
    fi
    
    # Read expected checksums from metadata
    local EXPECTED_MD5=$(jq -r '.md5_checksum' "$METADATA_FILE" 2>/dev/null || echo "")
    local EXPECTED_SHA256=$(jq -r '.sha256_checksum' "$METADATA_FILE" 2>/dev/null || echo "")
    
    if [[ -z "$EXPECTED_MD5" || "$EXPECTED_MD5" == "null" ]]; then
        log_warning "No MD5 checksum in metadata, skipping MD5 verification"
    else
        log_info "Calculating MD5 checksum..."
        local ACTUAL_MD5=$(md5sum "$BACKUP_FILE" | awk '{print $1}')
        
        if [[ "$ACTUAL_MD5" == "$EXPECTED_MD5" ]]; then
            log_success "MD5 checksum verified: $ACTUAL_MD5"
        else
            log_error "MD5 checksum mismatch!"
            log_error "Expected: $EXPECTED_MD5"
            log_error "Actual: $ACTUAL_MD5"
            exit 1
        fi
    fi
    
    if [[ -z "$EXPECTED_SHA256" || "$EXPECTED_SHA256" == "null" ]]; then
        log_warning "No SHA256 checksum in metadata, skipping SHA256 verification"
    else
        log_info "Calculating SHA256 checksum..."
        local ACTUAL_SHA256=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
        
        if [[ "$ACTUAL_SHA256" == "$EXPECTED_SHA256" ]]; then
            log_success "SHA256 checksum verified: $ACTUAL_SHA256"
        else
            log_error "SHA256 checksum mismatch!"
            log_error "Expected: $EXPECTED_SHA256"
            log_error "Actual: $ACTUAL_SHA256"
            exit 1
        fi
    fi
}

# Verify archive structure
verify_archive_structure() {
    log_info "Verifying archive structure..."
    
    local WORKING_FILE="$BACKUP_FILE"
    
    # Decrypt if needed
    if [[ "$DECRYPT_BACKUP" == true ]]; then
        log_info "Decrypting backup for structure verification..."
        local DECRYPTED_FILE="$TEMP_DIR/$(basename "${BACKUP_FILE%.enc}")"
        
        openssl enc -aes-256-cbc -d -pbkdf2 \
            -in "$BACKUP_FILE" \
            -out "$DECRYPTED_FILE" \
            -pass pass:"$ENCRYPTION_KEY"
        
        if [[ ! -f "$DECRYPTED_FILE" ]]; then
            log_error "Decryption failed"
            exit 1
        fi
        
        WORKING_FILE="$DECRYPTED_FILE"
    fi
    
    # Test archive integrity
    log_info "Testing archive integrity..."
    if ! tar -tzf "$WORKING_FILE" > /dev/null 2>&1; then
        log_error "Archive is corrupted or invalid"
        exit 1
    fi
    
    # List contents
    log_info "Archive contents:"
    tar -tzf "$WORKING_FILE" | head -10
    local TOTAL_FILES=$(tar -tzf "$WORKING_FILE" | wc -l)
    log_info "Total files in archive: $TOTAL_FILES"
    
    # Check for BSON files
    local BSON_COUNT=$(tar -tzf "$WORKING_FILE" | grep -c "\.bson" || echo "0")
    if [[ $BSON_COUNT -eq 0 ]]; then
        log_error "No BSON files found in backup"
        exit 1
    fi
    
    log_success "Archive structure verified: $BSON_COUNT BSON files found"
}

# Perform test restore
perform_test_restore() {
    if [[ "$TEST_RESTORE" != true ]]; then
        return
    fi
    
    log_info "Performing test restore..."
    
    local WORKING_FILE="$BACKUP_FILE"
    
    # Decrypt if needed
    if [[ "$DECRYPT_BACKUP" == true ]]; then
        log_info "Decrypting backup for test restore..."
        local DECRYPTED_FILE="$TEMP_DIR/$(basename "${BACKUP_FILE%.enc}")"
        
        if [[ ! -f "$DECRYPTED_FILE" ]]; then
            openssl enc -aes-256-cbc -d -pbkdf2 \
                -in "$BACKUP_FILE" \
                -out "$DECRYPTED_FILE" \
                -pass pass:"$ENCRYPTION_KEY"
        fi
        
        WORKING_FILE="$DECRYPTED_FILE"
    fi
    
    # Extract archive
    log_info "Extracting backup archive..."
    tar -xzf "$WORKING_FILE" -C "$TEMP_DIR"
    
    # Find extracted directory
    local BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "gnb-transfer-backup-*" | head -1)
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "Failed to extract backup directory"
        exit 1
    fi
    
    # Create test database name
    local TEST_DB="gnb_test_restore_$$"
    local TEST_URI="${MONGO_URI%%/*}/${TEST_DB}"
    
    log_info "Restoring to test database: $TEST_DB"
    
    # Perform restore
    mongorestore --uri="$TEST_URI" --gzip "$BACKUP_DIR" 2>&1 | tee "$TEMP_DIR/restore.log"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Test restore completed successfully"
        
        # Clean up test database
        log_info "Cleaning up test database..."
        if command -v mongosh &> /dev/null; then
            mongosh "$TEST_URI" --quiet --eval "db.dropDatabase()" > /dev/null 2>&1 || true
        elif command -v mongo &> /dev/null; then
            mongo "$TEST_URI" --quiet --eval "db.dropDatabase()" > /dev/null 2>&1 || true
        fi
    else
        log_error "Test restore failed"
        exit 1
    fi
}

# Display metadata
display_metadata() {
    if [[ ! -f "$METADATA_FILE" ]]; then
        return
    fi
    
    log_info "Backup Metadata:"
    echo ""
    
    if command -v jq &> /dev/null; then
        jq '.' "$METADATA_FILE"
    else
        cat "$METADATA_FILE"
    fi
}

# Generate verification report
generate_report() {
    echo ""
    log_info "=== Verification Report ==="
    echo ""
    log_info "Backup File: $BACKUP_FILE"
    log_info "Metadata File: $METADATA_FILE"
    log_info "Decryption: $DECRYPT_BACKUP"
    log_info "Test Restore: $TEST_RESTORE"
    echo ""
    
    display_metadata
    
    echo ""
    log_success "=== All verification checks passed ==="
}

# Main execution
main() {
    log_info "=== GNB Transfer Backup Verification ==="
    echo ""
    
    validate_requirements
    create_temp_dir
    verify_file_access
    verify_checksum
    verify_archive_structure
    perform_test_restore
    generate_report
}

# Parse arguments and run
parse_args "$@"
main
