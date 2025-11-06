/**
 * ES Module Express Server with Security Best Practices
 * Phase 1: Core architecture with helmet, CORS, rate limiting, and JWT verification
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { responseMiddleware } from './middlewares/response.mjs';
import { rateLimiter } from './middlewares/rateLimiter.mjs';
import { globalRateLimiter } from './middlewares/rateLimiter.mjs';
import { responseMiddleware } from './middlewares/response.mjs';

// Import routes
import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimiter);

// Body parser middleware
app.use(express.json());

// Response middleware for standardized responses
app.use(responseMiddleware);

// Routes

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
app.use(globalRateLimiter);

// Unified response middleware
app.use(responseMiddleware);

// Route registration
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.apiSuccess({ status: 'ok' }, 'Server is running');
});

// MongoDB connection with error handling
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  
  if (!MONGO_URI) {
    console.warn('⚠️  WARNING: MONGO_URI is not set. Skipping database connection.');
    console.warn('⚠️  Set MONGO_URI environment variable to connect to MongoDB.');
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

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Using default value "changeme".');
    console.warn('⚠️  Set JWT_SECRET environment variable for production.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

export default app;
