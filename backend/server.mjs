import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import logger from './config/logger.mjs';
import { initSentry } from './config/sentry.mjs';
import { getCorsOptions, validateCorsConfig } from './config/cors.mjs';
import { responseMiddleware } from './middlewares/response.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';
import { errorHandler } from './middlewares/errorHandler.mjs';
import { getCacheStats } from './middlewares/cache.mjs';
import { requestLogger, errorLogger } from './middlewares/logging.mjs';
import { requestIdMiddleware } from './middlewares/requestId.mjs';
import { getMetrics, getPrometheusMetrics, trackError } from './middlewares/metrics.mjs';

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

// Initialize schedulers and services
import { initCampaignScheduler } from './services/campaignScheduler.mjs';
import { initDynamicPricing } from './services/dynamicPricingService.mjs';
import { initWeeklyReportScheduler } from './services/weeklyReportService.mjs';
import { initSitemapScheduler } from './services/sitemapService.mjs';

dotenv.config();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Routes
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

// Feature toggle routes
app.use('/api/admin/features', featureToggleRoutes);

// New feature routes (protected by feature toggles)
app.use('/api/admin/fleet', fleetRoutes);
app.use('/api/admin/drivers', driverStatsRoutes);
app.use('/api/admin/delay', delayCompensationRoutes);
app.use('/api/admin/analytics', revenueAnalyticsRoutes);
app.use('/api/admin/corporate', corporateRoutes);

// Health check endpoint (registered before other routes)
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][
        mongoose.connection.readyState
      ],
    },
    cache: getCacheStats(),
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100, // MB
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100, // MB
    },
  };

  return res.apiSuccess(healthStatus, 'Server is healthy');
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

// Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(getPrometheusMetrics());
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

const connectDB = async () => {
  if (!MONGO_URI) {
    logger.warn('MONGO_URI is not set. Skipping database connection.');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection failed:', { error: err.message });
    logger.warn('Server will continue without database connection.');
  }
};

// Safety: in production require JWT_SECRET
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is required in production!');
    process.exit(1);
  } else {
    logger.warn('WARNING: JWT_SECRET not set. Authentication will not work!');
  }
}

await connectDB();

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
  
  if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET not set. Set JWT_SECRET for secure authentication.');
  }
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
