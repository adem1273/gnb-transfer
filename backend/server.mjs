import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first (before any other imports)
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import logger from './config/logger.mjs';
import { validateEnv, getJwtSecret, env } from './config/env.mjs';
import { initSentry } from './config/sentry.mjs';
import { getCorsOptions, validateCorsConfig } from './config/cors.mjs';
import swaggerSpec from './config/swagger.mjs';
import { responseMiddleware } from './middlewares/response.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';
import { errorHandler } from './middlewares/errorHandler.mjs';
import { getCacheStats } from './middlewares/cache.mjs';
import { initRedis, getRedisStats } from './services/cacheService.mjs';
import { requestLogger, errorLogger } from './middlewares/logging.mjs';
import { requestIdMiddleware } from './middlewares/requestId.mjs';
import { getMetrics, trackError } from './middlewares/metrics.mjs';
import {
  getMetrics as getPromMetrics,
  getContentType as getPromContentType,
} from './services/metricsService.mjs';
import { metricsMiddleware } from './middlewares/prometheusMiddleware.mjs';
import { DATABASE } from './constants/limits.mjs';

import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';
import delayRoutes from './routes/delayRoutes.mjs';
import packageRoutes from './routes/packageRoutes.mjs';
import chatRoutes from './routes/chatRoutes.mjs';
import adminRoutes from './routes/adminRoutes.mjs';
import financeRoutes from './routes/financeRoutes.mjs';
import driverRoutes from './routes/driverRoutes.mjs';
import vehicleRoutes from './routes/vehicleRoutes.mjs';
import couponRoutes from './routes/couponRoutes.mjs';
import referralRoutes from './routes/referralRoutes.mjs';
import faqRoutes from './routes/faqRoutes.mjs';
import recommendationRoutes from './routes/recommendationRoutes.mjs';
import supportRoutes from './routes/supportRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import featureToggleRoutes from './routes/featureToggleRoutes.mjs';
import fleetRoutes from './routes/fleetRoutes.mjs';
import driverStatsRoutes from './routes/driverStatsRoutes.mjs';
import delayCompensationRoutes from './routes/delayCompensationRoutes.mjs';
import revenueAnalyticsRoutes from './routes/revenueAnalyticsRoutes.mjs';
import corporateRoutes from './routes/corporateRoutes.mjs';
import docsRoutes from './routes/docsRoutes.mjs';
import blogRoutes from './routes/blogRoutes.mjs';
import { routeRouter } from './routes/routeRoutes.mjs';
import { pricingRouter } from './routes/pricingRoutes.mjs';

// New admin feature routes
import settingsRoutes from './routes/settingsRoutes.mjs';
import basePricingRoutes from './routes/basePricingRoutes.mjs';
import extraServicesRoutes from './routes/extraServicesRoutes.mjs';
import reviewRoutes from './routes/reviewRoutes.mjs';
import adTrackingRoutes from './routes/adTrackingRoutes.mjs';
import loyaltyRoutes from './routes/loyaltyRoutes.mjs';
import bulkMessagingRoutes from './routes/bulkMessagingRoutes.mjs';
import invoiceRoutes from './routes/invoiceRoutes.mjs';
import sitemapRoutes from './routes/sitemapRoutes.mjs';
import campaignRoutes from './routes/campaignRoutes.mjs';

// Initialize schedulers and services
import { initCampaignScheduler } from './services/campaignScheduler.mjs';
import { initDynamicPricing } from './services/dynamicPricingService.mjs';
import { initWeeklyReportScheduler } from './services/weeklyReportService.mjs';
import { initSitemapScheduler } from './services/sitemapService.mjs';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables early (will throw if critical vars missing in production)
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

// === CRITICAL: EXACT PATH TO REACT BUILD ===
// Construct absolute path to dist directory using path.resolve()
// This works in any environment (local, Render, etc.) by resolving relative to backend directory
// __dirname = /path/to/gnb-transfer/backend
// path.resolve(__dirname, '..', 'dist') = /path/to/gnb-transfer/dist (absolute path)
const buildPath = path.resolve(__dirname, '..', 'dist');
logger.debug('FRONTEND PATH:', { buildPath }); // Logs absolute path to dist directory

// Define PORT and HOST early (needed by health check endpoints)
// Render assigns PORT dynamically - this is critical for deployment success
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

console.log('=== SERVER CONFIGURATION ===');
console.log('PORT from environment:', process.env.PORT);
console.log('PORT to use:', PORT);
console.log('HOST:', HOST);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('===========================');

// Initialize Sentry early
const sentryHandlers = initSentry(express());

const app = express();

// Trust proxy - IMPORTANT for production deployments
// When behind a reverse proxy (nginx, CloudFlare, Vercel, etc.)
// Express needs to trust the X-Forwarded-* headers to get correct client IP
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  // Set to 1 if directly behind a single reverse proxy
  // Set to the number of proxies if behind multiple
  // Set to 'true' to trust all proxies (use with caution)
  app.set('trust proxy', 1);
  console.log('✓ Trust proxy enabled (production mode)');
}

// Validate CORS configuration at startup
validateCorsConfig();

// Sentry request handler must be first
if (sentryHandlers) {
  app.use(sentryHandlers.requestHandler);
  app.use(sentryHandlers.tracingHandler);
}

// Security & parsers
// Strict Content Security Policy
const getAllowedCorsOrigins = () => {
  const corsOrigins = process.env.CORS_ORIGINS;
  if (!corsOrigins) return [];
  return corsOrigins.split(',').map((o) => o.trim());
};

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", ...getAllowedCorsOrigins()],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: false, // Will be added conditionally below
  })
);

// Add HSTS with preload in production
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet.hsts({
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}

// Additional security headers
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
// Note: permissionsPolicy was removed in Helmet v8
// If needed, use a separate middleware or app.use((req, res, next) => {
//   res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
//   next();
// });

// Additional security headers middleware
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors(getCorsOptions()));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID for correlation
app.use(requestIdMiddleware);

// Request logging
app.use(requestLogger);

// Rate limiting & standardized responses
app.use(globalRateLimiter);
app.use(responseMiddleware);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// API Versioning - v1 routes
// All API routes are versioned for backward compatibility
const API_V1 = '/api/v1';

// v1 Routes
app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/users`, userRoutes);
app.use(`${API_V1}/tours`, tourRoutes);
app.use(`${API_V1}/bookings`, bookingRoutes);
app.use(`${API_V1}/delay`, delayRoutes);
app.use(`${API_V1}/packages`, packageRoutes);
app.use(`${API_V1}/chat`, chatRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}/finance`, financeRoutes);
app.use(`${API_V1}/drivers`, driverRoutes);
app.use(`${API_V1}/vehicles`, vehicleRoutes);
app.use(`${API_V1}/coupons`, couponRoutes);
app.use(`${API_V1}/referrals`, referralRoutes);
app.use(`${API_V1}/faq`, faqRoutes);
app.use(`${API_V1}/recommendations`, recommendationRoutes);
app.use(`${API_V1}/support`, supportRoutes);
app.use(`${API_V1}/routes`, routeRouter);
app.use(`${API_V1}/pricing`, pricingRouter);

// Feature toggle routes (v1)
app.use(`${API_V1}/admin/features`, featureToggleRoutes);

// New feature routes (v1 - protected by feature toggles)
app.use(`${API_V1}/admin/fleet`, fleetRoutes);
app.use(`${API_V1}/admin/drivers`, driverStatsRoutes);
app.use(`${API_V1}/admin/delay`, delayCompensationRoutes);
app.use(`${API_V1}/admin/analytics`, revenueAnalyticsRoutes);
app.use(`${API_V1}/admin/corporate`, corporateRoutes);

// New admin feature routes (v1)
app.use(`${API_V1}/admin/settings`, settingsRoutes);
app.use(`${API_V1}/admin/base-pricing`, basePricingRoutes);
app.use(`${API_V1}/admin/extra-services`, extraServicesRoutes);
app.use(`${API_V1}/admin/messaging`, bulkMessagingRoutes);
app.use(`${API_V1}/admin/tracking`, adTrackingRoutes);
app.use(`${API_V1}/reviews`, reviewRoutes);
app.use(`${API_V1}/blog`, blogRoutes);
app.use(`${API_V1}/loyalty`, loyaltyRoutes);
app.use(`${API_V1}/invoices`, invoiceRoutes);
app.use(`${API_V1}/tracking`, adTrackingRoutes);
app.use(`${API_V1}/sitemap`, sitemapRoutes);
app.use(`${API_V1}/campaigns`, campaignRoutes);

// API documentation endpoint (v1)
app.use(`${API_V1}/docs`, docsRoutes);

// Swagger UI documentation (v1)
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GNB Transfer API Documentation',
};
app.use(`${API_V1}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Legacy Swagger UI (for backward compatibility)
app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Blog routes (v1)
app.use(`${API_V1}/blogs`, blogRoutes);

// Legacy routes (for backward compatibility)
// These will be deprecated in future versions
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/delay', delayRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/routes', routeRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/admin/features', featureToggleRoutes);
app.use('/api/admin/fleet', fleetRoutes);
app.use('/api/admin/drivers', driverStatsRoutes);
app.use('/api/admin/delay', delayCompensationRoutes);
app.use('/api/admin/analytics', revenueAnalyticsRoutes);
app.use('/api/admin/corporate', corporateRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/blogs', blogRoutes);

// New admin feature routes (legacy)
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/base-pricing', basePricingRoutes);
app.use('/api/admin/extra-services', extraServicesRoutes);
app.use('/api/admin/messaging', bulkMessagingRoutes);
app.use('/api/admin/tracking', adTrackingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tracking', adTrackingRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check endpoint (registered before other routes)
app.get('/api/health', async (req, res) => {
  let dbConnected = false;
  try {
    await mongoose.connection.db.admin().ping();
    dbConnected = true;
  } catch (err) {
    dbConnected = false;
  }

  const health = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        connected: dbConnected,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][
          mongoose.connection.readyState
        ],
      },
      cache: getCacheStats(),
      redis: getRedisStats(),
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  };

  return res.status(dbConnected ? 200 : 503).json({ success: dbConnected, data: health });
});

// Legacy health check (for backward compatibility)
// Enhanced to include port and CORS info for Render deployment verification
app.get('/health', async (req, res) => {
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || 
    (process.env.NODE_ENV === 'production' 
      ? ['https://gnb-transfer.onrender.com', 'http://localhost:3000']
      : ['http://localhost:5173', 'http://localhost:3000']);
  
  res.apiSuccess({ 
    status: 'ok',
    port: PORT,
    host: HOST,
    path: buildPath,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ['default configuration']
  }, 'Server is running');
});

// Readiness check endpoint
app.get('/api/ready', async (req, res) => {
  const isReady =
    mongoose.connection.readyState === 1 && // DB connected
    process.uptime() > 5; // Server running for at least 5 seconds

  if (isReady) {
    return res.apiSuccess(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      },
      'Server is ready'
    );
  }
  return res.status(503).json({
    success: false,
    error: 'Service not ready',
    details: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
      uptime: process.uptime(),
    },
  });
});

// Metrics endpoint (JSON format)
app.get('/api/metrics', (req, res) => {
  const metrics = getMetrics();
  res.json(metrics);
});

// Prometheus metrics endpoint (prom-client format)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', getPromContentType());
    res.end(await getPromMetrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Serve static files from React build
// This must come after API routes to avoid conflicts
app.use(express.static(buildPath));

// Handle client-side routing - send all non-API requests to React app
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  logger.debug('SERVING INDEX:', { indexPath });
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error('SEND FILE ERROR:', { error: err.message });
      res.status(500).send('Frontend failed to load. Path incorrect.');
    }
  });
});

// Error logging middleware
app.use(errorLogger);

// Sentry error handler (must be before other error handlers)
if (sentryHandlers) {
  app.use(sentryHandlers.errorHandler);
}

// Centralized error handler (must be last middleware)
app.use((err, req, res, next) => {
  trackError(err);
  errorHandler(err, req, res, next);
});

// Database connect
const MONGO_URI = process.env.MONGO_URI || '';

const connectDB = async (retryCount = 0) => {
  if (!MONGO_URI) {
    logger.warn('MONGO_URI is not set. Skipping database connection.');
    return;
  }
  
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: DATABASE.SERVER_SELECTION_TIMEOUT_MS,
      heartbeatFrequencyMS: DATABASE.HEARTBEAT_FREQUENCY_MS,
    });
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}/${DATABASE.MAX_RETRIES}):`, {
      error: err.message,
    });
    
    if (retryCount < DATABASE.MAX_RETRIES - 1) {
      logger.info(`Retrying in ${DATABASE.RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, DATABASE.RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }
    
    logger.error('Max retry attempts reached.');
    if (process.env.NODE_ENV === 'production') {
      logger.error('FATAL: Cannot start production server without database');
      process.exit(1);
    }
    logger.warn('Server will continue without database in development mode.');
  }
};

// Connection event handlers for reconnection
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', { error: err.message });
});

// JWT_SECRET validation is now handled by validateEnv() at startup
// getJwtSecret() is used throughout the app for consistent secret access

await connectDB();

// Initialize Redis cache
initRedis();

// Initialize feature toggles
import featureToggleService from './services/featureToggleService.mjs';

const defaultFeatures = [
  {
    id: 'fleet_tracking',
    name: 'Canlı Filo Takibi',
    description: 'Sürücülerin canlı konumunu harita üzerinde gösterir',
    route: '/admin/fleet',
    component: 'FleetTrackingDashboard',
    api: '/api/admin/fleet/live',
    permission: 'view_fleet',
    enabled: false,
  },
  {
    id: 'driver_performance',
    name: 'Sürücü Performans Paneli',
    description: 'Sürücü puanları, zamanında teslim, gelir',
    route: '/admin/drivers/performance',
    component: 'DriverPerformance',
    api: '/api/admin/drivers/stats',
    permission: 'view_driver_stats',
    enabled: false,
  },
  {
    id: 'delay_compensation',
    name: 'Otomatik Gecikme Tazminatı Onay Paneli',
    description: 'AI tarafından önerilen indirimleri onaylar/reddeder',
    route: '/admin/delay-compensation',
    component: 'DelayCompensationPanel',
    api: '/api/admin/delay/pending',
    permission: 'manage_compensation',
    enabled: false,
  },
  {
    id: 'revenue_analytics',
    name: 'Gelir & KPI Analiz Ekranı',
    description: 'Günlük/haftalık gelir, AOV, tekrar rezervasyon oranı',
    route: '/admin/analytics',
    component: 'RevenueAnalytics',
    api: '/api/admin/analytics/summary',
    permission: 'view_analytics',
    enabled: false,
  },
  {
    id: 'corporate_clients',
    name: 'Kurumsal Müşteri Yönetimi',
    description: 'Şirket ekle, sabit fiyat, aylık fatura',
    route: '/admin/corporate',
    component: 'CorporateClients',
    api: '/api/admin/corporate',
    permission: 'manage_corporate',
    enabled: false,
  },
];

try {
  await featureToggleService.initializeFeatures(defaultFeatures);
  logger.info('Feature toggles initialized successfully');
} catch (error) {
  logger.error('Failed to initialize feature toggles:', error);
}

// Initialize schedulers and services after DB connection
initCampaignScheduler();
initDynamicPricing();
initWeeklyReportScheduler();
initSitemapScheduler();

logger.info('All schedulers initialized successfully');

// Start server (PORT and HOST already defined at top of file)
const server = app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    host: HOST,
  });
  // Console output for Render deployment logs - critical for deployment verification
  console.log('\n=== SERVER STARTED SUCCESSFULLY ===');
  console.log(`✓ Server listening on http://${HOST}:${PORT}`);
  console.log(`✓ Health check endpoints: /health and /api/health`);
  console.log(`✓ Port ${PORT} bound successfully`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('===================================\n');
});

// Graceful shutdown handler
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        logger.info('MongoDB connection closed');
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', { error: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', { error: err.message, stack: err.stack });
  trackError(err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', { reason, promise });
  if (reason instanceof Error) {
    trackError(reason);
  }
});

export default app;
