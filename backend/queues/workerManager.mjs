/**
 * Worker Manager
 * 
 * Initializes and manages all BullMQ workers
 */

import logger from '../config/logger.mjs';
import { createExportWorker } from './exportWorker.mjs';
import { createEmailWorker } from './emailWorker.mjs';
import { createAIWorker } from './aiWorker.mjs';
import { createScheduledWorker } from './scheduledWorker.mjs';

let workers = {
  export: null,
  email: null,
  ai: null,
  scheduled: null,
};

/**
 * Get Redis connection configuration for workers
 */
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return null;
  }

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1), 10) : 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch (error) {
    logger.error('Failed to parse REDIS_URL for workers', { error: error.message });
    return null;
  }
};

/**
 * Initialize all workers
 */
export const initializeWorkers = () => {
  const connection = getRedisConnection();
  
  if (!connection) {
    logger.warn('Workers not initialized - Redis connection not available');
    return workers;
  }

  try {
    // Initialize all workers
    workers.export = createExportWorker(connection);
    workers.email = createEmailWorker(connection);
    workers.ai = createAIWorker(connection);
    workers.scheduled = createScheduledWorker(connection);

    logger.info('All BullMQ workers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize workers', {
      error: error.message,
      stack: error.stack,
    });
  }

  return workers;
};

/**
 * Get all workers
 */
export const getWorkers = () => workers;

/**
 * Close all workers gracefully
 */
export const closeWorkers = async () => {
  const workerList = Object.values(workers).filter(Boolean);
  
  if (workerList.length === 0) {
    logger.info('No workers to close');
    return;
  }

  try {
    await Promise.all(workerList.map((worker) => worker.close()));
    logger.info('All workers closed successfully');
    
    // Reset workers object
    workers = {
      export: null,
      email: null,
      ai: null,
      scheduled: null,
    };
  } catch (error) {
    logger.error('Error closing workers', { error: error.message });
  }
};

export default {
  initializeWorkers,
  getWorkers,
  closeWorkers,
};
