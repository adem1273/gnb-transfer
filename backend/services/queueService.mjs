/**
 * Queue Service
 * 
 * Provides high-level interface for adding jobs to queues
 */

import logger from '../config/logger.mjs';
import { getQueue } from '../config/queues.mjs';

/**
 * Add export job to queue
 */
export const addExportJob = async (type, data, options = {}) => {
  const queue = getQueue('export');
  
  if (!queue) {
    logger.warn('Export queue not available, falling back to synchronous execution');
    throw new Error('Queue not available');
  }

  try {
    const job = await queue.add(
      type,
      { type, ...data },
      {
        priority: options.priority || 5,
        attempts: options.attempts || 2,
        ...options,
      }
    );

    logger.info(`Export job ${job.id} added to queue`, { type });
    return job;
  } catch (error) {
    logger.error('Failed to add export job to queue', {
      type,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Add email job to queue
 */
export const addEmailJob = async (type, data, options = {}) => {
  const queue = getQueue('email');
  
  if (!queue) {
    logger.warn('Email queue not available, falling back to synchronous execution');
    throw new Error('Queue not available');
  }

  try {
    const job = await queue.add(
      type,
      { type, data },
      {
        priority: options.priority || 3,
        attempts: options.attempts || 5,
        delay: options.delay || 0,
        ...options,
      }
    );

    logger.info(`Email job ${job.id} added to queue`, { type });
    return job;
  } catch (error) {
    logger.error('Failed to add email job to queue', {
      type,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Add AI job to queue
 */
export const addAIJob = async (type, data, options = {}) => {
  const queue = getQueue('ai');
  
  if (!queue) {
    logger.warn('AI queue not available, falling back to synchronous execution');
    throw new Error('Queue not available');
  }

  try {
    const job = await queue.add(
      type,
      { type, data },
      {
        priority: options.priority || 7,
        attempts: options.attempts || 3,
        timeout: options.timeout || 60000,
        ...options,
      }
    );

    logger.info(`AI job ${job.id} added to queue`, { type });
    return job;
  } catch (error) {
    logger.error('Failed to add AI job to queue', {
      type,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Add scheduled job to queue
 */
export const addScheduledJob = async (type, data, options = {}) => {
  const queue = getQueue('scheduled');
  
  if (!queue) {
    logger.warn('Scheduled queue not available');
    throw new Error('Queue not available');
  }

  try {
    const job = await queue.add(
      type,
      { type, data },
      {
        priority: options.priority || 5,
        attempts: options.attempts || 3,
        repeat: options.repeat,
        ...options,
      }
    );

    logger.info(`Scheduled job ${job.id} added to queue`, { type });
    return job;
  } catch (error) {
    logger.error('Failed to add scheduled job to queue', {
      type,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get job by ID from any queue
 */
export const getJob = async (queueName, jobId) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  return await queue.getJob(jobId);
};

/**
 * Get job state
 */
export const getJobState = async (queueName, jobId) => {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    return null;
  }

  return await job.getState();
};

/**
 * Retry a failed job
 */
export const retryJob = async (queueName, jobId) => {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found in queue ${queueName}`);
  }

  await job.retry();
  logger.info(`Job ${jobId} retried in queue ${queueName}`);
  return job;
};

/**
 * Remove a job
 */
export const removeJob = async (queueName, jobId) => {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found in queue ${queueName}`);
  }

  await job.remove();
  logger.info(`Job ${jobId} removed from queue ${queueName}`);
};

/**
 * Get jobs by state
 */
export const getJobsByState = async (queueName, state, start = 0, end = 10) => {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const validStates = ['waiting', 'active', 'completed', 'failed', 'delayed'];
  if (!validStates.includes(state)) {
    throw new Error(`Invalid state: ${state}`);
  }

  return await queue.getJobs([state], start, end);
};

export default {
  addExportJob,
  addEmailJob,
  addAIJob,
  addScheduledJob,
  getJob,
  getJobState,
  retryJob,
  removeJob,
  getJobsByState,
};
