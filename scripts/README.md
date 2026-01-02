# GNB Transfer - Backup & Recovery Scripts

This directory contains scripts for database backup, restoration, and verification.

## Scripts Overview

### 1. backup-database.sh

Creates full or incremental backups of the MongoDB database with encryption and metadata.

**Usage:**
```bash
./scripts/backup-database.sh [OPTIONS]

Options:
  --type full|incremental    Backup type (default: full)
  --output-dir DIR           Output directory (default: ./backups)
  --encrypt                  Encrypt backup files
  --retention-days DAYS      Delete backups older than DAYS (default: 30)
  --mongo-uri URI            MongoDB connection string
  --help                     Show help message
```

**Examples:**
```bash
# Full encrypted backup
./scripts/backup-database.sh --type full --encrypt

# Incremental backup with custom retention
./scripts/backup-database.sh --type incremental --retention-days 7

# Full backup to custom directory
./scripts/backup-database.sh --type full --output-dir /mnt/backups --encrypt
```

**Environment Variables:**
- `MONGO_URI` - MongoDB connection string (required)
- `BACKUP_ENCRYPTION_KEY` - AES-256 encryption key (required if --encrypt)

### 2. restore-database.sh

Restores MongoDB database from backup files with optional point-in-time recovery.

**Usage:**
```bash
./scripts/restore-database.sh [OPTIONS]

Options:
  --backup-file FILE         Path to backup file (required)
  --mongo-uri URI            MongoDB connection string for restore
  --decrypt                  Decrypt backup before restore
  --dry-run                  Test restore without applying changes
  --validate                 Validate database after restore
  --point-in-time TIMESTAMP  Restore to specific timestamp (for oplog)
  --drop                     Drop existing collections before restore
  --help                     Show help message
```

**Examples:**
```bash
# Restore from encrypted backup with validation
./scripts/restore-database.sh \
  --backup-file backups/gnb-transfer-backup-20260102_030000.tar.gz.enc \
  --decrypt \
  --validate

# Dry-run to test restore without changes
./scripts/restore-database.sh \
  --backup-file backups/latest.tar.gz \
  --dry-run

# Point-in-time recovery
./scripts/restore-database.sh \
  --backup-file backups/backup.tar.gz \
  --point-in-time "20260102_120000" \
  --drop \
  --validate
```

**Environment Variables:**
- `MONGO_URI` - MongoDB connection string (required)
- `BACKUP_ENCRYPTION_KEY` - Decryption key (required if --decrypt)

### 3. verify-backup.sh

Verifies backup integrity through checksum validation and optional test restore.

**Usage:**
```bash
./scripts/verify-backup.sh [OPTIONS]

Options:
  --backup-file FILE         Path to backup file (required)
  --metadata-file FILE       Path to metadata file (auto-detected if not provided)
  --decrypt                  Decrypt backup before verification
  --test-restore             Perform test restore to verify backup
  --mongo-uri URI            Test MongoDB URI for restore test
  --help                     Show help message
```

**Examples:**
```bash
# Verify encrypted backup integrity
./scripts/verify-backup.sh \
  --backup-file backups/gnb-transfer-backup-20260102_030000.tar.gz.enc \
  --decrypt

# Verify with test restore
./scripts/verify-backup.sh \
  --backup-file backups/latest.tar.gz \
  --test-restore \
  --mongo-uri "mongodb://localhost:27017/test"
```

**Environment Variables:**
- `BACKUP_ENCRYPTION_KEY` - Decryption key (required if --decrypt)
- `TEST_MONGO_URI` - Test MongoDB URI (required if --test-restore)

## Quick Start

### Prerequisites

1. **Install MongoDB Database Tools:**
   ```bash
   # Ubuntu/Debian
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-database-tools
   
   # macOS
   brew tap mongodb/brew
   brew install mongodb-database-tools
   ```

2. **Set Environment Variables:**
   ```bash
   export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/database"
   export BACKUP_ENCRYPTION_KEY="$(openssl rand -base64 32)"
   ```

### Creating Your First Backup

```bash
# 1. Create backup directory
mkdir -p backups

# 2. Run full backup
./scripts/backup-database.sh --type full --encrypt

# 3. Verify the backup
ls -lh backups/
```

### Restoring from Backup

```bash
# 1. List available backups
ls -lt backups/*.tar.gz*

# 2. Verify backup before restore
./scripts/verify-backup.sh \
  --backup-file backups/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
  --decrypt

# 3. Perform restore (use --dry-run first to test)
./scripts/restore-database.sh \
  --backup-file backups/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
  --decrypt \
  --dry-run

# 4. Actual restore (removes --dry-run)
./scripts/restore-database.sh \
  --backup-file backups/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
  --decrypt \
  --drop \
  --validate
```

## Backup Metadata

Each backup includes a JSON metadata file with the following information:

```json
{
  "backup_name": "gnb-transfer-backup-20260102_030000",
  "backup_type": "full",
  "timestamp": "20260102_030000",
  "date_iso": "2026-01-02T03:00:00Z",
  "encrypted": true,
  "file_size": 1048576,
  "file_size_human": "1.0M",
  "md5_checksum": "d41d8cd98f00b204e9800998ecf8427e",
  "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "duration_seconds": 45,
  "mongo_version": "mongodump version: 100.7.4",
  "hostname": "backup-server",
  "retention_days": 30
}
```

## Automated Backups (GitHub Actions)

The repository includes automated workflows for backups:

### Daily Full Backups
- **Schedule**: Daily at 3:00 AM UTC
- **Retention**: 30 days
- **Location**: S3, GCS, GitHub Artifacts

### Hourly Incremental Backups
- **Schedule**: Every hour
- **Retention**: 7 days
- **Location**: S3, GCS, GitHub Artifacts

### Pre-Deployment Backups
- **Trigger**: Before production deployments
- **Retention**: 90 days
- **Location**: S3, GCS

### Weekly Restore Tests
- **Schedule**: Every Sunday at 4:00 AM UTC
- **Purpose**: Validate backup integrity
- **Notifications**: Slack/Discord on failure

## Troubleshooting

### Error: "mongodump not found"

**Solution**: Install MongoDB Database Tools (see Prerequisites)

### Error: "MONGO_URI environment variable is not set"

**Solution**: 
```bash
export MONGO_URI="your_mongodb_connection_string"
```

### Error: "Decryption enabled but BACKUP_ENCRYPTION_KEY is not set"

**Solution**:
```bash
export BACKUP_ENCRYPTION_KEY="your_encryption_key"
```

### Error: "Backup file is corrupted"

**Solution**: Try downloading from alternative storage (S3 or GCS) and verify checksums

### Error: "Permission denied"

**Solution**: Make scripts executable:
```bash
chmod +x scripts/*.sh
```

## Security Best Practices

1. **Never commit encryption keys** to version control
2. **Use strong encryption keys**: Generate with `openssl rand -base64 32`
3. **Rotate keys quarterly** and re-encrypt backups
4. **Store backups in multiple locations** (3-2-1 rule)
5. **Test restore procedures monthly** to ensure reliability
6. **Limit access to backups** to authorized personnel only
7. **Monitor backup success/failure** with alerts
8. **Encrypt backups at rest and in transit**

## Backup Storage Locations

### Local Storage
- **Path**: `./backups`
- **Purpose**: Temporary storage before cloud upload
- **Auto-cleanup**: Based on retention policy

### AWS S3
- **Bucket**: `${S3_BACKUP_BUCKET}`
- **Regions**: us-east-1 (configurable)
- **Storage Class**: Standard-IA
- **Lifecycle**: Auto-delete based on retention

### Google Cloud Storage
- **Bucket**: `${GCS_BACKUP_BUCKET}`
- **Regions**: Multi-regional
- **Storage Class**: Nearline
- **Lifecycle**: Auto-delete based on retention

### GitHub Artifacts
- **Retention**: 7 days (default)
- **Purpose**: Short-term recovery
- **Access**: Via GitHub Actions UI

## Retention Policies

| Backup Type | Retention | Location |
|-------------|-----------|----------|
| Daily Full | 30 days | S3, GCS |
| Hourly Incremental | 7 days | S3, GCS |
| Pre-Deployment | 90 days | S3, GCS |
| GitHub Artifacts | 7 days | GitHub |

## Performance Considerations

### Backup Performance

- **Full backup**: ~2-5 minutes for typical database size
- **Incremental backup**: ~30-60 seconds
- **Network transfer**: Depends on bandwidth and file size
- **Compression**: ~70-80% size reduction with gzip

### Restore Performance

- **Full restore**: ~3-7 minutes
- **Point-in-time recovery**: ~5-10 minutes
- **Validation**: +1-2 minutes

### Optimization Tips

1. **Schedule backups during low-traffic periods**
2. **Use incremental backups for frequent snapshots**
3. **Enable compression** to reduce storage and transfer time
4. **Monitor backup duration** and optimize if needed
5. **Use parallel uploads** to cloud storage when possible

## Monitoring and Alerts

### Metrics Monitored

- Last successful backup timestamp
- Backup file size
- Backup duration
- Success/failure rate
- Storage usage

### Alert Channels

- **Slack**: Configured via `SLACK_WEBHOOK_URL`
- **Discord**: Configured via `DISCORD_WEBHOOK_URL`
- **Email**: Via monitoring system

### Alert Conditions

- ⚠️ Backup failure (immediate)
- ⚠️ No backup in last 25 hours
- ⚠️ Backup size anomaly (>50% deviation)
- ⚠️ Weekly restore test failure

## Additional Resources

- **Disaster Recovery Plan**: See `docs/DISASTER_RECOVERY.md`
- **MongoDB Backup Documentation**: https://www.mongodb.com/docs/manual/core/backups/
- **AWS S3 Documentation**: https://docs.aws.amazon.com/s3/
- **Google Cloud Storage Documentation**: https://cloud.google.com/storage/docs

## Support

For issues or questions:
1. Check `docs/DISASTER_RECOVERY.md` for detailed procedures
2. Review GitHub Actions logs for workflow failures
3. Contact DevOps team (see DISASTER_RECOVERY.md for contacts)

## License

These scripts are part of the GNB Transfer project and follow the same license.
