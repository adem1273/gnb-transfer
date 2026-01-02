/**
 * BullMQ Queue Configuration
 * 
 * Provides centralized queue configuration and management using BullMQ and Redis.
 * 
 * Features:
 * - Multiple specialized queues (export, email, AI, scheduled)
 * - Automatic retry logic with exponential backoff
 * - Job progress tracking
 * - Error handling and logging
 * - Queue health monitoring
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisClient, isRedisConnected } from './redis.mjs';
import logger from './logger.mjs';

// Queue instances
let exportQueue = null;
let emailQueue = null;
let aiQueue = null;
let scheduledQueue = null;

// Queue events for monitoring
let exportQueueEvents = null;
let emailQueueEvents = null;
let aiQueueEvents = null;
let scheduledQueueEvents = null;

/**
 * Get Redis connection configuration for BullMQ
 * BullMQ requires ioredis-compatible configuration
 */
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('REDIS_URL not configured. Queues will not be initialized.');
    return null;
  }

  // Parse Redis URL for BullMQ connection
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1), 10) : 0,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    };
  } catch (error) {
    logger.error('Failed to parse REDIS_URL for BullMQ', { error: error.message });
    return null;
  }
};

/**
 * Default queue options
 */
const getDefaultQueueOptions = () => ({
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      count: 5000, // Keep max 5000 failed jobs
    },
  },
});

/**
 * Initialize all queues
 */
export const initializeQueues = () => {
  const connection = getRedisConnection();
  
  if (!connection) {
    logger.warn('Queues not initialized - Redis connection not available');
    return {
      exportQueue: null,
      emailQueue: null,
      aiQueue: null,
      scheduledQueue: null,
    };
  }

  try {
    const baseOptions = getDefaultQueueOptions();

    // Export Queue - For CSV/PDF exports
    exportQueue = new Queue('export', {
      ...baseOptions,
      defaultJobOptions: {
        ...baseOptions.defaultJobOptions,
        attempts: 2, // Fewer retries for exports
        priority: 5, // Medium priority
      },
    });

    // Email Queue - For sending notifications
    emailQueue = new Queue('email', {
      ...baseOptions,
      defaultJobOptions: {
        ...baseOptions.defaultJobOptions,
        attempts: 5, // More retries for critical notifications
        priority: 3, // Higher priority
        backoff: {
          type: 'exponential',
          delay: 1000, // Faster retry for emails
        },
      },
    });

    // AI Queue - For OpenAI API calls
    aiQueue = new Queue('ai', {
      ...baseOptions,
      defaultJobOptions: {
        ...baseOptions.defaultJobOptions,
        attempts: 3,
        priority: 7, // Lower priority (can take longer)
        timeout: 60000, // 60 second timeout for AI tasks
      },
    });

    // Scheduled Queue - For recurring/scheduled jobs
    scheduledQueue = new Queue('scheduled', {
      ...baseOptions,
      defaultJobOptions: {
        ...baseOptions.defaultJobOptions,
        attempts: 3,
        priority: 5,
      },
    });

    // Initialize queue events for monitoring
    exportQueueEvents = new QueueEvents('export', { connection });
    emailQueueEvents = new QueueEvents('email', { connection });
    aiQueueEvents = new QueueEvents('ai', { connection });
    scheduledQueueEvents = new QueueEvents('scheduled', { connection });

    // Setup event listeners
    setupQueueEventListeners('export', exportQueueEvents);
    setupQueueEventListeners('email', emailQueueEvents);
    setupQueueEventListeners('ai', aiQueueEvents);
    setupQueueEventListeners('scheduled', scheduledQueueEvents);

    logger.info('BullMQ queues initialized successfully', {
      queues: ['export', 'email', 'ai', 'scheduled'],
    });

    return {
      exportQueue,
      emailQueue,
      aiQueue,
      scheduledQueue,
    };
  } catch (error) {
    logger.error('Failed to initialize BullMQ queues', {
      error: error.message,
      stack: error.stack,
    });
    return {
      exportQueue: null,
      emailQueue: null,
      aiQueue: null,
      scheduledQueue: null,
    };
  }
};

/**
 * Setup event listeners for queue monitoring
 */
const setupQueueEventListeners = (queueName, queueEvents) => {
  queueEvents.on('completed', ({ jobId }) => {
    logger.debug(`Job ${jobId} completed in queue ${queueName}`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed in queue ${queueName}`, {
      reason: failedReason,
    });
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    logger.debug(`Job ${jobId} progress in queue ${queueName}`, { progress: data });
  });

  queueEvents.on('stalled', ({ jobId }) => {
    logger.warn(`Job ${jobId} stalled in queue ${queueName}`);
  });
};

/**
 * Get queue instance by name
 */
export const getQueue = (queueName) => {
  const queues = {
    export: exportQueue,
    email: emailQueue,
    ai: aiQueue,
    scheduled: scheduledQueue,
  };
  return queues[queueName] || null;
};

/**
 * Get all queue instances
 */
export const getAllQueues = () => ({
  exportQueue,
  emailQueue,
  aiQueue,
  scheduledQueue,
});

/**
 * Get queue statistics
 */
export const getQueueStats = async (queueName) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    return null;
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error(`Failed to get stats for queue ${queueName}`, {
      error: error.message,
    });
    return null;
  }
};

/**
 * Get statistics for all queues
 */
export const getAllQueueStats = async () => {
  const queueNames = ['export', 'email', 'ai', 'scheduled'];
  const stats = await Promise.all(
    queueNames.map((name) => getQueueStats(name))
  );
  
  return stats.filter(Boolean);
};

/**
 * Pause a queue
 */
export const pauseQueue = async (queueName) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  await queue.pause();
  logger.info(`Queue ${queueName} paused`);
};

/**
 * Resume a queue
 */
export const resumeQueue = async (queueName) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  await queue.resume();
  logger.info(`Queue ${queueName} resumed`);
};

/**
 * Clean completed jobs from a queue
 */
export const cleanQueue = async (queueName, grace = 24 * 3600 * 1000) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const cleaned = await queue.clean(grace, 1000, 'completed');
  logger.info(`Cleaned ${cleaned.length} completed jobs from queue ${queueName}`);
  return cleaned.length;
};

/**
 * Drain a queue (remove all jobs)
 */
export const drainQueue = async (queueName) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  await queue.drain();
  logger.info(`Queue ${queueName} drained`);
};

/**
 * Close all queue connections
 */
export const closeQueues = async () => {
  const queues = [exportQueue, emailQueue, aiQueue, scheduledQueue];
  const queueEvents = [
    exportQueueEvents,
    emailQueueEvents,
    aiQueueEvents,
    scheduledQueueEvents,
  ];

  try {
    // Close all queues
    await Promise.all(
      queues.filter(Boolean).map((queue) => queue.close())
    );

    // Close all queue events
    await Promise.all(
      queueEvents.filter(Boolean).map((events) => events.close())
    );

    logger.info('All queues closed successfully');
  } catch (error) {
    logger.error('Error closing queues', { error: error.message });
  }
};

export default {
  initializeQueues,
  getQueue,
  getAllQueues,
  getQueueStats,
  getAllQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  drainQueue,
  closeQueues,
};
