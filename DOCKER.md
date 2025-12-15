# Docker Deployment Guide

This guide explains how to run the GNB Transfer application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher

## Quick Start

### 1. Start the entire system with a single command:

```bash
docker-compose up -d
```

This will start:
- MongoDB database on port 27017
- Backend API on port 5000
- Frontend application on port 3000

### 2. Access the application:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: localhost:27017

### 3. Stop the system:

```bash
docker-compose down
```

### 4. Stop and remove all data (including volumes):

```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_PASSWORD=your_secure_password

# Backend
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
CORS_ORIGINS=http://localhost:3000,http://localhost

# Frontend
VITE_API_URL=http://localhost:5000/api

# Optional: Stripe
STRIPE_SECRET_KEY=sk_test_...

# Optional: OpenAI
OPENAI_API_KEY=sk-...

# Optional: Sentry
SENTRY_DSN=https://...@sentry.io/...
```

### With Redis (Optional)

To include Redis cache:

```bash
docker-compose --profile full up -d
```

## Development

### Build specific services:

```bash
# Build frontend only
docker-compose build frontend

# Build backend only
docker-compose build backend
```

### View logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart a service:

```bash
docker-compose restart backend
```

## Production Deployment

### 1. Set production environment variables:

```bash
export NODE_ENV=production
export JWT_SECRET="your-production-secret-minimum-32-characters"
export MONGO_PASSWORD="strong-production-password"
```

### 2. Deploy with Docker Compose:

```bash
docker-compose up -d
```

### 3. Health checks:

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## Troubleshooting

### Container won't start:

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps
```

### Database connection issues:

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### Frontend can't connect to backend:

1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check CORS settings in backend `.env`
3. Verify `VITE_API_URL` in frontend environment

### Reset everything:

```bash
# Stop all containers
docker-compose down

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Cloud Deployment

### Google Cloud Run

1. Build and push images:

```bash
# Backend
docker build -t gcr.io/[PROJECT-ID]/gnb-backend ./backend
docker push gcr.io/[PROJECT-ID]/gnb-backend

# Frontend
docker build -t gcr.io/[PROJECT-ID]/gnb-frontend .
docker push gcr.io/[PROJECT-ID]/gnb-frontend
```

2. Deploy to Cloud Run using Google Cloud Console or CLI

### Vercel (Frontend Only)

The frontend can be deployed to Vercel without Docker:

```bash
vercel --prod
```

## Performance Tips

1. **Use production builds**: Always set `NODE_ENV=production`
2. **Configure memory limits**: Add memory limits in docker-compose.yml
3. **Use external databases**: In production, use managed MongoDB (Atlas, etc.)
4. **Enable caching**: Use Redis profile for better performance
5. **Monitor resources**: Use `docker stats` to monitor resource usage

## Security

1. **Never commit `.env` files** with real secrets
2. **Use strong passwords** for MongoDB
3. **Change default JWT_SECRET** in production
4. **Use HTTPS** in production (configure nginx/reverse proxy)
5. **Limit exposed ports** in production
6. **Regular updates**: Keep Docker images updated

## Volumes

The system uses Docker volumes for data persistence:

- `mongodb_data`: MongoDB database files
- `mongodb_config`: MongoDB configuration
- `redis_data`: Redis data (if using full profile)
- `backend_logs`: Backend application logs
- `backend_uploads`: User uploaded files

To backup volumes:

```bash
docker run --rm -v gnb-transfer_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## Support

For issues related to Docker deployment, please check:
1. Docker and Docker Compose versions
2. Available system resources (CPU, RAM, disk)
3. Port conflicts with other services
4. Environment variable configuration
