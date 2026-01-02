/**
 * Export Queue Worker
 * 
 * Handles background processing of CSV and PDF exports
 */

import { Worker } from 'bullmq';
import logger from '../config/logger.mjs';
import {
  exportBookingsCSV,
  exportUsersCSV,
  exportRevenueCSV,
  generateRevenuePDF,
  generateBookingsPDF,
} from '../services/exportService.mjs';
import {
  queueJobsProcessed,
  queueJobDuration,
} from '../services/metricsService.mjs';

/**
 * Process export jobs
 */
const processExportJob = async (job) => {
  const { type, filters, startDate, endDate } = job.data;
  const startTime = Date.now();
  
  logger.info(`Processing export job ${job.id}`, { type, filters });

  try {
    let result;

    // Update progress
    await job.updateProgress(10);

    switch (type) {
      case 'bookings-csv':
        result = await exportBookingsCSV(filters);
        await job.updateProgress(100);
        return { success: true, data: result, format: 'csv' };

      case 'users-csv':
        result = await exportUsersCSV(filters);
        await job.updateProgress(100);
        return { success: true, data: result, format: 'csv' };

      case 'revenue-csv':
        result = await exportRevenueCSV(startDate, endDate);
        await job.updateProgress(100);
        return { success: true, data: result, format: 'csv' };

      case 'revenue-pdf':
        await job.updateProgress(30);
        result = await generateRevenuePDF(startDate, endDate);
        await job.updateProgress(100);
        return { success: true, data: result, format: 'pdf' };

      case 'bookings-pdf':
        await job.updateProgress(30);
        result = await generateBookingsPDF(filters);
        await job.updateProgress(100);
        return { success: true, data: result, format: 'pdf' };

      default:
        throw new Error(`Unknown export type: ${type}`);
    }
  } catch (error) {
    logger.error(`Export job ${job.id} failed`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    // Record job duration metric
    const duration = (Date.now() - startTime) / 1000;
    queueJobDuration.labels('export', type).observe(duration);
  }
};

/**
 * Create and start export worker
 */
export const createExportWorker = (connection) => {
  const worker = new Worker('export', processExportJob, {
    connection,
    concurrency: parseInt(process.env.EXPORT_WORKER_CONCURRENCY || '2', 10),
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  });

  worker.on('completed', (job, result) => {
    logger.info(`Export job ${job.id} completed`, {
      type: job.data.type,
      duration: Date.now() - job.timestamp,
    });
    // Record completed job metric
    queueJobsProcessed.labels('export', 'completed').inc();
  });

  worker.on('failed', (job, error) => {
    logger.error(`Export job ${job.id} failed`, {
      type: job.data?.type,
      error: error.message,
      attempts: job.attemptsMade,
    });
    // Record failed job metric
    queueJobsProcessed.labels('export', 'failed').inc();
  });

  worker.on('error', (error) => {
    logger.error('Export worker error', { error: error.message });
  });

  logger.info('Export worker started');
  return worker;
};

export default createExportWorker;
