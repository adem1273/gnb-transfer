# Docker Deployment for GNB Transfer

This Dockerfile builds a production-ready container that includes both the frontend and backend of the GNB Transfer application.

## Container Architecture

The Dockerfile uses a multi-stage build:

1. **Stage 1 (frontend-builder)**: Builds the React frontend using Vite
2. **Stage 2 (production)**: Sets up the Node.js backend and serves the built frontend

## Building the Image

```bash
# Build the Docker image
docker build -t gnb-transfer .

# Build with a specific tag
docker build -t gnb-transfer:v1.0.0 .
```

## Running Locally

### Basic Run

```bash
docker run -p 8080:8080 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  gnb-transfer
```

### Run with Environment File

Create a `.env.docker` file:
```env
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gnb-transfer
JWT_SECRET=your-secret-key-minimum-32-characters
CORS_ORIGINS=http://localhost:8080
```

Then run:
```bash
docker run -p 8080:8080 --env-file .env.docker gnb-transfer
```

### Run with docker-compose

```bash
# Start all services (includes MongoDB)
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

### Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (minimum 32 characters)

### Optional but Recommended
- `NODE_ENV` - Set to `production` (default: production)
- `PORT` - Port to listen on (default: 8080)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `SENTRY_DSN` - Sentry error tracking DSN

## Port Configuration

The container exposes port 8080 by default (Google Cloud standard). The backend automatically uses the `PORT` environment variable if provided.

## Health Check

The container includes a health check that verifies the `/api/health` endpoint:

```bash
# Check container health
docker ps

# Manually test health endpoint
curl http://localhost:8080/api/health
```

## Testing the Container

After starting the container:

```bash
# Test health endpoint
curl http://localhost:8080/api/health

# Test API endpoint
curl http://localhost:8080/api/v1/tours

# Open in browser
open http://localhost:8080
```

## Build Optimization

The Dockerfile is optimized for:
- **Multi-stage builds** - Smaller final image size
- **Layer caching** - Faster subsequent builds
- **Production dependencies only** - Reduced attack surface
- **Non-root user** - Enhanced security
- **Alpine Linux** - Minimal base image

## Image Size

Expected image sizes:
- **Frontend builder stage**: ~800MB (discarded)
- **Final production image**: ~400-500MB

## Troubleshooting

### Build fails during npm install
- Ensure package-lock.json is not in .dockerignore
- Try with `--no-cache` flag: `docker build --no-cache -t gnb-transfer .`

### Container exits immediately
- Check logs: `docker logs <container-id>`
- Verify required environment variables are set
- Ensure MongoDB is accessible

### Frontend not loading
- Verify the dist directory was created during build
- Check that backend server.mjs serves static files from /app/dist
- Ensure PORT environment variable is correctly set

### API returns 404
- Verify CORS_ORIGINS includes your domain
- Check backend routes are properly configured
- Ensure MongoDB connection is successful

## Google Cloud Deployment

This Dockerfile is specifically designed for Google Cloud Run and App Engine:

### Cloud Run
```bash
# Build and tag for GCR
docker build -t gcr.io/PROJECT_ID/gnb-transfer .

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/gnb-transfer

# Deploy to Cloud Run
gcloud run deploy gnb-transfer \
  --image gcr.io/PROJECT_ID/gnb-transfer \
  --platform managed \
  --region us-central1 \
  --port 8080
```

### App Engine
```bash
# Deploy using app.yaml
gcloud app deploy
```

See [docs/DEPLOY_GOOGLE_CLOUD.md](docs/DEPLOY_GOOGLE_CLOUD.md) for detailed deployment instructions.

## Security Considerations

The Dockerfile implements several security best practices:

1. **Non-root user**: Runs as nodejs user (UID 1001)
2. **Production dependencies only**: Excludes devDependencies
3. **Alpine Linux**: Minimal attack surface
4. **No secrets in image**: All secrets passed via environment variables
5. **Health checks**: Automated container health monitoring

## Performance

### Build Time
- First build: ~10-15 minutes (depending on network and CPU)
- Subsequent builds with cache: ~2-5 minutes
- Cloud Build (with high-CPU machine): ~5-8 minutes

### Runtime Performance
- Cold start: ~2-3 seconds
- Memory usage: ~200-400MB (depending on traffic)
- Recommended: 1 CPU, 2GB RAM for production

## Support

For deployment issues:
- Check [DEPLOY_GOOGLE_CLOUD.md](docs/DEPLOY_GOOGLE_CLOUD.md)
- Review container logs: `docker logs <container-id>`
- Test locally before deploying to cloud

For Google Cloud specific issues:
- See [QUICKSTART_GOOGLE_CLOUD.md](docs/QUICKSTART_GOOGLE_CLOUD.md)
