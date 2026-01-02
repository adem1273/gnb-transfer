/**
 * Scheduled Queue Worker
 * 
 * Handles background processing of recurring/scheduled jobs
 */

import { Worker } from 'bullmq';
import logger from '../config/logger.mjs';
import { processCampaigns } from '../services/campaignScheduler.mjs';
import { updateDynamicPricing } from '../services/dynamicPricingService.mjs';
import { generateWeeklyReport } from '../services/weeklyReportService.mjs';
import { updateSitemap } from '../services/sitemapService.mjs';

/**
 * Process scheduled jobs
 */
const processScheduledJob = async (job) => {
  const { type, data } = job.data;
  
  logger.info(`Processing scheduled job ${job.id}`, { type });

  try {
    await job.updateProgress(10);
    let result;

    switch (type) {
      case 'process-campaigns':
        await job.updateProgress(30);
        result = await processCampaigns();
        await job.updateProgress(100);
        break;

      case 'update-dynamic-pricing':
        await job.updateProgress(30);
        result = await updateDynamicPricing();
        await job.updateProgress(100);
        break;

      case 'generate-weekly-report':
        await job.updateProgress(30);
        result = await generateWeeklyReport();
        await job.updateProgress(100);
        break;

      case 'update-sitemap':
        await job.updateProgress(30);
        result = await updateSitemap();
        await job.updateProgress(100);
        break;

      default:
        throw new Error(`Unknown scheduled task type: ${type}`);
    }

    return { success: true, result };
  } catch (error) {
    logger.error(`Scheduled job ${job.id} failed`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Create and start scheduled worker
 */
export const createScheduledWorker = (connection) => {
  const worker = new Worker('scheduled', processScheduledJob, {
    connection,
    concurrency: parseInt(process.env.SCHEDULED_WORKER_CONCURRENCY || '2', 10),
  });

  worker.on('completed', (job, result) => {
    logger.info(`Scheduled job ${job.id} completed`, {
      type: job.data.type,
      duration: Date.now() - job.timestamp,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error(`Scheduled job ${job.id} failed`, {
      type: job.data?.type,
      error: error.message,
      attempts: job.attemptsMade,
    });
  });

  worker.on('error', (error) => {
    logger.error('Scheduled worker error', { error: error.message });
  });

  logger.info('Scheduled worker started');
  return worker;
};

export default createScheduledWorker;
