#!/bin/bash

#==============================================================================
# GNB Transfer - Database Backup Script
#==============================================================================
# This script performs full or incremental backups of MongoDB database
# with encryption, compression, and metadata generation.
#
# Usage:
#   ./backup-database.sh [OPTIONS]
#
# Options:
#   --type full|incremental    Backup type (default: full)
#   --output-dir DIR           Output directory (default: ./backups)
#   --encrypt                  Encrypt backup files
#   --retention-days DAYS      Delete backups older than DAYS (default: 30)
#   --mongo-uri URI            MongoDB connection string
#   --help                     Show this help message
#
# Environment Variables:
#   MONGO_URI                  MongoDB connection string (required)
#   BACKUP_ENCRYPTION_KEY      AES-256 encryption key (optional)
#   S3_BACKUP_BUCKET          AWS S3 bucket for backups (optional)
#   GCS_BACKUP_BUCKET         Google Cloud Storage bucket (optional)
#
# Examples:
#   ./backup-database.sh --type full --encrypt
#   ./backup-database.sh --type incremental --output-dir /backups
#==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKUP_TYPE="full"
OUTPUT_DIR="./backups"
ENCRYPT_BACKUP=false
RETENTION_DAYS=30
MONGO_URI="${MONGO_URI:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Metadata
SCRIPT_START_TIME=$(date +%s)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="gnb-transfer-backup-${TIMESTAMP}"

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

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --encrypt)
                ENCRYPT_BACKUP=true
                shift
                ;;
            --retention-days)
                RETENTION_DAYS="$2"
                shift 2
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
    
    # Check if mongodump is installed
    if ! command -v mongodump &> /dev/null; then
        log_error "mongodump not found. Please install MongoDB Database Tools."
        log_info "Install from: https://www.mongodb.com/docs/database-tools/installation/"
        exit 1
    fi
    
    # Check MongoDB URI
    if [[ -z "$MONGO_URI" ]]; then
        log_error "MONGO_URI environment variable is not set"
        exit 1
    fi
    
    # Validate backup type
    if [[ "$BACKUP_TYPE" != "full" && "$BACKUP_TYPE" != "incremental" ]]; then
        log_error "Invalid backup type: $BACKUP_TYPE (must be 'full' or 'incremental')"
        exit 1
    fi
    
    # Check encryption key if encryption is enabled
    if [[ "$ENCRYPT_BACKUP" == true && -z "$ENCRYPTION_KEY" ]]; then
        log_error "Encryption enabled but BACKUP_ENCRYPTION_KEY is not set"
        exit 1
    fi
    
    log_success "Requirements validated"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
    log_success "Backup directory created"
}

# Perform full backup
perform_full_backup() {
    log_info "Starting full backup..."
    
    local BACKUP_PATH="$OUTPUT_DIR/$BACKUP_NAME"
    
    # Perform mongodump
    mongodump \
        --uri="$MONGO_URI" \
        --out="$BACKUP_PATH" \
        --gzip \
        --verbose \
        2>&1 | tee "$OUTPUT_DIR/${BACKUP_NAME}_dump.log"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Full backup completed: $BACKUP_PATH"
    else
        log_error "Full backup failed"
        exit 1
    fi
}

# Perform incremental backup (oplog-based)
perform_incremental_backup() {
    log_info "Starting incremental backup..."
    
    local BACKUP_PATH="$OUTPUT_DIR/$BACKUP_NAME"
    local LAST_BACKUP_TIME=""
    
    # Find the last successful backup timestamp
    if [[ -f "$OUTPUT_DIR/.last_backup_timestamp" ]]; then
        LAST_BACKUP_TIME=$(cat "$OUTPUT_DIR/.last_backup_timestamp")
        log_info "Last backup timestamp: $LAST_BACKUP_TIME"
    else
        log_warning "No previous backup found, performing full backup instead"
        perform_full_backup
        return
    fi
    
    # Perform oplog dump for incremental backup
    mongodump \
        --uri="$MONGO_URI" \
        --out="$BACKUP_PATH" \
        --oplog \
        --gzip \
        --verbose \
        2>&1 | tee "$OUTPUT_DIR/${BACKUP_NAME}_dump.log"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Incremental backup completed: $BACKUP_PATH"
    else
        log_error "Incremental backup failed"
        exit 1
    fi
}

# Create backup archive
create_archive() {
    log_info "Creating compressed archive..."
    
    local BACKUP_PATH="$OUTPUT_DIR/$BACKUP_NAME"
    local ARCHIVE_PATH="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz"
    
    tar -czf "$ARCHIVE_PATH" -C "$OUTPUT_DIR" "$BACKUP_NAME"
    
    if [[ -f "$ARCHIVE_PATH" ]]; then
        local SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
        log_success "Archive created: $ARCHIVE_PATH (Size: $SIZE)"
        
        # Remove uncompressed directory
        rm -rf "$BACKUP_PATH"
    else
        log_error "Failed to create archive"
        exit 1
    fi
}

# Encrypt backup
encrypt_backup() {
    if [[ "$ENCRYPT_BACKUP" != true ]]; then
        return
    fi
    
    log_info "Encrypting backup..."
    
    local ARCHIVE_PATH="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz"
    local ENCRYPTED_PATH="${ARCHIVE_PATH}.enc"
    
    openssl enc -aes-256-cbc -salt -pbkdf2 \
        -in "$ARCHIVE_PATH" \
        -out "$ENCRYPTED_PATH" \
        -pass pass:"$ENCRYPTION_KEY"
    
    if [[ -f "$ENCRYPTED_PATH" ]]; then
        log_success "Backup encrypted: $ENCRYPTED_PATH"
        
        # Remove unencrypted archive
        rm -f "$ARCHIVE_PATH"
    else
        log_error "Encryption failed"
        exit 1
    fi
}

# Generate metadata
generate_metadata() {
    log_info "Generating backup metadata..."
    
    local BACKUP_FILE=""
    if [[ "$ENCRYPT_BACKUP" == true ]]; then
        BACKUP_FILE="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz.enc"
    else
        BACKUP_FILE="$OUTPUT_DIR/${BACKUP_NAME}.tar.gz"
    fi
    
    local METADATA_FILE="$OUTPUT_DIR/${BACKUP_NAME}.metadata.json"
    
    # Calculate checksums
    local MD5_CHECKSUM=$(md5sum "$BACKUP_FILE" | awk '{print $1}')
    local SHA256_CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
    
    # Get file size
    local FILE_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
    local FILE_SIZE_HUMAN=$(du -h "$BACKUP_FILE" | cut -f1)
    
    # Calculate duration
    local SCRIPT_END_TIME=$(date +%s)
    local DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))
    
    # Create metadata JSON
    cat > "$METADATA_FILE" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "backup_type": "$BACKUP_TYPE",
  "timestamp": "$TIMESTAMP",
  "date_iso": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "encrypted": $ENCRYPT_BACKUP,
  "file_size": $FILE_SIZE,
  "file_size_human": "$FILE_SIZE_HUMAN",
  "md5_checksum": "$MD5_CHECKSUM",
  "sha256_checksum": "$SHA256_CHECKSUM",
  "duration_seconds": $DURATION,
  "mongo_version": "$(mongodump --version 2>&1 | head -1 || echo 'unknown')",
  "hostname": "$(hostname)",
  "retention_days": $RETENTION_DAYS
}
EOF
    
    log_success "Metadata generated: $METADATA_FILE"
    cat "$METADATA_FILE"
}

# Update last backup timestamp
update_timestamp() {
    echo "$TIMESTAMP" > "$OUTPUT_DIR/.last_backup_timestamp"
    log_info "Updated last backup timestamp"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d)
    local DELETED_COUNT=0
    
    # Cleanup old backups
    for file in "$OUTPUT_DIR"/gnb-transfer-backup-*.tar.gz* "$OUTPUT_DIR"/gnb-transfer-backup-*.metadata.json; do
        if [[ -f "$file" ]]; then
            # Extract date from filename
            local FILE_DATE=$(echo "$file" | grep -oE 'gnb-transfer-backup-[0-9]{8}' | sed 's/.*-//' || echo "99999999")
            
            if [[ "$FILE_DATE" -lt "$CUTOFF_DATE" ]]; then
                log_info "Deleting old backup: $file"
                rm -f "$file"
                ((DELETED_COUNT++))
            fi
        fi
    done
    
    log_success "Cleanup completed. Deleted $DELETED_COUNT old backup files"
}

# Main execution
main() {
    log_info "=== GNB Transfer Database Backup ==="
    log_info "Backup Type: $BACKUP_TYPE"
    log_info "Output Directory: $OUTPUT_DIR"
    log_info "Encryption: $ENCRYPT_BACKUP"
    log_info "Retention: $RETENTION_DAYS days"
    echo ""
    
    validate_requirements
    create_backup_dir
    
    if [[ "$BACKUP_TYPE" == "full" ]]; then
        perform_full_backup
    else
        perform_incremental_backup
    fi
    
    create_archive
    encrypt_backup
    generate_metadata
    update_timestamp
    cleanup_old_backups
    
    log_success "=== Backup completed successfully ==="
    log_info "Backup file: $OUTPUT_DIR/${BACKUP_NAME}.tar.gz$([ "$ENCRYPT_BACKUP" == true ] && echo ".enc")"
}

# Parse arguments and run
parse_args "$@"
main
