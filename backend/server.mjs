import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import logger from './config/logger.mjs';
import { initSentry } from './config/sentry.mjs';
import { responseMiddleware } from './middlewares/response.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';
import { errorHandler } from './middlewares/errorHandler.mjs';
import { getCacheStats } from './middlewares/cache.mjs';
import { requestLogger, errorLogger } from './middlewares/logging.mjs';
import { getMetrics, getPrometheusMetrics, trackError } from './middlewares/metrics.mjs';

import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';
import delayRoutes from './routes/delayRoutes.mjs';
import packageRoutes from './routes/packageRoutes.mjs';
import chatRoutes from './routes/chatRoutes.mjs';

// Initialize Sentry early
const sentryHandlers = initSentry(express());

const app = express();

// Sentry request handler must be first
if (sentryHandlers) {
  app.use(sentryHandlers.requestHandler);
  app.use(sentryHandlers.tracingHandler);
}

// Configure CORS with whitelist
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Security & parsers
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting & standardized responses
app.use(globalRateLimiter);
app.use(responseMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/delay', delayRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/chat', chatRoutes);

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
app.get('/health', async (req, res) => {
  res.apiSuccess({ status: 'ok' }, 'Server is running');
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
  } else {
    return res.status(503).json({
      success: false,
      error: 'Service not ready',
      details: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
        uptime: process.uptime(),
      },
    });
  }
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
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('JWT_SECRET must be set in production. Aborting start.');
  process.exit(1);
}

await connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
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
