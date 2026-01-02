# Staging Environment Deployment Guide

This guide covers the complete setup, deployment, and management of the GNB Transfer staging environment.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment](#deployment)
5. [Load Testing](#load-testing)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Overview

The staging environment mirrors production as closely as possible, with:

- **MongoDB Replica Set** (3 nodes) for database redundancy
- **Redis Cluster** (master + replica) for caching
- **Backend API** (production build)
- **Frontend** (Vite production build)
- **Nginx** reverse proxy with SSL
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **K6** for load testing

### Architecture

```
                                  ┌─────────────┐
                                  │   Nginx     │
                                  │  (Port 80)  │
                                  └──────┬──────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
             ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
             │  Frontend   │      │  Backend    │     │ Prometheus  │
             │  (Port 80)  │      │ (Port 5000) │     │ (Port 9090) │
             └─────────────┘      └──────┬──────┘     └──────┬──────┘
                                         │                    │
                    ┌────────────────────┼────────────────────┘
                    │                    │
             ┌──────▼──────┐      ┌──────▼──────┐
             │  MongoDB    │      │   Redis     │
             │ Replica Set │      │   Cluster   │
             │  (3 nodes)  │      │(master+rep) │
             └─────────────┘      └─────────────┘
```

---

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk**: 50GB free space
- **CPU**: 4+ cores recommended

### Required Software

```bash
# Docker & Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# K6 (for load testing)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Optional: MongoDB tools (for backups)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org-tools
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# MongoDB
MONGO_PASSWORD=your_secure_mongodb_password

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Backend
JWT_SECRET=your_super_secret_jwt_key_at_least_64_chars_long
CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173

# Optional Services
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_grafana_password
```

---

## Initial Setup

### 1. Generate SSL Certificates

For staging, generate self-signed certificates:

```bash
./scripts/generate-ssl-certs.sh
```

For production, use Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

### 2. Seed Database with Test Data

Create production-like data volume (1k users, 10k bookings):

```bash
# Start only MongoDB
docker-compose -f docker-compose.staging.yml up -d mongodb-primary mongodb-secondary1 mongodb-secondary2 mongodb-setup

# Wait for replica set initialization
sleep 30

# Seed the database
docker-compose -f docker-compose.staging.yml run --rm backend node scripts/seed-staging.mjs

# Or reset and seed
docker-compose -f docker-compose.staging.yml run --rm backend node scripts/seed-staging.mjs --reset
```

### 3. Build Images

```bash
# Build all images
docker-compose -f docker-compose.staging.yml build

# Or build specific services
docker-compose -f docker-compose.staging.yml build backend
docker-compose -f docker-compose.staging.yml build frontend
```

---

## Deployment

### Automated Deployment

Use the deployment script for zero-downtime deployment:

```bash
./scripts/deploy-staging.sh
```

The script will:
1. ✓ Check prerequisites and health
2. ✓ Backup the database
3. ✓ Pull and build images
4. ✓ Deploy services with zero downtime
5. ✓ Run database migrations
6. ✓ Validate deployment
7. ✓ Run post-deployment tests
8. ✓ Rollback on failure

### Manual Deployment

For manual control:

```bash
# Start all services
docker-compose -f docker-compose.staging.yml up -d

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Check service status
docker-compose -f docker-compose.staging.yml ps

# Stop all services
docker-compose -f docker-compose.staging.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.staging.yml down -v
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.staging.yml up -d --scale backend=3

# Note: You'll need to update nginx configuration for load balancing
```

---

## Load Testing

### Running K6 Tests

The project includes three K6 test scenarios:

#### 1. Booking Flow Test

Simulates complete user journey (register → login → browse → book → pay):

```bash
# Run with default settings (ramps up to 100 users)
k6 run k6-tests/booking-flow.js

# Run with custom API URL
k6 run -e API_URL=http://your-staging-server:5000/api k6-tests/booking-flow.js

# Generate HTML report
k6 run --out html=results/booking-flow.html k6-tests/booking-flow.js
```

**Expected Results:**
- p95 response time: < 200ms
- Error rate: < 1%
- Booking success rate: > 95%

#### 2. API Stress Test

Tests all major endpoints:

```bash
k6 run k6-tests/api-stress.js
```

**Expected Results:**
- p95 response time: < 200ms
- Error rate: < 1%
- All endpoints responding correctly

#### 3. Concurrent Users Test

Tests with 100/500/1000 concurrent users:

```bash
# Test with 100 users (default)
k6 run k6-tests/concurrent-users.js

# Enable 500 users test (edit file to uncomment medium_load scenario)
# Enable 1000 users test (edit file to uncomment high_load scenario)
```

**Expected Results:**
- System remains stable under load
- No memory leaks or crashes
- Graceful degradation under extreme load

### Interpreting Results

K6 outputs several important metrics:

```
✓ http_req_duration........: avg=45ms  min=12ms med=38ms max=250ms p(90)=95ms  p(95)=150ms
✓ http_req_failed..........: 0.23%  (23/10000)
✓ http_reqs................: 10000  166/s
✓ iteration_duration.......: avg=2.1s min=1.8s med=2.0s max=3.5s  p(90)=2.4s  p(95)=2.8s
✓ vus......................: 100    min=10   max=100
```

**Key Metrics:**
- **http_req_duration p(95)**: 95% of requests should complete within this time
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total requests and requests per second
- **vus**: Number of virtual users

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| p95 Response Time | < 200ms | < 500ms |
| p99 Response Time | < 500ms | < 1000ms |
| Error Rate | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |
| Success Rate | > 99% | > 95% |

---

## Monitoring

### Accessing Dashboards

After deployment, access monitoring dashboards:

- **Grafana**: http://localhost:3001
  - Username: `admin` (from GRAFANA_ADMIN_USER)
  - Password: `admin123` (from GRAFANA_ADMIN_PASSWORD)

- **Prometheus**: http://localhost:9090

- **Backend Metrics**: http://localhost:5000/metrics

- **Backend Health**: http://localhost:5000/api/health

### Grafana Dashboards

Three pre-configured dashboards are available:

#### 1. System Health Dashboard

Shows system-level metrics:
- Service status (backend, database, Redis)
- CPU and memory usage
- Disk space
- Network I/O
- Uptime

**Access**: Grafana → Dashboards → System Health

#### 2. API Performance Dashboard

Shows API performance metrics:
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate
- Status code distribution
- Top slowest endpoints
- Database query performance
- Cache hit rate

**Access**: Grafana → Dashboards → API Performance

**Alerts Configured:**
- p95 response time > 200ms (warning)
- Error rate > 1% (critical)

#### 3. Business Metrics Dashboard

Shows business KPIs:
- Total bookings today
- Booking success rate
- Revenue
- Active users
- Payment success rate
- Cancellation rate
- Customer retention

**Access**: Grafana → Dashboards → Business Metrics

### Prometheus Alerts

Alert rules are configured in `prometheus/alerts/api-alerts.yml`:

| Alert | Threshold | Severity |
|-------|-----------|----------|
| HighErrorRate | > 1% for 5m | Critical |
| SlowAPIResponse | p95 > 200ms for 10m | Warning |
| VerySlowAPIResponse | p95 > 1s for 5m | Critical |
| HighCacheMissRate | > 50% for 10m | Warning |
| RedisConnectionDown | 2m | Critical |
| DatabaseConnectionDown | 2m | Critical |
| HighMemoryUsage | > 90% for 5m | Warning |
| ServiceDown | 2m | Critical |

### Setting Up Alerts

To receive notifications:

1. **Configure Alertmanager** (optional):

```yaml
# alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  receiver: 'slack'
  group_by: ['alertname']
  
receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

2. **Update docker-compose.staging.yml** to include Alertmanager.

3. **Grafana Contact Points**:
   - Go to Grafana → Alerting → Contact points
   - Add email, Slack, PagerDuty, etc.

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

**Problem**: Containers exit immediately or fail to start.

**Solutions**:

```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs backend

# Check container status
docker-compose -f docker-compose.staging.yml ps

# Verify environment variables
docker-compose -f docker-compose.staging.yml config

# Rebuild images
docker-compose -f docker-compose.staging.yml build --no-cache backend
```

#### 2. MongoDB Replica Set Issues

**Problem**: MongoDB replica set not initializing.

**Solutions**:

```bash
# Check MongoDB logs
docker logs gnb-mongodb-primary

# Manually initialize replica set
docker exec -it gnb-mongodb-primary mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin

# Inside mongosh:
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-primary:27017", priority: 2 },
    { _id: 1, host: "mongodb-secondary1:27017", priority: 1 },
    { _id: 2, host: "mongodb-secondary2:27017", priority: 1 }
  ]
})

# Check replica set status
rs.status()
```

#### 3. High Memory Usage

**Problem**: Containers consuming too much memory.

**Solutions**:

```bash
# Check memory usage
docker stats

# Add memory limits to docker-compose.staging.yml:
services:
  backend:
    mem_limit: 2g
    mem_reservation: 1g

# Restart with limits
docker-compose -f docker-compose.staging.yml up -d
```

#### 4. Slow Performance

**Problem**: API responses are slow.

**Diagnostic Steps**:

1. Check Grafana → API Performance dashboard
2. Look for slow database queries
3. Check cache hit rate
4. Monitor system resources

**Solutions**:

```bash
# Check database indexes
docker exec -it gnb-backend-staging node scripts/db-indexes.mjs

# Clear Redis cache
docker exec -it gnb-redis-master redis-cli -a YOUR_PASSWORD FLUSHALL

# Optimize database
docker exec -it gnb-mongodb-primary mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin --eval "db.runCommand({compact: 'bookings'})"
```

#### 5. SSL Certificate Errors

**Problem**: HTTPS not working or certificate warnings.

**Solutions**:

```bash
# Regenerate self-signed certificates
./scripts/generate-ssl-certs.sh

# Verify certificate
openssl x509 -in ssl-certs/cert.pem -text -noout

# Check nginx configuration
docker exec gnb-nginx-staging nginx -t

# Reload nginx
docker exec gnb-nginx-staging nginx -s reload
```

#### 6. Load Test Failures

**Problem**: K6 tests failing with errors.

**Solutions**:

```bash
# Verify API is accessible
curl http://localhost:5000/api/health

# Seed test data
docker-compose -f docker-compose.staging.yml run --rm backend node scripts/seed-staging.mjs

# Run tests with verbose output
k6 run --verbose k6-tests/booking-flow.js

# Reduce load
# Edit k6 test file to reduce concurrent users
```

### Health Check Debugging

Check comprehensive health endpoint:

```bash
curl http://localhost:5000/api/health | jq
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-02T12:00:00.000Z",
    "uptime": 3600,
    "environment": "staging",
    "services": {
      "database": {
        "status": "healthy",
        "connected": true,
        "latency": 15,
        "readWrite": "ok"
      },
      "redis": {
        "status": "healthy",
        "connected": true,
        "latency": 5
      },
      "stripe": {
        "status": "healthy",
        "available": true,
        "latency": 120
      },
      "openai": {
        "status": "not_configured",
        "available": false
      }
    },
    "resources": {
      "diskSpace": {
        "status": "healthy",
        "memoryUsagePercent": 45.2
      },
      "memory": {
        "status": "healthy",
        "system": {
          "totalMB": 16384,
          "usedMB": 7408,
          "usagePercent": 45.2
        },
        "process": {
          "heapUsedMB": 512,
          "heapTotalMB": 1024,
          "heapUsagePercent": 50.0
        }
      }
    }
  }
}
```

### Log Analysis

```bash
# View all logs
docker-compose -f docker-compose.staging.yml logs

# View specific service logs
docker-compose -f docker-compose.staging.yml logs backend
docker-compose -f docker-compose.staging.yml logs mongodb-primary

# Follow logs in real-time
docker-compose -f docker-compose.staging.yml logs -f --tail=100

# Search logs
docker-compose -f docker-compose.staging.yml logs | grep ERROR
```

---

## Maintenance

### Regular Tasks

#### Daily

- [ ] Check Grafana dashboards for anomalies
- [ ] Review error logs
- [ ] Monitor disk space

#### Weekly

- [ ] Review Prometheus alerts
- [ ] Run load tests
- [ ] Check for security updates
- [ ] Verify backup integrity

#### Monthly

- [ ] Update dependencies
- [ ] Rotate secrets/passwords
- [ ] Review and optimize database indexes
- [ ] Clean up old backups

### Backup and Restore

#### Backup

```bash
# Automated backup (included in deploy-staging.sh)
./scripts/deploy-staging.sh

# Manual backup
docker exec gnb-mongodb-primary mongodump \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --db gnb-transfer-staging \
  --archive=/tmp/backup.archive \
  --gzip

docker cp gnb-mongodb-primary:/tmp/backup.archive ./backups/manual-backup-$(date +%Y%m%d).archive
```

#### Restore

```bash
# Copy backup to container
docker cp ./backups/backup.archive gnb-mongodb-primary:/tmp/restore.archive

# Restore
docker exec gnb-mongodb-primary mongorestore \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --archive=/tmp/restore.archive \
  --gzip \
  --drop

# Verify
docker exec gnb-mongodb-primary mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin --eval "db.bookings.countDocuments()"
```

### Updating Services

```bash
# Update specific service
docker-compose -f docker-compose.staging.yml pull backend
docker-compose -f docker-compose.staging.yml up -d backend

# Update all services
./scripts/deploy-staging.sh

# Update with custom backup
SKIP_BACKUP=false ./scripts/deploy-staging.sh
```

### Scaling Guidelines

**When to scale:**
- CPU usage consistently > 70%
- Memory usage consistently > 80%
- Response times increasing
- Error rates increasing

**How to scale:**

```bash
# Scale backend horizontally
docker-compose -f docker-compose.staging.yml up -d --scale backend=3

# Update nginx for load balancing (edit nginx-staging.conf):
upstream backend {
    least_conn;
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}

# Restart nginx
docker-compose -f docker-compose.staging.yml restart nginx
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (WARNING: removes everything)
docker system prune -a --volumes
```

---

## Best Practices

### Security

1. **Never commit secrets** to version control
2. **Use strong passwords** for all services
3. **Keep systems updated** regularly
4. **Limit access** to staging environment
5. **Use SSL/TLS** even in staging
6. **Monitor logs** for suspicious activity
7. **Rotate credentials** regularly

### Performance

1. **Monitor key metrics** continuously
2. **Run load tests** before major releases
3. **Optimize database queries** based on slow query logs
4. **Use caching** effectively
5. **Scale horizontally** when needed

### Reliability

1. **Automate deployments** to reduce human error
2. **Always backup** before deployments
3. **Test rollback procedures** regularly
4. **Set up alerts** for critical issues
5. **Document incidents** and solutions

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [K6 Load Testing Guide](https://k6.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [MongoDB Replica Sets](https://docs.mongodb.com/manual/replication/)
- [Redis Replication](https://redis.io/topics/replication)
- [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)

---

## Support

For issues or questions:

1. Check this documentation
2. Review logs and metrics
3. Consult the troubleshooting section
4. Contact the DevOps team

---

**Last Updated**: 2024-01-02
**Version**: 1.0.0
