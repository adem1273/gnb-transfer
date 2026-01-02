/**
 * Queue Service Tests
 * 
 * Tests for BullMQ queue functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initializeQueues, closeQueues, getQueue, getAllQueueStats } from '../config/queues.mjs';
import {
  addExportJob,
  addEmailJob,
  addAIJob,
  addScheduledJob,
  getJob,
  getJobState,
  retryJob,
  removeJob,
  getJobsByState,
} from '../services/queueService.mjs';

describe('Queue Service', () => {
  let queues;

  beforeAll(async () => {
    // Skip tests if Redis is not configured
    if (!process.env.REDIS_URL) {
      console.log('Skipping queue tests - REDIS_URL not configured');
      return;
    }

    queues = initializeQueues();
  });

  afterAll(async () => {
    if (queues && queues.exportQueue) {
      await closeQueues();
    }
  });

  beforeEach(async () => {
    // Skip if Redis not configured
    if (!process.env.REDIS_URL) {
      return;
    }

    // Clean queues before each test
    const queueNames = ['export', 'email', 'ai', 'scheduled'];
    for (const queueName of queueNames) {
      const queue = getQueue(queueName);
      if (queue) {
        await queue.drain();
      }
    }
  });

  describe('Queue Initialization', () => {
    it('should initialize all queues', () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      expect(queues).toBeDefined();
      expect(queues.exportQueue).toBeDefined();
      expect(queues.emailQueue).toBeDefined();
      expect(queues.aiQueue).toBeDefined();
      expect(queues.scheduledQueue).toBeDefined();
    });

    it('should get queue by name', () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const exportQueue = getQueue('export');
      expect(exportQueue).toBeDefined();
      expect(exportQueue.name).toBe('export');
    });

    it('should return null for non-existent queue', () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const nonExistentQueue = getQueue('nonexistent');
      expect(nonExistentQueue).toBeNull();
    });
  });

  describe('Export Queue', () => {
    it('should add export job to queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addExportJob('bookings-csv', {
        filters: { status: 'confirmed' },
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data.type).toBe('bookings-csv');
    });

    it('should get export job by ID', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const addedJob = await addExportJob('users-csv', {
        filters: {},
      });

      const retrievedJob = await getJob('export', addedJob.id);
      expect(retrievedJob).toBeDefined();
      expect(retrievedJob.id).toBe(addedJob.id);
      expect(retrievedJob.data.type).toBe('users-csv');
    });

    it('should get export job state', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addExportJob('revenue-csv', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const state = await getJobState('export', job.id);
      expect(state).toBeDefined();
      expect(['waiting', 'delayed', 'active']).toContain(state);
    });

    it('should remove export job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addExportJob('bookings-pdf', {
        filters: {},
      });

      await removeJob('export', job.id);

      const removedJob = await getJob('export', job.id);
      expect(removedJob).toBeNull();
    });
  });

  describe('Email Queue', () => {
    it('should add email job to queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addEmailJob('send-email', {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data.type).toBe('send-email');
    });

    it('should add booking confirmation email job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addEmailJob('booking-confirmation', {
        booking: { _id: 'booking123', status: 'confirmed' },
        user: { email: 'user@example.com', name: 'Test User' },
      });

      expect(job).toBeDefined();
      expect(job.data.type).toBe('booking-confirmation');
    });

    it('should add email job with delay', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addEmailJob(
        'send-email',
        {
          to: 'delayed@example.com',
          subject: 'Delayed Email',
          html: '<p>Delayed content</p>',
        },
        {
          delay: 5000, // 5 seconds
        }
      );

      expect(job).toBeDefined();
      const state = await getJobState('email', job.id);
      expect(state).toBe('delayed');
    });
  });

  describe('AI Queue', () => {
    it('should add AI job to queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addAIJob('package-recommendations', {
        userId: 'user123',
        options: { language: 'en' },
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data.type).toBe('package-recommendations');
    });

    it('should add delay risk calculation job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addAIJob('delay-risk', {
        origin: 'Istanbul',
        destination: 'Ankara',
        scheduledTime: new Date(),
      });

      expect(job).toBeDefined();
      expect(job.data.type).toBe('delay-risk');
    });
  });

  describe('Scheduled Queue', () => {
    it('should add scheduled job to queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addScheduledJob('process-campaigns', {});

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data.type).toBe('process-campaigns');
    });

    it('should add recurring scheduled job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addScheduledJob(
        'update-sitemap',
        {},
        {
          repeat: {
            pattern: '0 0 * * *', // Daily at midnight
          },
        }
      );

      expect(job).toBeDefined();
      expect(job.opts.repeat).toBeDefined();
      expect(job.opts.repeat.pattern).toBe('0 0 * * *');

      // Clean up repeatable job
      const queue = getQueue('scheduled');
      await queue.removeRepeatable('update-sitemap', {
        pattern: '0 0 * * *',
      });
    });
  });

  describe('Queue Statistics', () => {
    it('should get statistics for all queues', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add some jobs
      await addExportJob('bookings-csv', { filters: {} });
      await addEmailJob('send-email', {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      const stats = await getAllQueueStats();

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);

      stats.forEach((queueStats) => {
        expect(queueStats.name).toBeDefined();
        expect(typeof queueStats.waiting).toBe('number');
        expect(typeof queueStats.active).toBe('number');
        expect(typeof queueStats.completed).toBe('number');
        expect(typeof queueStats.failed).toBe('number');
      });
    });
  });

  describe('Job Operations', () => {
    it('should get jobs by state', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add multiple jobs
      await addExportJob('bookings-csv', { filters: {} });
      await addExportJob('users-csv', { filters: {} });
      await addExportJob('revenue-csv', { startDate: new Date(), endDate: new Date() });

      const waitingJobs = await getJobsByState('export', 'waiting', 0, 10);

      expect(waitingJobs).toBeDefined();
      expect(Array.isArray(waitingJobs)).toBe(true);
      expect(waitingJobs.length).toBeGreaterThan(0);
    });

    it('should handle non-existent job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await getJob('export', 'nonexistent-job-id');
      expect(job).toBeUndefined();
    });

    it('should throw error when retrying non-existent job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      await expect(retryJob('export', 'nonexistent-job-id')).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle queue not available gracefully', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Try to get job from non-existent queue
      await expect(getJob('nonexistent', 'job123')).rejects.toThrow('Queue nonexistent not found');
    });

    it('should throw error on invalid state in getJobsByState', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      await expect(getJobsByState('export', 'invalid-state', 0, 10)).rejects.toThrow(
        'Invalid state'
      );
    });
  });
});
