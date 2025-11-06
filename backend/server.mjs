import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { responseMiddleware } from './middlewares/response.mjs';
import { rateLimiter } from './middlewares/rateLimiter.mjs';

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
