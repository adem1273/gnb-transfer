/**
 * Job Queue Routes Integration Tests
 * 
 * Tests for job queue management API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { initializeQueues, closeQueues, getQueue } from '../config/queues.mjs';
import { addExportJob, addEmailJob } from '../services/queueService.mjs';
import jobQueueRoutes from '../routes/jobQueueRoutes.mjs';
import { responseMiddleware } from '../middlewares/response.mjs';

// Mock auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    _id: 'test-user-id',
    email: 'admin@test.com',
    role: 'superadmin',
    isAdmin: true,
  };
  next();
};

describe('Job Queue Routes', () => {
  let app;
  let queues;

  beforeAll(async () => {
    // Skip tests if Redis is not configured
    if (!process.env.REDIS_URL) {
      console.log('Skipping job queue route tests - REDIS_URL not configured');
      return;
    }

    // Initialize queues
    queues = initializeQueues();

    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use(mockAuthMiddleware);
    app.use('/api/v1/admin/jobs', jobQueueRoutes);
  });

  afterAll(async () => {
    if (queues && queues.exportQueue) {
      await closeQueues();
    }
  });

  beforeEach(async () => {
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

  describe('GET /api/v1/admin/jobs/stats', () => {
    it('should return statistics for all queues', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const queueStats = response.body.data[0];
      expect(queueStats).toHaveProperty('name');
      expect(queueStats).toHaveProperty('waiting');
      expect(queueStats).toHaveProperty('active');
      expect(queueStats).toHaveProperty('completed');
      expect(queueStats).toHaveProperty('failed');
    });
  });

  describe('GET /api/v1/admin/jobs/:queueName/stats', () => {
    it('should return statistics for specific queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/export/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'export');
      expect(response.body.data).toHaveProperty('waiting');
      expect(response.body.data).toHaveProperty('active');
    });

    it('should return 404 for non-existent queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/nonexistent/stats');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/jobs/:queueName/jobs', () => {
    it('should return waiting jobs from queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add some jobs
      await addExportJob('bookings-csv', { filters: {} });
      await addExportJob('users-csv', { filters: {} });

      const response = await request(app)
        .get('/api/v1/admin/jobs/export/jobs')
        .query({ state: 'waiting' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.queue).toBe('export');
      expect(response.body.data.state).toBe('waiting');
      expect(Array.isArray(response.body.data.jobs)).toBe(true);
      expect(response.body.data.jobs.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add multiple jobs
      for (let i = 0; i < 5; i++) {
        await addExportJob('bookings-csv', { filters: { index: i } });
      }

      const response = await request(app)
        .get('/api/v1/admin/jobs/export/jobs')
        .query({ state: 'waiting', start: 0, end: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.jobs.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array when no jobs in state', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app)
        .get('/api/v1/admin/jobs/export/jobs')
        .query({ state: 'failed' });

      expect(response.status).toBe(200);
      expect(response.body.data.jobs).toEqual([]);
    });
  });

  describe('GET /api/v1/admin/jobs/:queueName/:jobId', () => {
    it('should return job details', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addExportJob('bookings-csv', { filters: { status: 'confirmed' } });

      const response = await request(app).get(`/api/v1/admin/jobs/export/${job.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(job.id);
      expect(response.body.data.data.type).toBe('bookings-csv');
    });

    it('should return 404 for non-existent job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/export/nonexistent-job-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/jobs/:queueName/:jobId/retry', () => {
    it('should retry a failed job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add a job and manually fail it
      const job = await addExportJob('bookings-csv', { filters: {} });
      await job.moveToFailed(new Error('Test failure'), 'test');

      const response = await request(app).post(`/api/v1/admin/jobs/export/${job.id}/retry`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return error for non-existent job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).post('/api/v1/admin/jobs/export/nonexistent-job-id/retry');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/jobs/:queueName/:jobId', () => {
    it('should remove a job', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const job = await addExportJob('bookings-csv', { filters: {} });

      const response = await request(app).delete(`/api/v1/admin/jobs/export/${job.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify job is removed
      const queue = getQueue('export');
      const removedJob = await queue.getJob(job.id);
      expect(removedJob).toBeUndefined();
    });
  });

  describe('POST /api/v1/admin/jobs/:queueName/pause', () => {
    it('should pause a queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).post('/api/v1/admin/jobs/export/pause');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify queue is paused
      const queue = getQueue('export');
      const isPaused = await queue.isPaused();
      expect(isPaused).toBe(true);

      // Resume for cleanup
      await queue.resume();
    });
  });

  describe('POST /api/v1/admin/jobs/:queueName/resume', () => {
    it('should resume a paused queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // First pause the queue
      const queue = getQueue('export');
      await queue.pause();

      const response = await request(app).post('/api/v1/admin/jobs/export/resume');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify queue is resumed
      const isPaused = await queue.isPaused();
      expect(isPaused).toBe(false);
    });
  });

  describe('POST /api/v1/admin/jobs/:queueName/clean', () => {
    it('should clean completed jobs', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app)
        .post('/api/v1/admin/jobs/export/clean')
        .send({ grace: 0 }); // Clean all completed jobs immediately

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.count).toBe('number');
    });
  });

  describe('POST /api/v1/admin/jobs/:queueName/drain', () => {
    it('should drain all jobs from queue', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      // Add some jobs
      await addExportJob('bookings-csv', { filters: {} });
      await addExportJob('users-csv', { filters: {} });

      const response = await request(app).post('/api/v1/admin/jobs/export/drain');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify queue is empty
      const queue = getQueue('export');
      const waitingCount = await queue.getWaitingCount();
      expect(waitingCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid queue name', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/invalid-queue/stats');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing parameters', async () => {
      if (!process.env.REDIS_URL) {
        return expect(true).toBe(true);
      }

      const response = await request(app).get('/api/v1/admin/jobs/export/jobs');

      expect(response.status).toBe(200); // Should use defaults
      expect(response.body.success).toBe(true);
    });
  });
});
