/**
 * ES Module Express Server (cleaned)
 * - Single responsibility imports
 * - Single connectDB implementation
 * - Production safety checks for JWT_SECRET
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

import { responseMiddleware } from './middlewares/response.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';

import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';
import delayRoutes from './routes/delayRoutes.mjs';

const app = express();

// Security & parsers
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting & standardized responses
app.use(globalRateLimiter);
app.use(responseMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/delay', delayRoutes);

// Health check (registered before listen)
app.get('/health', (req, res) => {
  res.apiSuccess({ status: 'ok' }, 'Server is running');
});

// Database connect
const MONGO_URI = process.env.MONGO_URI || '';

const connectDB = async () => {
  if (!MONGO_URI) {
    console.warn('⚠️  WARNING: MONGO_URI is not set. Skipping database connection.');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
