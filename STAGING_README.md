# GNB Transfer - Staging Environment

Production-grade staging environment with complete monitoring, load testing, and deployment automation.

## 🚀 Quick Start

```bash
# 1. Clone and navigate to project
git clone https://github.com/adem1273/gnb-transfer.git
cd gnb-transfer

# 2. Run quick start script
./scripts/staging-quickstart.sh

# 3. Seed database with test data
docker-compose -f docker-compose.staging.yml run --rm backend node scripts/seed-staging.mjs

# 4. Access services
# - Backend API: http://localhost:5000
# - Frontend: http://localhost:80
# - Grafana: http://localhost:3001 (admin/admin123)
# - Prometheus: http://localhost:9090
```

## 📋 What's Included

### Infrastructure
- **MongoDB Replica Set** (3 nodes) for high availability
- **Redis Cluster** (master + replica) for caching
- **Nginx** reverse proxy with SSL support
- **Backend API** (production build)
- **Frontend** (Vite production build)

### Monitoring
- **Prometheus** for metrics collection
- **Grafana** with 3 pre-configured dashboards:
  - System Health (CPU, memory, disk, uptime)
  - API Performance (response times, error rates, throughput)
  - Business Metrics (bookings, revenue, success rates)
- **Alert Rules** for critical issues
- **Enhanced Health Checks** with external service validation

### Load Testing
- **K6 Test Suite** with 3 scenarios:
  - Complete booking flow
  - API stress testing
  - Concurrent user testing (100/500/1000 users)
- **Performance Targets**: <200ms p95, <1% error rate

### Automation
- **Zero-downtime deployment** with automatic rollback
- **Database backups** before each deployment
- **SSL certificate generation** (self-signed for staging)
- **Large-scale data seeding** (1k users, 10k bookings)

## 📖 Documentation

- **[STAGING_DEPLOYMENT.md](docs/STAGING_DEPLOYMENT.md)** - Complete deployment guide (18,000+ words)
- **[K6 Tests README](k6-tests/README.md)** - Load testing guide
- **[SSL README](ssl-certs/README.md)** - SSL configuration guide

## 🔧 Common Commands

### Deployment

```bash
# Full automated deployment
./scripts/deploy-staging.sh

# Manual deployment
docker-compose -f docker-compose.staging.yml up -d

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop environment
docker-compose -f docker-compose.staging.yml down
```

### Database

```bash
# Seed production-like data (1k users, 10k bookings)
docker-compose -f docker-compose.staging.yml run --rm backend \
  node scripts/seed-staging.mjs

# Reset and seed
docker-compose -f docker-compose.staging.yml run --rm backend \
  node scripts/seed-staging.mjs --reset

# Backup database
docker exec gnb-mongodb-primary mongodump \
  --username admin --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --db gnb-transfer-staging \
  --archive=/tmp/backup.archive --gzip
```

### Load Testing

```bash
# Run booking flow test
k6 run k6-tests/booking-flow.js

# Run API stress test
k6 run k6-tests/api-stress.js

# Run concurrent users test
k6 run k6-tests/concurrent-users.js

# Generate HTML report
k6 run --out html=results.html k6-tests/booking-flow.js
```

### Monitoring

```bash
# Check health
curl http://localhost:5000/api/health | jq

# Check readiness
curl http://localhost:5000/api/ready | jq

# View metrics
curl http://localhost:5000/metrics

# Access Grafana
open http://localhost:3001  # Username: admin, Password: admin123

# Access Prometheus
open http://localhost:9090
```

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │  Port 80/443
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       │             │             │             │
┌──────▼──────┐ ┌───▼────────┐ ┌──▼──────┐ ┌───▼────────┐
│  Frontend   │ │  Backend   │ │Prometheus│ │  Grafana   │
│  (React)    │ │  (Node.js) │ │          │ │            │
│  Port 80    │ │  Port 5000 │ │Port 9090 │ │ Port 3001  │
└─────────────┘ └──────┬─────┘ └──────────┘ └────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
     ┌──────▼──────┐       ┌──────▼──────┐
     │  MongoDB    │       │   Redis     │
     │ Replica Set │       │   Cluster   │
     │  (3 nodes)  │       │(master+rep) │
     └─────────────┘       └─────────────┘
```

## 📊 Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| p95 Response Time | < 100ms | < 200ms | > 500ms |
| p99 Response Time | < 200ms | < 500ms | > 1000ms |
| Error Rate | < 0.1% | < 1% | > 5% |
| Throughput | > 200 req/s | > 100 req/s | < 50 req/s |
| Success Rate | > 99.9% | > 99% | < 95% |

## 🔐 Security

- Self-signed SSL certificates for staging (generate with `./scripts/generate-ssl-certs.sh`)
- Use Let's Encrypt for production
- All secrets in `.env` files (never committed)
- Rate limiting configured in Nginx
- MongoDB authentication enabled
- Redis password protection

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs backend

# Rebuild images
docker-compose -f docker-compose.staging.yml build --no-cache
```

### MongoDB replica set issues
```bash
# Check status
docker exec -it gnb-mongodb-primary mongosh -u admin -p PASSWORD \
  --authenticationDatabase admin --eval "rs.status()"
```

### High memory usage
```bash
# Check stats
docker stats

# Add memory limits in docker-compose.staging.yml
```

### Load tests failing
```bash
# Verify API is accessible
curl http://localhost:5000/api/health

# Seed test data
docker-compose -f docker-compose.staging.yml run --rm backend \
  node scripts/seed-staging.mjs
```

See [STAGING_DEPLOYMENT.md](docs/STAGING_DEPLOYMENT.md) for detailed troubleshooting.

## 📝 Environment Variables

Copy `.env.staging.example` to `.env` and configure:

```bash
# MongoDB
MONGO_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Backend
JWT_SECRET=your_super_secret_jwt_key_at_least_64_chars
CORS_ORIGINS=http://localhost,http://nginx

# Optional Services
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
```

## 🤝 Contributing

1. Test changes in staging environment
2. Run load tests
3. Check monitoring dashboards
4. Document any new features

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [K6 Load Testing](https://k6.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [Prometheus](https://prometheus.io/docs/)
- [MongoDB Replica Sets](https://docs.mongodb.com/manual/replication/)

## 📄 License

ISC

---

**For detailed documentation, see [docs/STAGING_DEPLOYMENT.md](docs/STAGING_DEPLOYMENT.md)**
