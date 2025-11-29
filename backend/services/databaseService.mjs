import mongoose from 'mongoose';
import logger from '../config/logger.mjs';
import { DATABASE } from '../constants/limits.mjs';

let isConnected = false;

export const connectDB = async (retryCount = 0) => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    logger.warn('MONGO_URI not set. Skipping database connection.');
    return false;
  }

  if (isConnected) {
    logger.info('Using existing database connection');
    return true;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: DATABASE.SERVER_SELECTION_TIMEOUT_MS,
      heartbeatFrequencyMS: DATABASE.HEARTBEAT_FREQUENCY_MS,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      compressors: ['zlib'],
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(MONGO_URI, options);
    isConnected = true;
    logger.info('MongoDB connected successfully');

    setupConnectionHandlers();
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}/${DATABASE.MAX_RETRIES}):`, {
      error: error.message,
    });

    if (retryCount < DATABASE.MAX_RETRIES - 1) {
      logger.info(`Retrying in ${DATABASE.RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, DATABASE.RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    throw error;
  }
};

const setupConnectionHandlers = () => {
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', { error: err.message });
  });
};

export const disconnectDB = async () => {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
};

export const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
  name: mongoose.connection.name,
});

export default { connectDB, disconnectDB, getConnectionStatus };
