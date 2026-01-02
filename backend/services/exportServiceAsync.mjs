/**
 * Queue-Enhanced Export Service
 * 
 * Provides both synchronous and asynchronous export capabilities
 */

import logger from '../config/logger.mjs';
import { addExportJob } from './queueService.mjs';
import {
  exportBookingsCSV as syncExportBookingsCSV,
  exportUsersCSV as syncExportUsersCSV,
  exportRevenueCSV as syncExportRevenueCSV,
  generateRevenuePDF as syncGenerateRevenuePDF,
  generateBookingsPDF as syncGenerateBookingsPDF,
} from './exportService.mjs';

/**
 * Export bookings to CSV (async with queue)
 */
export const exportBookingsCSVAsync = async (filters = {}) => {
  try {
    const job = await addExportJob('bookings-csv', { filters });
    return {
      success: true,
      jobId: job.id,
      message: 'Export job queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue export job, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous execution
    const data = await syncExportBookingsCSV(filters);
    return {
      success: true,
      data,
      sync: true,
    };
  }
};

/**
 * Export users to CSV (async with queue)
 */
export const exportUsersCSVAsync = async (filters = {}) => {
  try {
    const job = await addExportJob('users-csv', { filters });
    return {
      success: true,
      jobId: job.id,
      message: 'Export job queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue export job, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous execution
    const data = await syncExportUsersCSV(filters);
    return {
      success: true,
      data,
      sync: true,
    };
  }
};

/**
 * Export revenue to CSV (async with queue)
 */
export const exportRevenueCSVAsync = async (startDate, endDate) => {
  try {
    const job = await addExportJob('revenue-csv', { startDate, endDate });
    return {
      success: true,
      jobId: job.id,
      message: 'Export job queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue export job, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous execution
    const data = await syncExportRevenueCSV(startDate, endDate);
    return {
      success: true,
      data,
      sync: true,
    };
  }
};

/**
 * Generate revenue PDF (async with queue)
 */
export const generateRevenuePDFAsync = async (startDate, endDate) => {
  try {
    const job = await addExportJob('revenue-pdf', { startDate, endDate });
    return {
      success: true,
      jobId: job.id,
      message: 'PDF generation job queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue PDF job, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous execution
    const data = await syncGenerateRevenuePDF(startDate, endDate);
    return {
      success: true,
      data,
      sync: true,
    };
  }
};

/**
 * Generate bookings PDF (async with queue)
 */
export const generateBookingsPDFAsync = async (filters = {}) => {
  try {
    const job = await addExportJob('bookings-pdf', { filters });
    return {
      success: true,
      jobId: job.id,
      message: 'PDF generation job queued successfully',
    };
  } catch (error) {
    logger.warn('Failed to queue PDF job, falling back to sync', {
      error: error.message,
    });
    // Fallback to synchronous execution
    const data = await syncGenerateBookingsPDF(filters);
    return {
      success: true,
      data,
      sync: true,
    };
  }
};

// Re-export synchronous functions for backward compatibility
export {
  syncExportBookingsCSV as exportBookingsCSV,
  syncExportUsersCSV as exportUsersCSV,
  syncExportRevenueCSV as exportRevenueCSV,
  syncGenerateRevenuePDF as generateRevenuePDF,
  syncGenerateBookingsPDF as generateBookingsPDF,
};

export default {
  exportBookingsCSVAsync,
  exportUsersCSVAsync,
  exportRevenueCSVAsync,
  generateRevenuePDFAsync,
  generateBookingsPDFAsync,
  // Synchronous exports
  exportBookingsCSV: syncExportBookingsCSV,
  exportUsersCSV: syncExportUsersCSV,
  exportRevenueCSV: syncExportRevenueCSV,
  generateRevenuePDF: syncGenerateRevenuePDF,
  generateBookingsPDF: syncGenerateBookingsPDF,
};
