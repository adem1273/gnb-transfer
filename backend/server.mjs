import dotenv from 'dotenv';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { responseMiddleware } from './middlewares/response.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';
import { errorHandler } from './middlewares/errorHandler.mjs';

import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';

dotenv.config();
// AI features disabled for Phase 1 - no AI implementation in this phase
// import delayRoutes from './routes/delayRoutes.mjs';
// import packageRoutes from './routes/packageRoutes.mjs';

const app = express();

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

// Rate limiting & standardized responses
app.use(globalRateLimiter);
app.use(responseMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
// AI features disabled for Phase 1
// app.use('/api/delay', delayRoutes);
// app.use('/api/packages', packageRoutes);

// Health check (registered before listen)
app.get('/health', (req, res) => {
  res.apiSuccess({ status: 'ok' }, 'Server is running');
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

// Database connect
const MONGO_URI = process.env.MONGO_URI || '';

const connectDB = async () => {
  if (!MONGO_URI) {
    console.warn('⚠️  WARNING: MONGO_URI is not set. Skipping database connection.');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected successfully');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    console.error('⚠️  Server will continue without database connection.');
  }
};

// Safety: in production require JWT_SECRET
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('✗ JWT_SECRET must be set in production. Aborting start.');
  process.exit(1);
}

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Set JWT_SECRET for secure authentication.');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server gracefully...');
  try {
    await mongoose.disconnect();
  } catch (err) {
    // ignore
  }
  process.exit(0);
});

export default app;
