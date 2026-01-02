/**
 * Queue-Enhanced Email Service
 * 
 * Provides both synchronous and asynchronous email sending capabilities
 */

import logger from '../config/logger.mjs';
import { addEmailJob } from './queueService.mjs';
import {
  sendEmail as syncSendEmail,
  sendBookingConfirmation as syncSendBookingConfirmation,
  sendPaymentConfirmation as syncSendPaymentConfirmation,
  sendCampaignNotification as syncSendCampaignNotification,
  shouldSendNotification,
} from './emailService.mjs';

/**
 * Send email asynchronously via queue
 */
export const sendEmailAsync = async (emailData, options = {}) => {
  try {
    const job = await addEmailJob('send-email', emailData, options);
    return {
      success: true,
      jobId: job.id,
      message: 'Email queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue email, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous send
    return await syncSendEmail(emailData);
  }
};

/**
 * Send booking confirmation asynchronously
 */
export const sendBookingConfirmationAsync = async (booking, user, options = {}) => {
  try {
    const job = await addEmailJob(
      'booking-confirmation',
      { booking, user },
      options
    );
    return {
      success: true,
      jobId: job.id,
      message: 'Booking confirmation email queued',
    };
  } catch (error) {
    logger.warn('Failed to queue booking confirmation, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous send
    return await syncSendBookingConfirmation(booking, user);
  }
};

/**
 * Send payment confirmation asynchronously
 */
export const sendPaymentConfirmationAsync = async (booking, user, amount, options = {}) => {
  try {
    const job = await addEmailJob(
      'payment-confirmation',
      { booking, user, amount },
      options
    );
    return {
      success: true,
      jobId: job.id,
      message: 'Payment confirmation email queued',
    };
  } catch (error) {
    logger.warn('Failed to queue payment confirmation, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous send
    return await syncSendPaymentConfirmation(booking, user, amount);
  }
};

/**
 * Send campaign notification asynchronously
 */
export const sendCampaignNotificationAsync = async (user, campaign, options = {}) => {
  try {
    const job = await addEmailJob(
      'campaign-notification',
      { user, campaign },
      options
    );
    return {
      success: true,
      jobId: job.id,
      message: 'Campaign notification queued',
    };
  } catch (error) {
    logger.warn('Failed to queue campaign notification, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous send
    return await syncSendCampaignNotification(user, campaign);
  }
};

/**
 * Bulk send campaign notifications (always async)
 */
export const sendBulkCampaignNotifications = async (users, campaign, options = {}) => {
  const jobs = [];
  const errors = [];

  for (const user of users) {
    try {
      const job = await addEmailJob(
        'campaign-notification',
        { user, campaign },
        {
          ...options,
          // Stagger emails to avoid rate limits
          delay: jobs.length * 1000, // 1 second between emails
        }
      );
      jobs.push({ userId: user._id, jobId: job.id });
    } catch (error) {
      logger.error('Failed to queue bulk email', {
        userId: user._id,
        error: error.message,
      });
      errors.push({ userId: user._id, error: error.message });
    }
  }

  return {
    success: true,
    queued: jobs.length,
    failed: errors.length,
    jobs,
    errors,
  };
};

// Re-export synchronous functions for backward compatibility
export {
  syncSendEmail as sendEmail,
  syncSendBookingConfirmation as sendBookingConfirmation,
  syncSendPaymentConfirmation as sendPaymentConfirmation,
  syncSendCampaignNotification as sendCampaignNotification,
  shouldSendNotification,
};

export default {
  sendEmailAsync,
  sendBookingConfirmationAsync,
  sendPaymentConfirmationAsync,
  sendCampaignNotificationAsync,
  sendBulkCampaignNotifications,
  // Synchronous exports
  sendEmail: syncSendEmail,
  sendBookingConfirmation: syncSendBookingConfirmation,
  sendPaymentConfirmation: syncSendPaymentConfirmation,
  sendCampaignNotification: syncSendCampaignNotification,
  shouldSendNotification,
};
