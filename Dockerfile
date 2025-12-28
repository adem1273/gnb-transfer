# ============================================================================
# Multi-stage Dockerfile for Google Cloud (App Engine / Cloud Run)
# Builds frontend and runs backend server serving static files
# ============================================================================

# ============================================================================
# Stage 1: Build Frontend
# ============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy root package.json for frontend dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy frontend source code and configuration
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY .env.example ./

# Build the frontend application
RUN npm run build

# ============================================================================
# Stage 2: Production Backend with Built Frontend
# ============================================================================
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy backend package.json
COPY backend/package*.json ./backend/

# Install backend production dependencies
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY backend ./

# Copy built frontend from builder stage
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory to backend
WORKDIR /app/backend

# Environment variables
ENV NODE_ENV=production
# Google Cloud Run/App Engine uses PORT env variable (default 8080)
ENV PORT=8080

# Expose port 8080 (Google Cloud default)
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the backend server (which serves the frontend static files)
CMD ["node", "server.mjs"]
