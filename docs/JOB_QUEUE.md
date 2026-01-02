# Job Queue System Documentation

## Overview

The GNB Transfer application uses **BullMQ** with **Redis** to implement a robust background job queue system. This system offloads heavy operations (exports, email sending, AI processing, scheduled tasks) from the main request/response cycle, improving application performance and user experience.

## Architecture

### Components

1. **Queues**: Four specialized queues for different job types
   - `exportQueue`: CSV/PDF export generation
   - `emailQueue`: Email notifications
   - `aiQueue`: OpenAI API calls and AI processing
   - `scheduledQueue`: Recurring and scheduled jobs

2. **Workers**: Background processors that execute jobs
   - `exportWorker`: Processes export jobs
   - `emailWorker`: Processes email jobs
   - `aiWorker`: Processes AI jobs
   - `scheduledWorker`: Processes scheduled jobs

3. **Queue Service**: High-level API for adding and managing jobs
4. **Admin Interface**: Web UI for monitoring and managing queues
5. **Prometheus Metrics**: Performance monitoring and observability

### Technology Stack

- **BullMQ**: Modern Redis-based queue system
- **Redis**: In-memory data store for queue management
- **ioredis**: Redis client for Node.js
- **Prometheus**: Metrics collection and monitoring

## Setup and Configuration

### Prerequisites

1. **Redis Server**: A running Redis instance (local or cloud)
2. **Node.js**: Version 18 or higher
3. **Environment Variables**: Configure in `.env` file

### Environment Variables

Add the following to your `backend/.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Queue Configuration
QUEUE_ENABLED=true

# Worker Concurrency
EXPORT_WORKER_CONCURRENCY=2
EMAIL_WORKER_CONCURRENCY=5
AI_WORKER_CONCURRENCY=3
SCHEDULED_WORKER_CONCURRENCY=2
```

### Redis URL Formats

```env
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Redis Cloud (e.g., Redis Labs)
REDIS_URL=redis://username:password@redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com:12345

# Redis Sentinel
REDIS_URL=redis+sentinel://localhost:26379/mymaster
```

### Installation

BullMQ is already installed as part of the project dependencies:

```bash
npm install
```

If you need to install it manually:

```bash
cd backend
npm install bullmq --save
```

## Usage

### Adding Jobs to Queues

#### Export Jobs

```javascript
import { addExportJob } from './services/queueService.mjs';

// Export bookings to CSV
const job = await addExportJob('bookings-csv', {
  filters: { status: 'confirmed' },
});

// Export users to CSV
await addExportJob('users-csv', {
  filters: { role: 'customer' },
});

// Generate revenue PDF
await addExportJob('revenue-pdf', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

#### Email Jobs

```javascript
import { addEmailJob } from './services/queueService.mjs';

// Send generic email
const job = await addEmailJob('send-email', {
  to: 'user@example.com',
  subject: 'Welcome to GNB Transfer',
  html: '<h1>Welcome!</h1>',
});

// Send booking confirmation
await addEmailJob('booking-confirmation', {
  booking: bookingObject,
  user: userObject,
});

// Send with delay (scheduled email)
await addEmailJob(
  'send-email',
  {
    to: 'user@example.com',
    subject: 'Reminder',
    html: '<p>This is a reminder</p>',
  },
  {
    delay: 3600000, // 1 hour delay
  }
);
```

#### AI Jobs

```javascript
import { addAIJob } from './services/queueService.mjs';

// Generate package recommendations
const job = await addAIJob('package-recommendations', {
  userId: 'user123',
  options: { language: 'en' },
});

// Calculate delay risk
await addAIJob('delay-risk', {
  origin: 'Istanbul',
  destination: 'Ankara',
  scheduledTime: new Date(),
});
```

#### Scheduled Jobs

```javascript
import { addScheduledJob } from './services/queueService.mjs';

// One-time scheduled job
const job = await addScheduledJob('process-campaigns', {});

// Recurring job (using cron pattern)
await addScheduledJob(
  'update-sitemap',
  {},
  {
    repeat: {
      pattern: '0 0 * * *', // Daily at midnight
    },
  }
);
```

### Using Enhanced Services (with Automatic Fallback)

```javascript
import {
  exportBookingsCSVAsync,
  exportUsersCSVAsync,
} from './services/exportServiceAsync.mjs';

import {
  sendEmailAsync,
  sendBulkCampaignNotifications,
} from './services/emailServiceAsync.mjs';

// These will use queues if available, otherwise fallback to synchronous execution
const result = await exportBookingsCSVAsync({ status: 'confirmed' });

if (result.jobId) {
  console.log('Export queued:', result.jobId);
} else if (result.sync) {
  console.log('Export completed synchronously:', result.data);
}
```

## Queue Management

### Admin API Endpoints

All endpoints require admin authentication.

#### Get Queue Statistics

```http
GET /api/v1/admin/jobs/stats
```

Returns statistics for all queues.

```http
GET /api/v1/admin/jobs/:queueName/stats
```

Returns statistics for a specific queue.

#### List Jobs

```http
GET /api/v1/admin/jobs/:queueName/jobs?state=waiting&start=0&end=10
```

Query parameters:
- `state`: waiting, active, completed, failed, delayed (default: waiting)
- `start`: Pagination start index (default: 0)
- `end`: Pagination end index (default: 10)

#### Get Job Details

```http
GET /api/v1/admin/jobs/:queueName/:jobId
```

#### Retry Failed Job

```http
POST /api/v1/admin/jobs/:queueName/:jobId/retry
```

#### Remove Job

```http
DELETE /api/v1/admin/jobs/:queueName/:jobId
```

#### Pause Queue

```http
POST /api/v1/admin/jobs/:queueName/pause
```

#### Resume Queue

```http
POST /api/v1/admin/jobs/:queueName/resume
```

#### Clean Completed Jobs

```http
POST /api/v1/admin/jobs/:queueName/clean
Content-Type: application/json

{
  "grace": 86400000  // Keep jobs completed within last 24 hours
}
```

#### Drain Queue (Remove All Jobs)

```http
POST /api/v1/admin/jobs/:queueName/drain
```

**⚠️ Warning**: This removes all jobs from the queue. Use with caution!

### Admin Web Interface

Access the job queue management interface at:

```
http://localhost:5173/admin/jobs
```

Features:
- Real-time queue statistics
- Job listing by state (waiting, active, completed, failed)
- Job details view with progress tracking
- Retry failed jobs
- Remove/cancel jobs
- Pause/resume queues
- Clean completed jobs
- Auto-refresh (every 5 seconds)

## Monitoring and Metrics

### Prometheus Metrics

The following metrics are exported for Prometheus:

```
# Job Processing
queue_jobs_processed_total{queue="export",status="completed"} 150
queue_jobs_processed_total{queue="export",status="failed"} 5

# Queue Depth
queue_jobs_waiting{queue="export"} 10
queue_jobs_active{queue="export"} 2
queue_jobs_failed{queue="export"} 1

# Job Duration
queue_job_duration_seconds{queue="export",job_type="bookings-csv"} 2.5
```

### Accessing Metrics

Metrics are available at:

```
http://localhost:5000/metrics
```

### Grafana Dashboard

Import the provided Grafana dashboard configuration to visualize queue metrics:

- Queue depth over time
- Job processing rate
- Failed job rate
- Job duration distribution
- Worker utilization

## Job Configuration

### Default Options

Each queue has default job options configured:

**Export Queue**:
- Attempts: 2
- Priority: 5 (medium)
- Remove on complete: After 24 hours or 1000 jobs
- Remove on fail: After 7 days or 5000 jobs

**Email Queue**:
- Attempts: 5
- Priority: 3 (higher)
- Backoff: Exponential starting at 1 second
- Remove on complete: After 24 hours or 1000 jobs

**AI Queue**:
- Attempts: 3
- Priority: 7 (lower)
- Timeout: 60 seconds
- Remove on complete: After 24 hours or 1000 jobs

**Scheduled Queue**:
- Attempts: 3
- Priority: 5 (medium)
- Supports recurring jobs with cron patterns

### Custom Job Options

You can override default options when adding jobs:

```javascript
await addExportJob(
  'bookings-csv',
  { filters: {} },
  {
    priority: 1, // Highest priority
    attempts: 5, // More retries
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds
    },
  }
);
```

### Retry Strategy

Failed jobs are automatically retried with exponential backoff:

1. First retry: After 2 seconds
2. Second retry: After 4 seconds
3. Third retry: After 8 seconds
4. And so on...

Maximum attempts can be configured per queue or per job.

## Error Handling

### Worker Error Handling

Workers catch and log all errors. Failed jobs are marked as failed and can be retried manually or automatically.

```javascript
// Example from exportWorker.mjs
try {
  const result = await exportBookingsCSV(filters);
  return { success: true, data: result };
} catch (error) {
  logger.error(`Export job failed`, { error: error.message });
  throw error; // BullMQ will handle retry logic
}
```

### Fallback Mechanism

Enhanced services provide automatic fallback to synchronous execution if queues are unavailable:

```javascript
export const exportBookingsCSVAsync = async (filters = {}) => {
  try {
    const job = await addExportJob('bookings-csv', { filters });
    return { success: true, jobId: job.id };
  } catch (error) {
    logger.warn('Queue unavailable, falling back to sync');
    const data = await syncExportBookingsCSV(filters);
    return { success: true, data, sync: true };
  }
};
```

## Performance Considerations

### Worker Concurrency

Adjust worker concurrency based on your server resources:

```env
# Low resources (1 CPU, 512MB RAM)
EXPORT_WORKER_CONCURRENCY=1
EMAIL_WORKER_CONCURRENCY=2
AI_WORKER_CONCURRENCY=1
SCHEDULED_WORKER_CONCURRENCY=1

# Medium resources (2 CPU, 2GB RAM)
EXPORT_WORKER_CONCURRENCY=2
EMAIL_WORKER_CONCURRENCY=5
AI_WORKER_CONCURRENCY=3
SCHEDULED_WORKER_CONCURRENCY=2

# High resources (4+ CPU, 4GB+ RAM)
EXPORT_WORKER_CONCURRENCY=4
EMAIL_WORKER_CONCURRENCY=10
AI_WORKER_CONCURRENCY=5
SCHEDULED_WORKER_CONCURRENCY=4
```

### Rate Limiting

Queues have built-in rate limiting:

- Export: 10 jobs per minute
- Email: 50 jobs per minute
- AI: 20 jobs per minute

Adjust these limits in the queue configuration (`backend/config/queues.mjs`).

### Memory Management

- Completed jobs are automatically removed after 24 hours
- Failed jobs are kept for 7 days for debugging
- Use the clean endpoint regularly to remove old jobs
- Monitor Redis memory usage

## Troubleshooting

### Queue Not Processing Jobs

1. **Check Redis Connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Worker Status**:
   - Check server logs for worker initialization
   - Look for errors in worker event listeners

3. **Check Queue Stats**:
   ```bash
   curl http://localhost:5000/api/v1/admin/jobs/stats \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Jobs Failing Repeatedly

1. **Check Job Logs**:
   - View job details in admin interface
   - Check `failedReason` and `stacktrace`

2. **Check Dependencies**:
   - Email: Verify SMTP configuration
   - AI: Verify OpenAI API key
   - Export: Check database connectivity

3. **Manual Retry**:
   - Use admin interface to retry individual jobs
   - Fix underlying issue before retrying

### High Memory Usage

1. **Clean Old Jobs**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/admin/jobs/export/clean \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"grace": 3600000}'
   ```

2. **Adjust Retention Settings**:
   - Modify `removeOnComplete` and `removeOnFail` in queue config
   - Reduce retention periods

3. **Monitor Redis**:
   ```bash
   redis-cli info memory
   ```

## Best Practices

1. **Use Queues for Heavy Operations**:
   - Large data exports
   - Bulk email sending
   - AI/ML processing
   - Report generation

2. **Don't Queue Everything**:
   - Simple database queries
   - Quick API responses
   - User authentication

3. **Set Appropriate Priorities**:
   - High: User-facing operations (booking confirmations)
   - Medium: Administrative tasks (exports)
   - Low: Background maintenance (sitemap updates)

4. **Monitor Queue Health**:
   - Set up Prometheus alerts for queue depth
   - Monitor failed job rates
   - Track job processing times

5. **Handle Failures Gracefully**:
   - Log all errors with context
   - Provide fallback mechanisms
   - Retry with exponential backoff

6. **Test Queue Operations**:
   - Write tests for job processors
   - Test retry logic
   - Test failure scenarios

## Migration Guide

### Migrating Existing Code to Use Queues

**Before** (synchronous):
```javascript
// routes/adminRoutes.mjs
router.get('/export/bookings', async (req, res) => {
  const csv = await exportBookingsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});
```

**After** (with queue):
```javascript
// routes/adminRoutes.mjs
import { exportBookingsCSVAsync } from '../services/exportServiceAsync.mjs';

router.get('/export/bookings', async (req, res) => {
  const result = await exportBookingsCSVAsync(req.query);
  
  if (result.jobId) {
    res.success({ jobId: result.jobId }, 'Export job queued');
  } else {
    // Fallback to sync
    res.setHeader('Content-Type', 'text/csv');
    res.send(result.data);
  }
});
```

## Security Considerations

1. **Admin-Only Access**:
   - All queue management endpoints require admin role
   - Use proper authentication middleware

2. **Input Validation**:
   - Validate job data before adding to queue
   - Sanitize user inputs

3. **Rate Limiting**:
   - Prevent queue flooding with rate limits
   - Monitor for suspicious activity

4. **Data Privacy**:
   - Don't store sensitive data in job metadata
   - Use references (IDs) instead of full objects

## Support and Resources

- **BullMQ Documentation**: https://docs.bullmq.io/
- **Redis Documentation**: https://redis.io/docs/
- **Prometheus Metrics**: https://prometheus.io/docs/

## Changelog

### Version 1.0.0 (2024)
- Initial implementation of BullMQ queue system
- Four specialized queues (export, email, ai, scheduled)
- Admin web interface for queue management
- Prometheus metrics integration
- Automatic fallback mechanisms
- Comprehensive testing suite
