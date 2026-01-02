/**
 * Socket.IO Service for Real-Time Performance Metrics
 * 
 * @module metricsSocketService
 * @description Provides real-time metrics streaming to admin dashboard
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.mjs';
import { getMetrics } from './metricsService.mjs';
import { getStats as getCacheStats } from '../utils/cache.mjs';
import { getRedisStats } from '../config/redis.mjs';
import logger from '../config/logger.mjs';

let io = null;
let metricsInterval = null;

/**
 * Initialize Socket.IO for metrics streaming
 * @param {Object} server - HTTP server instance
 */
export function initializeMetricsSocket(server) {
  // Configure CORS based on environment
  const corsOrigin = process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || false 
    : '*';

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret);
      
      // Only allow admin users to connect to metrics
      if (decoded.role !== 'admin') {
        return next(new Error('Insufficient permissions - admin access required'));
      }
      
      socket.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    logger.info(`Admin connected to metrics stream: ${socket.user.email}`);
    
    // Join metrics room
    socket.join('metrics');
    
    // Handle subscribe to metrics
    socket.on('metrics:subscribe', async (config) => {
      const { updateInterval = 5000 } = config || {};
      
      logger.info(`Metrics subscription started for ${socket.user.email}`, { updateInterval });
      
      // Send initial metrics immediately
      try {
        const metrics = await collectMetrics();
        socket.emit('metrics:update', metrics);
      } catch (error) {
        logger.error('Error sending initial metrics:', { error: error.message });
        socket.emit('metrics:error', { message: 'Failed to fetch metrics' });
      }
    });
    
    // Handle unsubscribe
    socket.on('metrics:unsubscribe', () => {
      logger.info(`Metrics subscription stopped for ${socket.user.email}`);
      socket.leave('metrics');
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Admin disconnected from metrics stream: ${socket.user.email}`);
    });
  });

  // Start periodic metrics broadcast (every 5 seconds)
  startMetricsBroadcast();

  logger.info('Metrics Socket.IO service initialized');
  return io;
}

/**
 * Start broadcasting metrics to all connected clients
 */
function startMetricsBroadcast() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(async () => {
    if (!io) return;
    
    // Check if anyone is subscribed
    const metricsRoom = io.sockets.adapter.rooms.get('metrics');
    if (!metricsRoom || metricsRoom.size === 0) {
      return; // No one listening, skip
    }

    try {
      const metrics = await collectMetrics();
      io.to('metrics').emit('metrics:update', metrics);
    } catch (error) {
      logger.error('Error broadcasting metrics:', { error: error.message });
    }
  }, 5000); // Broadcast every 5 seconds
}

/**
 * Collect and aggregate current metrics
 */
async function collectMetrics() {
  try {
    // Get raw Prometheus metrics
    const metricsText = await getMetrics();
    
    // Parse metrics
    const metrics = parsePrometheusMetrics(metricsText);
    
    // Get cache stats
    const cacheStats = getCacheStats();
    const redisStats = getRedisStats();
    
    // Calculate cache hit ratio
    const totalCacheOps = cacheStats.hits + cacheStats.misses;
    const cacheHitRatio = totalCacheOps > 0 ? (cacheStats.hits / totalCacheOps) * 100 : 0;
    
    // Aggregate metrics
    const aggregated = aggregateMetrics(metrics);
    
    return {
      timestamp: new Date().toISOString(),
      performance: {
        avgResponseTime: aggregated.avgResponseTime,
        requestRate: aggregated.requestRate,
        errorRate: aggregated.errorRate,
        activeConnections: aggregated.activeConnections,
      },
      cache: {
        hitRatio: cacheHitRatio,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        keys: cacheStats.keys,
        redis: redisStats,
      },
      database: {
        queryCount: aggregated.dbQueryCount,
        avgQueryTime: aggregated.avgDbQueryTime,
        slowQueries: aggregated.slowQueries,
      },
      system: {
        cpu: aggregated.cpuUsage,
        memory: aggregated.memoryUsage,
      },
      requests: aggregated.requestsByEndpoint,
      slowEndpoints: aggregated.slowEndpoints,
      queue: aggregated.queueStats,
    };
  } catch (error) {
    logger.error('Error collecting metrics:', { error: error.message });
    throw error;
  }
}

/**
 * Helper function to parse Prometheus metrics text format
 */
function parsePrometheusMetrics(metricsText) {
  const metrics = {};
  const lines = metricsText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*){([^}]*)} (.+)$/);
    if (match) {
      const [, name, labelsStr, value] = match;
      const labels = {};
      
      // Parse labels
      const labelPairs = labelsStr.match(/(\w+)="([^"]*)"/g) || [];
      for (const pair of labelPairs) {
        const [key, val] = pair.split('=');
        labels[key] = val.replace(/"/g, '');
      }
      
      if (!metrics[name]) metrics[name] = [];
      metrics[name].push({ labels, value: parseFloat(value) });
    } else {
      // Metric without labels
      const simpleMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*) (.+)$/);
      if (simpleMatch) {
        const [, name, value] = simpleMatch;
        if (!metrics[name]) metrics[name] = [];
        metrics[name].push({ labels: {}, value: parseFloat(value) });
      }
    }
  }
  
  return metrics;
}

/**
 * Helper function to aggregate metrics
 */
function aggregateMetrics(metrics) {
  const httpDurations = metrics.http_request_duration_seconds || [];
  const httpRequests = metrics.http_requests_total || [];
  const dbDurations = metrics.db_operation_duration_seconds || [];
  const activeConns = metrics.active_connections || [];
  const errors = metrics.errors_total || [];
  const queueJobs = {
    waiting: metrics.queue_jobs_waiting || [],
    active: metrics.queue_jobs_active || [],
    failed: metrics.queue_jobs_failed || [],
    processed: metrics.queue_jobs_processed_total || [],
  };
  
  // Calculate average response time
  let totalDuration = 0;
  let durationCount = 0;
  for (const metric of httpDurations) {
    if (metric.labels.route && metric.value) {
      totalDuration += metric.value;
      durationCount++;
    }
  }
  const avgResponseTime = durationCount > 0 ? (totalDuration / durationCount) * 1000 : 0;
  
  // Calculate request rate
  const totalRequests = httpRequests.reduce((sum, m) => sum + (m.value || 0), 0);
  const requestRate = totalRequests / 60;
  
  // Calculate error rate
  const totalErrors = errors.reduce((sum, m) => sum + (m.value || 0), 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  // Get active connections
  const activeConnections = activeConns.length > 0 ? activeConns[0].value : 0;
  
  // Database metrics
  let totalDbDuration = 0;
  let dbQueryCount = 0;
  const slowQueries = [];
  
  for (const metric of dbDurations) {
    if (metric.labels.operation) {
      totalDbDuration += metric.value;
      dbQueryCount++;
      
      if (metric.value > 0.1) {
        slowQueries.push({
          operation: metric.labels.operation,
          collection: metric.labels.collection,
          duration: (metric.value * 1000).toFixed(2),
        });
      }
    }
  }
  
  const avgDbQueryTime = dbQueryCount > 0 ? (totalDbDuration / dbQueryCount) * 1000 : 0;
  
  // System metrics
  const cpuUsage = getMetricValue(metrics, 'process_cpu_user_seconds_total') || 0;
  const memoryUsage = getMetricValue(metrics, 'process_resident_memory_bytes') / (1024 * 1024) || 0;
  
  // Requests by endpoint
  const requestsByEndpoint = {};
  for (const metric of httpRequests) {
    const route = metric.labels.route || 'unknown';
    requestsByEndpoint[route] = (requestsByEndpoint[route] || 0) + metric.value;
  }
  
  // Slow endpoints
  const endpointDurations = {};
  for (const metric of httpDurations) {
    const route = metric.labels.route || 'unknown';
    if (!endpointDurations[route]) {
      endpointDurations[route] = { total: 0, count: 0 };
    }
    endpointDurations[route].total += metric.value;
    endpointDurations[route].count += 1;
  }
  
  const slowEndpoints = Object.entries(endpointDurations)
    .map(([route, data]) => ({
      route,
      avgDuration: (data.total / data.count) * 1000,
      requestCount: data.count,
    }))
    .filter(e => e.avgDuration > 100)
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);
  
  // Queue stats
  const queueStats = {
    waiting: queueJobs.waiting.reduce((sum, m) => sum + m.value, 0),
    active: queueJobs.active.reduce((sum, m) => sum + m.value, 0),
    failed: queueJobs.failed.reduce((sum, m) => sum + m.value, 0),
    processed: queueJobs.processed.reduce((sum, m) => sum + m.value, 0),
  };
  
  return {
    avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    requestRate: parseFloat(requestRate.toFixed(2)),
    errorRate: parseFloat(errorRate.toFixed(2)),
    activeConnections,
    dbQueryCount,
    avgDbQueryTime: parseFloat(avgDbQueryTime.toFixed(2)),
    slowQueries: slowQueries.slice(0, 10),
    cpuUsage: parseFloat(cpuUsage.toFixed(2)),
    memoryUsage: parseFloat(memoryUsage.toFixed(2)),
    requestsByEndpoint,
    slowEndpoints,
    queueStats,
  };
}

/**
 * Helper to get a single metric value
 */
function getMetricValue(metrics, name) {
  const metric = metrics[name];
  return metric && metric.length > 0 ? metric[0].value : 0;
}

/**
 * Stop metrics broadcast and close Socket.IO
 */
export function closeMetricsSocket() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
  
  if (io) {
    io.close();
    io = null;
    logger.info('Metrics Socket.IO service closed');
  }
}

export default {
  initializeMetricsSocket,
  closeMetricsSocket,
};
