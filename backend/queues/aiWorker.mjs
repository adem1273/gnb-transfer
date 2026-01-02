/**
 * AI Queue Worker
 * 
 * Handles background processing of AI/OpenAI tasks
 */

import { Worker } from 'bullmq';
import logger from '../config/logger.mjs';
import { generatePackageRecommendations, calculateDelayRisk } from '../services/aiService.mjs';
import { generateBatchInsights } from '../services/aiBatchService.mjs';

/**
 * Process AI jobs
 */
const processAIJob = async (job) => {
  const { type, data } = job.data;
  
  logger.info(`Processing AI job ${job.id}`, { type });

  try {
    await job.updateProgress(10);
    let result;

    switch (type) {
      case 'package-recommendations':
        await job.updateProgress(30);
        result = await generatePackageRecommendations(data.userId, data.options);
        await job.updateProgress(100);
        break;

      case 'delay-risk':
        await job.updateProgress(30);
        result = await calculateDelayRisk(data);
        await job.updateProgress(100);
        break;

      case 'batch-insights':
        await job.updateProgress(20);
        result = await generateBatchInsights(data.bookings);
        await job.updateProgress(100);
        break;

      default:
        throw new Error(`Unknown AI task type: ${type}`);
    }

    return { success: true, result };
  } catch (error) {
    logger.error(`AI job ${job.id} failed`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Create and start AI worker
 */
export const createAIWorker = (connection) => {
  const worker = new Worker('ai', processAIJob, {
    connection,
    concurrency: parseInt(process.env.AI_WORKER_CONCURRENCY || '3', 10),
    limiter: {
      max: 20, // Max 20 AI tasks
      duration: 60000, // Per minute
    },
  });

  worker.on('completed', (job, result) => {
    logger.info(`AI job ${job.id} completed`, {
      type: job.data.type,
      duration: Date.now() - job.timestamp,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error(`AI job ${job.id} failed`, {
      type: job.data?.type,
      error: error.message,
      attempts: job.attemptsMade,
    });
  });

  worker.on('error', (error) => {
    logger.error('AI worker error', { error: error.message });
  });

  logger.info('AI worker started');
  return worker;
};

export default createAIWorker;
