import os from 'os';
import process from 'process';

// Store metrics data
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byMethod: {},
    byEndpoint: {},
  },
  performance: {
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    totalResponseTime: 0,
  },
  errors: {
    total: 0,
    byType: {},
    recent: [],
  },
  startTime: Date.now(),
};

/**
 * Track request metrics
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in ms
 */
export function trackRequest(method, path, statusCode, responseTime) {
  // Update total requests
  metrics.requests.total++;

  // Track success/error
  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  // Track by method
  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = 0;
  }
  metrics.requests.byMethod[method]++;

  // Track by endpoint (simplified path)
  const simplifiedPath = path.split('?')[0].replace(/\/[0-9a-f]{24}/gi, '/:id');
  if (!metrics.requests.byEndpoint[simplifiedPath]) {
    metrics.requests.byEndpoint[simplifiedPath] = {
      count: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
    };
  }
  metrics.requests.byEndpoint[simplifiedPath].count++;
  metrics.requests.byEndpoint[simplifiedPath].totalResponseTime += responseTime;
  metrics.requests.byEndpoint[simplifiedPath].avgResponseTime =
    metrics.requests.byEndpoint[simplifiedPath].totalResponseTime /
    metrics.requests.byEndpoint[simplifiedPath].count;

  // Update performance metrics
  metrics.performance.totalResponseTime += responseTime;
  metrics.performance.avgResponseTime =
    metrics.performance.totalResponseTime / metrics.requests.total;
  metrics.performance.maxResponseTime = Math.max(
    metrics.performance.maxResponseTime,
    responseTime
  );
  metrics.performance.minResponseTime = Math.min(
    metrics.performance.minResponseTime,
    responseTime
  );
}

/**
 * Track error
 * @param {Error} error - Error object
 */
export function trackError(error) {
  metrics.errors.total++;

  // Track by error type
  const errorType = error.name || 'UnknownError';
  if (!metrics.errors.byType[errorType]) {
    metrics.errors.byType[errorType] = 0;
  }
  metrics.errors.byType[errorType]++;

  // Add to recent errors (keep last 10)
  metrics.errors.recent.unshift({
    type: errorType,
    message: error.message,
    timestamp: new Date().toISOString(),
  });
  if (metrics.errors.recent.length > 10) {
    metrics.errors.recent.pop();
  }
}

/**
 * Get current metrics
 */
export function getMetrics() {
  const uptime = Date.now() - metrics.startTime;
  const memUsage = process.memoryUsage();

  return {
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      successRate:
        metrics.requests.total > 0
          ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
      byMethod: metrics.requests.byMethod,
      topEndpoints: getTopEndpoints(5),
    },
    performance: {
      avgResponseTime: Math.round(metrics.performance.avgResponseTime) + 'ms',
      maxResponseTime: Math.round(metrics.performance.maxResponseTime) + 'ms',
      minResponseTime:
        metrics.performance.minResponseTime === Infinity
          ? '0ms'
          : Math.round(metrics.performance.minResponseTime) + 'ms',
    },
    errors: {
      total: metrics.errors.total,
      rate:
        metrics.requests.total > 0
          ? ((metrics.errors.total / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
      byType: metrics.errors.byType,
      recent: metrics.errors.recent.slice(0, 5),
    },
    system: {
      memory: {
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        rss: formatBytes(memUsage.rss),
        external: formatBytes(memUsage.external),
      },
      cpu: {
        loadAvg: os.loadavg(),
        cores: os.cpus().length,
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
      },
    },
  };
}

/**
 * Get metrics in Prometheus format
 */
export function getPrometheusMetrics() {
  const lines = [];

  // Requests metrics
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total ${metrics.requests.total}`);

  lines.push('# HELP http_requests_success Total number of successful HTTP requests');
  lines.push('# TYPE http_requests_success counter');
  lines.push(`http_requests_success ${metrics.requests.success}`);

  lines.push('# HELP http_requests_errors Total number of failed HTTP requests');
  lines.push('# TYPE http_requests_errors counter');
  lines.push(`http_requests_errors ${metrics.requests.errors}`);

  // Performance metrics
  lines.push('# HELP http_response_time_avg Average response time in milliseconds');
  lines.push('# TYPE http_response_time_avg gauge');
  lines.push(`http_response_time_avg ${metrics.performance.avgResponseTime}`);

  lines.push('# HELP http_response_time_max Maximum response time in milliseconds');
  lines.push('# TYPE http_response_time_max gauge');
  lines.push(`http_response_time_max ${metrics.performance.maxResponseTime}`);

  // Error metrics
  lines.push('# HELP errors_total Total number of errors');
  lines.push('# TYPE errors_total counter');
  lines.push(`errors_total ${metrics.errors.total}`);

  // System metrics
  const memUsage = process.memoryUsage();
  lines.push('# HELP process_heap_bytes Process heap size in bytes');
  lines.push('# TYPE process_heap_bytes gauge');
  lines.push(`process_heap_bytes ${memUsage.heapUsed}`);

  lines.push('# HELP process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE process_uptime_seconds counter');
  lines.push(`process_uptime_seconds ${Math.floor((Date.now() - metrics.startTime) / 1000)}`);

  return lines.join('\n') + '\n';
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics() {
  metrics.requests.total = 0;
  metrics.requests.success = 0;
  metrics.requests.errors = 0;
  metrics.requests.byMethod = {};
  metrics.requests.byEndpoint = {};
  metrics.performance.avgResponseTime = 0;
  metrics.performance.maxResponseTime = 0;
  metrics.performance.minResponseTime = Infinity;
  metrics.performance.totalResponseTime = 0;
  metrics.errors.total = 0;
  metrics.errors.byType = {};
  metrics.errors.recent = [];
}

// Helper functions
function getTopEndpoints(limit = 5) {
  return Object.entries(metrics.requests.byEndpoint)
    .map(([path, data]) => ({
      path,
      count: data.count,
      avgResponseTime: Math.round(data.avgResponseTime) + 'ms',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
