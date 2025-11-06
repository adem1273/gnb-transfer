import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import responseMiddleware from './middlewares/response.mjs';
import { requireAuth } from './middlewares/auth.mjs';
import limiter from './middlewares/rateLimiter.mjs';

import userRoutes from './routes/userRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import bookingRoutes from './routes/bookingRoutes.mjs';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);
app.use(responseMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI not set. Skipping DB connection (use env in production).');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
