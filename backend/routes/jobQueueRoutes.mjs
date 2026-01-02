/**
 * Job Queue Management Routes
 * 
 * Admin endpoints for monitoring and managing background job queues
 */

import express from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';
import {
  getAllQueueStats,
  getQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  drainQueue,
} from '../config/queues.mjs';
import {
  getJobsByState,
  getJob,
  retryJob,
  removeJob,
} from '../services/queueService.mjs';
import {
  queueJobsWaiting,
  queueJobsActive,
  queueJobsFailed,
} from '../services/metricsService.mjs';

const router = express.Router();

/**
 * @route GET /api/v1/admin/jobs/stats
 * @desc Get statistics for all queues
 * @access Admin
 */
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getAllQueueStats();

    // Update Prometheus metrics
    stats.forEach((queueStats) => {
      if (queueStats) {
        queueJobsWaiting.labels(queueStats.name).set(queueStats.waiting);
        queueJobsActive.labels(queueStats.name).set(queueStats.active);
        queueJobsFailed.labels(queueStats.name).set(queueStats.failed);
      }
    });

    res.success(stats, 'Queue statistics retrieved successfully');
  } catch (error) {
    logger.error('Failed to get queue stats', { error: error.message });
    res.error('Failed to retrieve queue statistics', 500);
  }
});

/**
 * @route GET /api/v1/admin/jobs/:queueName/stats
 * @desc Get statistics for a specific queue
 * @access Admin
 */
router.get('/:queueName/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    const stats = await getQueueStats(queueName);

    if (!stats) {
      return res.error(`Queue ${queueName} not found`, 404);
    }

    // Update Prometheus metrics
    queueJobsWaiting.labels(queueName).set(stats.waiting);
    queueJobsActive.labels(queueName).set(stats.active);
    queueJobsFailed.labels(queueName).set(stats.failed);

    res.success(stats, 'Queue statistics retrieved successfully');
  } catch (error) {
    logger.error('Failed to get queue stats', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error('Failed to retrieve queue statistics', 500);
  }
});

/**
 * @route GET /api/v1/admin/jobs/:queueName/jobs
 * @desc Get jobs from a specific queue by state
 * @access Admin
 */
router.get('/:queueName/jobs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { state = 'waiting', start = 0, end = 10 } = req.query;

    const jobs = await getJobsByState(
      queueName,
      state,
      parseInt(start, 10),
      parseInt(end, 10)
    );

    // Format jobs for response
    const formattedJobs = await Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        timestamp: job.timestamp,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
        state: await job.getState(),
      }))
    );

    res.success(
      {
        queue: queueName,
        state,
        jobs: formattedJobs,
        count: formattedJobs.length,
      },
      'Jobs retrieved successfully'
    );
  } catch (error) {
    logger.error('Failed to get jobs', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error('Failed to retrieve jobs', 500);
  }
});

/**
 * @route GET /api/v1/admin/jobs/:queueName/:jobId
 * @desc Get specific job details
 * @access Admin
 */
router.get('/:queueName/:jobId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const job = await getJob(queueName, jobId);

    if (!job) {
      return res.error(`Job ${jobId} not found in queue ${queueName}`, 404);
    }

    const jobDetails = {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      timestamp: job.timestamp,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      state: await job.getState(),
      opts: job.opts,
    };

    res.success(jobDetails, 'Job details retrieved successfully');
  } catch (error) {
    logger.error('Failed to get job details', {
      queue: req.params.queueName,
      jobId: req.params.jobId,
      error: error.message,
    });
    res.error('Failed to retrieve job details', 500);
  }
});

/**
 * @route POST /api/v1/admin/jobs/:queueName/:jobId/retry
 * @desc Retry a failed job
 * @access Admin
 */
router.post('/:queueName/:jobId/retry', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const job = await retryJob(queueName, jobId);

    logger.info(`Job ${jobId} retried in queue ${queueName}`, {
      admin: req.user.email,
    });

    res.success(
      {
        id: job.id,
        state: await job.getState(),
      },
      'Job retried successfully'
    );
  } catch (error) {
    logger.error('Failed to retry job', {
      queue: req.params.queueName,
      jobId: req.params.jobId,
      error: error.message,
    });
    res.error(error.message || 'Failed to retry job', 500);
  }
});

/**
 * @route DELETE /api/v1/admin/jobs/:queueName/:jobId
 * @desc Remove/cancel a job
 * @access Admin
 */
router.delete('/:queueName/:jobId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    await removeJob(queueName, jobId);

    logger.info(`Job ${jobId} removed from queue ${queueName}`, {
      admin: req.user.email,
    });

    res.success(null, 'Job removed successfully');
  } catch (error) {
    logger.error('Failed to remove job', {
      queue: req.params.queueName,
      jobId: req.params.jobId,
      error: error.message,
    });
    res.error(error.message || 'Failed to remove job', 500);
  }
});

/**
 * @route POST /api/v1/admin/jobs/:queueName/pause
 * @desc Pause a queue
 * @access Admin
 */
router.post('/:queueName/pause', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    await pauseQueue(queueName);

    logger.info(`Queue ${queueName} paused`, { admin: req.user.email });

    res.success(null, `Queue ${queueName} paused successfully`);
  } catch (error) {
    logger.error('Failed to pause queue', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error(error.message || 'Failed to pause queue', 500);
  }
});

/**
 * @route POST /api/v1/admin/jobs/:queueName/resume
 * @desc Resume a paused queue
 * @access Admin
 */
router.post('/:queueName/resume', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    await resumeQueue(queueName);

    logger.info(`Queue ${queueName} resumed`, { admin: req.user.email });

    res.success(null, `Queue ${queueName} resumed successfully`);
  } catch (error) {
    logger.error('Failed to resume queue', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error(error.message || 'Failed to resume queue', 500);
  }
});

/**
 * @route POST /api/v1/admin/jobs/:queueName/clean
 * @desc Clean completed jobs from queue
 * @access Admin
 */
router.post('/:queueName/clean', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { grace = 24 * 3600 * 1000 } = req.body; // Default 24 hours

    const count = await cleanQueue(queueName, grace);

    logger.info(`Cleaned ${count} jobs from queue ${queueName}`, {
      admin: req.user.email,
      grace,
    });

    res.success({ count }, `Cleaned ${count} completed jobs`);
  } catch (error) {
    logger.error('Failed to clean queue', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error(error.message || 'Failed to clean queue', 500);
  }
});

/**
 * @route POST /api/v1/admin/jobs/:queueName/drain
 * @desc Drain all jobs from queue (use with caution!)
 * @access Admin
 */
router.post('/:queueName/drain', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    await drainQueue(queueName);

    logger.warn(`Queue ${queueName} drained (all jobs removed)`, {
      admin: req.user.email,
    });

    res.success(null, `Queue ${queueName} drained successfully`);
  } catch (error) {
    logger.error('Failed to drain queue', {
      queue: req.params.queueName,
      error: error.message,
    });
    res.error(error.message || 'Failed to drain queue', 500);
  }
});

export default router;
