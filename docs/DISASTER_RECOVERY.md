# GNB Transfer - Disaster Recovery Plan

## Overview

This document provides comprehensive disaster recovery procedures for the GNB Transfer application, ensuring business continuity in the event of data loss, system failures, or other catastrophic events.

## Recovery Objectives

### RTO (Recovery Time Objective)
**Target: < 15 minutes**

The maximum acceptable time to restore service after a disaster occurs.

### RPO (Recovery Point Objective)
**Target: < 1 hour**

The maximum acceptable data loss measured in time. With our hourly incremental backups, we can restore to within 1 hour of the incident.

## Backup Strategy

### 3-2-1 Backup Rule

We follow the industry-standard 3-2-1 backup strategy:
- **3 copies** of data (production + 2 backups)
- **2 different storage media** (local/cloud storage + different cloud provider)
- **1 copy offsite** (cloud storage)

### Backup Types

#### 1. Full Backups
- **Frequency**: Daily at 3:00 AM UTC
- **Retention**: 30 days
- **Location**: 
  - GitHub Artifacts (7 days)
  - AWS S3 (30 days)
  - Google Cloud Storage (30 days)
- **Storage Class**: S3 Standard-IA, GCS Nearline
- **Encryption**: AES-256-CBC with PBKDF2

#### 2. Incremental Backups (Oplog-based)
- **Frequency**: Hourly
- **Retention**: 7 days
- **Location**: 
  - GitHub Artifacts (7 days)
  - AWS S3 (7 days)
  - Google Cloud Storage (7 days)
- **Purpose**: Point-in-time recovery for recent changes

#### 3. Pre-Deployment Backups
- **Frequency**: Before each production deployment
- **Retention**: 90 days
- **Location**: S3 and GCS with extended retention
- **Purpose**: Rollback capability for deployments

## Backup Locations

### Primary Storage

1. **AWS S3**
   - Bucket: `${S3_BACKUP_BUCKET}`
   - Region: Configurable (default: us-east-1)
   - Path structure:
     ```
     s3://bucket/mongodb/
     ├── daily/           # Full daily backups (30 days)
     ├── hourly/          # Incremental backups (7 days)
     └── pre-deployment/  # Pre-deployment backups (90 days)
     ```

2. **Google Cloud Storage**
   - Bucket: `${GCS_BACKUP_BUCKET}`
   - Region: Multi-regional
   - Path structure: Same as S3

3. **GitHub Artifacts**
   - Retention: 7 days
   - Purpose: Short-term recovery and testing

## Recovery Procedures

### Prerequisites

Before starting recovery, ensure you have:

1. ✅ MongoDB connection string for the target database
2. ✅ Backup encryption key (`BACKUP_ENCRYPTION_KEY`)
3. ✅ AWS credentials (if restoring from S3)
4. ✅ GCP credentials (if restoring from GCS)
5. ✅ MongoDB Database Tools installed (`mongorestore`, `mongodump`)

### Scenario 1: Complete Database Loss

**Recovery Steps:**

1. **Identify the most recent backup**
   ```bash
   # From S3
   aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/daily/ --recursive | sort | tail -5
   
   # From GCS
   gsutil ls -l gs://${GCS_BACKUP_BUCKET}/mongodb/daily/ | sort | tail -5
   ```

2. **Download the backup**
   ```bash
   # From S3
   aws s3 cp s3://${S3_BACKUP_BUCKET}/mongodb/daily/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc .
   
   # From GCS
   gsutil cp gs://${GCS_BACKUP_BUCKET}/mongodb/daily/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc .
   ```

3. **Verify backup integrity**
   ```bash
   cd /path/to/gnb-transfer
   ./scripts/verify-backup.sh \
     --backup-file gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
     --decrypt
   ```

4. **Restore the database**
   ```bash
   ./scripts/restore-database.sh \
     --backup-file gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
     --decrypt \
     --drop \
     --validate
   ```

5. **Verify data integrity**
   ```bash
   # Connect to MongoDB and verify collections
   mongosh "$MONGO_URI" --eval "
     db.getCollectionNames().forEach(function(col) {
       print(col + ': ' + db[col].countDocuments());
     });
   "
   ```

6. **Restart application services**
   ```bash
   # Restart backend
   pm2 restart gnb-backend
   
   # Or restart Docker containers
   docker-compose restart
   ```

**Expected Recovery Time**: 10-15 minutes

### Scenario 2: Point-in-Time Recovery

**Use Case**: Recover to a specific point in time (e.g., before an accidental data deletion)

**Recovery Steps:**

1. **Identify the backup closest to the desired recovery point**
   ```bash
   # List available backups
   aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/hourly/ | grep YYYYMMDD
   ```

2. **Download full backup and incremental backups**
   ```bash
   # Download the last full backup before the incident
   aws s3 cp s3://${S3_BACKUP_BUCKET}/mongodb/daily/gnb-transfer-backup-YYYYMMDD_030000.tar.gz.enc .
   
   # Download incremental backups up to the recovery point
   aws s3 cp s3://${S3_BACKUP_BUCKET}/mongodb/hourly/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc .
   ```

3. **Restore with point-in-time option**
   ```bash
   # First restore the full backup
   ./scripts/restore-database.sh \
     --backup-file gnb-transfer-backup-YYYYMMDD_030000.tar.gz.enc \
     --decrypt \
     --drop
   
   # Then apply incremental changes
   ./scripts/restore-database.sh \
     --backup-file gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
     --decrypt \
     --point-in-time "YYYYMMDD_HHMMSS" \
     --validate
   ```

**Expected Recovery Time**: 15-20 minutes

### Scenario 3: Partial Data Recovery

**Use Case**: Recover specific collections or documents

**Recovery Steps:**

1. **Download and extract backup**
   ```bash
   aws s3 cp s3://${S3_BACKUP_BUCKET}/mongodb/daily/latest.tar.gz.enc .
   
   openssl enc -aes-256-cbc -d -pbkdf2 \
     -in latest.tar.gz.enc \
     -out latest.tar.gz \
     -pass pass:"$BACKUP_ENCRYPTION_KEY"
   
   tar -xzf latest.tar.gz
   ```

2. **Restore specific collections**
   ```bash
   # Restore only specific collections
   mongorestore \
     --uri="$MONGO_URI" \
     --nsInclude="gnb.*" \
     --drop \
     gnb-transfer-backup-YYYYMMDD_HHMMSS/
   ```

**Expected Recovery Time**: 5-10 minutes

### Scenario 4: Failed Deployment Rollback

**Use Case**: Rollback to pre-deployment state after a failed deployment

**Recovery Steps:**

1. **Identify the pre-deployment backup**
   ```bash
   # Pre-deployment backups are tagged with deployment info
   aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/pre-deployment/ | grep YYYYMMDD
   ```

2. **Download and restore**
   ```bash
   aws s3 cp s3://${S3_BACKUP_BUCKET}/mongodb/pre-deployment/gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc .
   
   ./scripts/restore-database.sh \
     --backup-file gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc \
     --decrypt \
     --drop \
     --validate
   ```

3. **Rollback application code**
   ```bash
   git checkout <previous-commit>
   docker-compose up -d --build
   ```

**Expected Recovery Time**: 12-18 minutes

## Testing and Validation

### Monthly Backup Restore Tests

**Automated Testing**: Every Sunday at 4:00 AM UTC via GitHub Actions

**Manual Testing Procedure**:

1. **Trigger manual test**
   ```bash
   # Via GitHub Actions UI
   Actions → Backup Restore Test → Run workflow
   ```

2. **Review test results**
   - Check GitHub Actions logs
   - Verify Slack/Discord notifications
   - Confirm document counts match

3. **Document test results**
   - Date of test
   - Backup tested
   - Success/failure status
   - Any issues encountered

### Backup Verification Checklist

- [ ] Backup file exists and is not empty
- [ ] Checksum matches metadata
- [ ] Archive can be extracted successfully
- [ ] BSON files are present and valid
- [ ] Test restore completes without errors
- [ ] Document counts match expected values
- [ ] Application can connect to restored database

## Monitoring and Alerts

### Backup Monitoring

**Metrics Tracked**:
- Last successful backup timestamp
- Backup file size
- Backup duration
- Success/failure rate
- Storage usage

**Alerts Configured**:
- ⚠️ Backup failure (immediate Slack/Discord notification)
- ⚠️ Backup size anomaly (>50% deviation from average)
- ⚠️ No backup in last 25 hours
- ⚠️ Weekly restore test failure

### Alert Channels

1. **Slack**: `${SLACK_WEBHOOK_URL}`
2. **Discord**: `${DISCORD_WEBHOOK_URL}`
3. **Email**: (configured in monitoring system)

## Incident Response Checklist

When a disaster occurs, follow this checklist:

### Immediate Response (0-5 minutes)

- [ ] Assess the severity of the incident
- [ ] Notify the incident response team
- [ ] Document incident start time
- [ ] Identify the type of failure (database, application, infrastructure)
- [ ] Determine the last known good state

### Investigation (5-15 minutes)

- [ ] Check monitoring dashboards for anomalies
- [ ] Review application logs
- [ ] Check database connectivity
- [ ] Identify the scope of data loss
- [ ] Determine recovery point needed

### Recovery (15-30 minutes)

- [ ] Select appropriate recovery scenario
- [ ] Download required backups
- [ ] Verify backup integrity
- [ ] Execute restore procedure
- [ ] Validate restored data
- [ ] Restart application services

### Post-Recovery (30-60 minutes)

- [ ] Verify application functionality
- [ ] Monitor for errors
- [ ] Notify stakeholders of recovery completion
- [ ] Document lessons learned
- [ ] Update incident log

## Emergency Contacts

### Primary Contacts

- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Database Administrator**: [Name] - [Email] - [Phone]
- **Engineering Manager**: [Name] - [Email] - [Phone]

### Escalation Path

1. **Level 1**: DevOps on-call engineer
2. **Level 2**: Database Administrator
3. **Level 3**: Engineering Manager
4. **Level 4**: CTO

### Service Providers

- **MongoDB Atlas Support**: [Support URL/Phone]
- **AWS Support**: [Support URL/Phone]
- **Google Cloud Support**: [Support URL/Phone]

## Security Considerations

### Backup Encryption

All backups are encrypted using AES-256-CBC with PBKDF2 key derivation.

**Key Management**:
- Encryption keys stored in GitHub Secrets
- Keys rotated quarterly
- Access restricted to authorized personnel only
- Keys never committed to version control

### Access Control

**Who can restore backups**:
- DevOps team members
- Database administrators
- Engineering leads (with approval)

**Audit Requirements**:
- All restore operations are logged
- Logs include: timestamp, user, backup used, reason
- Logs retained for 1 year

## Maintenance

### Weekly Tasks

- [ ] Review backup success rate
- [ ] Check storage usage
- [ ] Verify alert configurations

### Monthly Tasks

- [ ] Perform manual restore test
- [ ] Review and update documentation
- [ ] Audit access logs
- [ ] Check backup retention compliance

### Quarterly Tasks

- [ ] Rotate encryption keys
- [ ] Review and update disaster recovery plan
- [ ] Conduct disaster recovery drill
- [ ] Update emergency contacts

### Annual Tasks

- [ ] Full disaster recovery simulation
- [ ] Review RTO/RPO targets
- [ ] Update incident response procedures
- [ ] Security audit of backup systems

## Troubleshooting

### Common Issues

#### Issue: Backup file is corrupted

**Solution**:
```bash
# Download from alternative storage
gsutil cp gs://${GCS_BACKUP_BUCKET}/mongodb/daily/backup.tar.gz.enc .

# Verify checksum
./scripts/verify-backup.sh --backup-file backup.tar.gz.enc --decrypt
```

#### Issue: Decryption fails

**Solution**:
```bash
# Verify encryption key is correct
echo $BACKUP_ENCRYPTION_KEY

# Try manual decryption
openssl enc -aes-256-cbc -d -pbkdf2 -in backup.tar.gz.enc -out backup.tar.gz
```

#### Issue: Restore fails with authentication error

**Solution**:
```bash
# Verify MongoDB URI
mongosh "$MONGO_URI" --eval "db.version()"

# Check user permissions
mongosh "$MONGO_URI" --eval "db.runCommand({connectionStatus: 1})"
```

#### Issue: Point-in-time recovery timestamp not found

**Solution**:
```bash
# List available oplog entries
mongodump --uri="$MONGO_URI" --oplog --out=/tmp/check-oplog
ls -la /tmp/check-oplog/oplog.bson.gz
```

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | DevOps Team | Initial disaster recovery plan |

## Appendix

### A. Backup File Naming Convention

```
gnb-transfer-backup-YYYYMMDD_HHMMSS.tar.gz.enc
gnb-transfer-backup-YYYYMMDD_HHMMSS.metadata.json
```

Example:
- `gnb-transfer-backup-20260102_030000.tar.gz.enc` - Encrypted backup
- `gnb-transfer-backup-20260102_030000.metadata.json` - Backup metadata

### B. Required Environment Variables

```bash
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/database

# Encryption
BACKUP_ENCRYPTION_KEY=<strong-random-key>

# AWS S3
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
S3_BACKUP_BUCKET=gnb-backups

# Google Cloud Storage
GCP_SERVICE_ACCOUNT_KEY=<gcp-service-account-json>
GCS_BACKUP_BUCKET=gnb-backups

# Notifications
SLACK_WEBHOOK_URL=<slack-webhook>
DISCORD_WEBHOOK_URL=<discord-webhook>
```

### C. MongoDB Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

### D. Useful Commands

```bash
# List all backups in S3
aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/ --recursive

# Get total backup storage size
aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/ --recursive --summarize

# Download latest backup
aws s3 cp $(aws s3 ls s3://${S3_BACKUP_BUCKET}/mongodb/daily/ | sort | tail -1 | awk '{print $4}') .

# Verify MongoDB version
mongosh "$MONGO_URI" --quiet --eval "db.version()"

# Count total documents
mongosh "$MONGO_URI" --quiet --eval "
  var total = 0;
  db.getCollectionNames().forEach(function(col) {
    total += db[col].countDocuments();
  });
  print('Total documents: ' + total);
"
```

---

**Document Status**: Active  
**Last Updated**: 2026-01-02  
**Next Review**: 2026-04-02  
**Owner**: DevOps Team
