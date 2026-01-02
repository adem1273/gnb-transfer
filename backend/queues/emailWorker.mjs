/**
 * Email Queue Worker
 * 
 * Handles background processing of email notifications
 */

import { Worker } from 'bullmq';
import logger from '../config/logger.mjs';
import {
  sendEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendCampaignNotification,
} from '../services/emailService.mjs';
import {
  queueJobsProcessed,
  queueJobDuration,
} from '../services/metricsService.mjs';

/**
 * Process email jobs
 */
const processEmailJob = async (job) => {
  const { type, data } = job.data;
  const startTime = Date.now();
  
  logger.info(`Processing email job ${job.id}`, { type });

  try {
    await job.updateProgress(10);
    let result;

    switch (type) {
      case 'send-email':
        result = await sendEmail(data);
        break;

      case 'booking-confirmation':
        result = await sendBookingConfirmation(data.booking, data.user);
        break;

      case 'payment-confirmation':
        result = await sendPaymentConfirmation(data.booking, data.user, data.amount);
        break;

      case 'campaign-notification':
        result = await sendCampaignNotification(data.user, data.campaign);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    await job.updateProgress(100);

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error(`Email job ${job.id} failed`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    // Record job duration metric
    const duration = (Date.now() - startTime) / 1000;
    queueJobDuration.labels('email', type).observe(duration);
  }
};

/**
 * Create and start email worker
 */
export const createEmailWorker = (connection) => {
  const worker = new Worker('email', processEmailJob, {
    connection,
    concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5', 10),
    limiter: {
      max: 50, // Max 50 emails
      duration: 60000, // Per minute
    },
  });

  worker.on('completed', (job, result) => {
    logger.info(`Email job ${job.id} completed`, {
      type: job.data.type,
      messageId: result.messageId,
      duration: Date.now() - job.timestamp,
    });
    // Record completed job metric
    queueJobsProcessed.labels('email', 'completed').inc();
  });

  worker.on('failed', (job, error) => {
    logger.error(`Email job ${job.id} failed`, {
      type: job.data?.type,
      error: error.message,
      attempts: job.attemptsMade,
    });
    // Record failed job metric
    queueJobsProcessed.labels('email', 'failed').inc();
  });

  worker.on('error', (error) => {
    logger.error('Email worker error', { error: error.message });
  });

  logger.info('Email worker started');
  return worker;
};

export default createEmailWorker;
