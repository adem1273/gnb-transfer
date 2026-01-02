import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics

// HTTP Request Duration
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

// HTTP Request Counter
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// Active Connections
export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});
register.registerMetric(activeConnections);

// Database Operations
export const dbOperationDuration = new client.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});
register.registerMetric(dbOperationDuration);

// Booking Metrics
export const bookingsCreated = new client.Counter({
  name: 'bookings_created_total',
  help: 'Total number of bookings created',
  labelNames: ['status', 'tour_id'],
});
register.registerMetric(bookingsCreated);

// Auth Metrics
export const authAttempts = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'success'],
});
register.registerMetric(authAttempts);

// Cache Metrics
export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
});
register.registerMetric(cacheHits);

export const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
});
register.registerMetric(cacheMisses);

// Error Counter
export const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code'],
});
register.registerMetric(errorCounter);

// Queue Metrics
export const queueJobsProcessed = new client.Counter({
  name: 'queue_jobs_processed_total',
  help: 'Total number of jobs processed by queue',
  labelNames: ['queue', 'status'],
});
register.registerMetric(queueJobsProcessed);

export const queueJobsWaiting = new client.Gauge({
  name: 'queue_jobs_waiting',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue'],
});
register.registerMetric(queueJobsWaiting);

export const queueJobsActive = new client.Gauge({
  name: 'queue_jobs_active',
  help: 'Number of active jobs in queue',
  labelNames: ['queue'],
});
register.registerMetric(queueJobsActive);

export const queueJobsFailed = new client.Gauge({
  name: 'queue_jobs_failed',
  help: 'Number of failed jobs in queue',
  labelNames: ['queue'],
});
register.registerMetric(queueJobsFailed);

export const queueJobDuration = new client.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of job processing',
  labelNames: ['queue', 'job_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});
register.registerMetric(queueJobDuration);

// Get metrics in Prometheus format
export const getMetrics = async () => register.metrics();

// Get content type for Prometheus
export const getContentType = () => register.contentType;

export default {
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  dbOperationDuration,
  bookingsCreated,
  authAttempts,
  cacheHits,
  cacheMisses,
  errorCounter,
  queueJobsProcessed,
  queueJobsWaiting,
  queueJobsActive,
  queueJobsFailed,
  queueJobDuration,
  getMetrics,
  getContentType,
};
