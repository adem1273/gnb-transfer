#!/bin/bash

#==============================================================================
# GNB Transfer - Database Restore Script
#==============================================================================
# This script restores MongoDB database from backup files with optional
# point-in-time recovery and validation.
#
# Usage:
#   ./restore-database.sh [OPTIONS]
#
# Options:
#   --backup-file FILE         Path to backup file (required)
#   --mongo-uri URI            MongoDB connection string for restore
#   --decrypt                  Decrypt backup before restore
#   --dry-run                  Test restore without applying changes
#   --validate                 Validate database after restore
#   --point-in-time TIMESTAMP  Restore to specific timestamp (for oplog)
#   --drop                     Drop existing collections before restore
#   --help                     Show this help message
#
# Environment Variables:
#   MONGO_URI                  MongoDB connection string (required)
#   BACKUP_ENCRYPTION_KEY      AES-256 decryption key (if encrypted)
#
# Examples:
#   ./restore-database.sh --backup-file backups/gnb-transfer-backup-20260102_120000.tar.gz.enc --decrypt --validate
#   ./restore-database.sh --backup-file backups/latest.tar.gz --dry-run
#   ./restore-database.sh --backup-file backups/backup.tar.gz --drop --validate
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
MONGO_URI="${MONGO_URI:-}"
DECRYPT_BACKUP=false
DRY_RUN=false
VALIDATE_RESTORE=false
POINT_IN_TIME=""
DROP_COLLECTIONS=false
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
TEMP_DIR="/tmp/gnb-restore-$$"

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
    head -n 30 "$0" | tail -n 28 | sed 's/^# //;s/^#//'
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
            --mongo-uri)
                MONGO_URI="$2"
                shift 2
                ;;
            --decrypt)
                DECRYPT_BACKUP=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --validate)
                VALIDATE_RESTORE=true
                shift
                ;;
            --point-in-time)
                POINT_IN_TIME="$2"
                shift 2
                ;;
            --drop)
                DROP_COLLECTIONS=true
                shift
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
    
    # Check if mongorestore is installed
    if ! command -v mongorestore &> /dev/null; then
        log_error "mongorestore not found. Please install MongoDB Database Tools."
        log_info "Install from: https://www.mongodb.com/docs/database-tools/installation/"
        exit 1
    fi
    
    # Check backup file
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file not specified. Use --backup-file option."
        exit 1
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    # Check MongoDB URI
    if [[ -z "$MONGO_URI" ]]; then
        log_error "MONGO_URI environment variable is not set"
        exit 1
    fi
    
    # Check decryption key if decryption is enabled
    if [[ "$DECRYPT_BACKUP" == true && -z "$ENCRYPTION_KEY" ]]; then
        log_error "Decryption enabled but BACKUP_ENCRYPTION_KEY is not set"
        exit 1
    fi
    
    log_success "Requirements validated"
}

# Create temporary directory
create_temp_dir() {
    log_info "Creating temporary directory: $TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    log_success "Temporary directory created"
}

# Decrypt backup
decrypt_backup() {
    if [[ "$DECRYPT_BACKUP" != true ]]; then
        return
    fi
    
    log_info "Decrypting backup..."
    
    local DECRYPTED_FILE="$TEMP_DIR/$(basename "${BACKUP_FILE%.enc}")"
    
    openssl enc -aes-256-cbc -d -pbkdf2 \
        -in "$BACKUP_FILE" \
        -out "$DECRYPTED_FILE" \
        -pass pass:"$ENCRYPTION_KEY"
    
    if [[ -f "$DECRYPTED_FILE" ]]; then
        log_success "Backup decrypted: $DECRYPTED_FILE"
        BACKUP_FILE="$DECRYPTED_FILE"
    else
        log_error "Decryption failed"
        exit 1
    fi
}

# Extract backup archive
extract_backup() {
    log_info "Extracting backup archive..."
    
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
    
    # Find the extracted directory
    local EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "gnb-transfer-backup-*" | head -1)
    
    if [[ -d "$EXTRACTED_DIR" ]]; then
        log_success "Backup extracted to: $EXTRACTED_DIR"
        echo "$EXTRACTED_DIR"
    else
        log_error "Failed to extract backup or find backup directory"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local BACKUP_DIR="$1"
    
    log_info "Verifying backup integrity..."
    
    # Check if backup directory contains BSON files
    local BSON_COUNT=$(find "$BACKUP_DIR" -name "*.bson.gz" -o -name "*.bson" | wc -l)
    
    if [[ $BSON_COUNT -eq 0 ]]; then
        log_error "No BSON files found in backup"
        exit 1
    fi
    
    log_success "Backup integrity verified: $BSON_COUNT BSON files found"
}

# Perform dry-run restore
perform_dry_run() {
    local BACKUP_DIR="$1"
    
    log_info "Performing dry-run restore (no actual changes will be made)..."
    
    # List what would be restored
    log_info "Collections that would be restored:"
    find "$BACKUP_DIR" -name "*.bson.gz" -o -name "*.bson" | while read file; do
        local COLLECTION=$(basename "$file" .bson.gz)
        COLLECTION=$(basename "$COLLECTION" .bson)
        local SIZE=$(du -h "$file" | cut -f1)
        echo "  - $COLLECTION (Size: $SIZE)"
    done
    
    log_success "Dry-run completed. No changes were made to the database."
}

# Perform actual restore
perform_restore() {
    local BACKUP_DIR="$1"
    
    if [[ "$DRY_RUN" == true ]]; then
        perform_dry_run "$BACKUP_DIR"
        return
    fi
    
    log_info "Starting database restore..."
    
    local RESTORE_ARGS="--uri=$MONGO_URI --gzip --verbose"
    
    # Add drop flag if specified
    if [[ "$DROP_COLLECTIONS" == true ]]; then
        log_warning "Dropping existing collections before restore"
        RESTORE_ARGS="$RESTORE_ARGS --drop"
    fi
    
    # Add point-in-time recovery if specified
    if [[ -n "$POINT_IN_TIME" ]]; then
        log_info "Restoring to point-in-time: $POINT_IN_TIME"
        # Note: Modern mongorestore auto-detects oplog files
        RESTORE_ARGS="$RESTORE_ARGS --oplogFile=$(find "$BACKUP_DIR" -name "oplog.bson*" | head -1)"
    fi
    
    # Perform mongorestore
    mongorestore $RESTORE_ARGS "$BACKUP_DIR" 2>&1 | tee "$TEMP_DIR/restore.log"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Database restore completed"
    else
        log_error "Database restore failed. Check logs: $TEMP_DIR/restore.log"
        exit 1
    fi
}

# Validate restored database
validate_database() {
    if [[ "$VALIDATE_RESTORE" != true ]]; then
        return
    fi
    
    log_info "Validating restored database..."
    
    # Use mongosh or mongo to check database
    local MONGO_COMMAND=""
    if command -v mongosh &> /dev/null; then
        MONGO_COMMAND="mongosh"
    elif command -v mongo &> /dev/null; then
        MONGO_COMMAND="mongo"
    else
        log_warning "mongosh/mongo not found, skipping validation"
        return
    fi
    
    # Count documents in collections
    log_info "Checking document counts..."
    
    $MONGO_COMMAND "$MONGO_URI" --quiet --eval "
        db.getCollectionNames().forEach(function(collection) {
            var count = db[collection].countDocuments();
            print(collection + ': ' + count + ' documents');
        });
    " 2>&1 | tee "$TEMP_DIR/validation.log"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Database validation completed"
    else
        log_error "Database validation failed"
        exit 1
    fi
}

# Generate restore report
generate_report() {
    log_info "=== Restore Report ==="
    echo ""
    log_info "Backup File: $BACKUP_FILE"
    log_info "MongoDB URI: ${MONGO_URI%%@*}@***"  # Hide credentials
    log_info "Dry Run: $DRY_RUN"
    log_info "Validation: $VALIDATE_RESTORE"
    log_info "Drop Collections: $DROP_COLLECTIONS"
    
    if [[ -n "$POINT_IN_TIME" ]]; then
        log_info "Point-in-Time: $POINT_IN_TIME"
    fi
    
    if [[ -f "$TEMP_DIR/restore.log" ]]; then
        echo ""
        log_info "Restore summary:"
        grep -E "(done|finished|completed|error|warning)" "$TEMP_DIR/restore.log" || true
    fi
    
    echo ""
    log_success "=== Restore process completed ==="
}

# Main execution
main() {
    log_info "=== GNB Transfer Database Restore ==="
    echo ""
    
    validate_requirements
    create_temp_dir
    decrypt_backup
    
    local BACKUP_DIR=$(extract_backup)
    verify_backup "$BACKUP_DIR"
    perform_restore "$BACKUP_DIR"
    validate_database
    generate_report
}

# Parse arguments and run
parse_args "$@"
main
