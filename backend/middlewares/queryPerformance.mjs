import mongoose from 'mongoose';
import logger from '../config/logger.mjs';

const SLOW_QUERY_THRESHOLD_MS = 100;
const MAX_STATS_ENTRIES = 1000;

/**
 * Enable query debug logging
 * Note: mongoose.set('debug') logs queries when they are executed,
 * but does not provide post-execution hooks for timing.
 * For actual slow query detection, use MongoDB profiler in production.
 */
export const enableQueryProfiling = () => {
  mongoose.set('debug', (collectionName, methodName, ...args) => {
    logger.debug('MongoDB query:', {
      collection: collectionName,
      method: methodName,
      query: JSON.stringify(args[0] || {}).substring(0, 200),
    });
  });
};

export const queryStats = new Map();

/**
 * Clear query stats to prevent memory leaks
 */
export const clearQueryStats = () => {
  queryStats.clear();
};

/**
 * Track query execution for statistics
 * This should be called with actual measured durations from application code.
 * Limits storage to MAX_STATS_ENTRIES to prevent memory leaks.
 */
export const trackQuery = (collection, operation, duration) => {
  const key = `${collection}.${operation}`;
  const stats = queryStats.get(key) || { count: 0, totalTime: 0, avgTime: 0 };

  stats.count += 1;
  stats.totalTime += duration;
  stats.avgTime = stats.totalTime / stats.count;

  // Track slow queries
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    stats.slowCount = (stats.slowCount || 0) + 1;
    logger.warn('Slow query detected:', {
      collection,
      operation,
      duration: `${duration}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
    });
  }

  // Prevent unbounded growth by limiting entries
  if (queryStats.size >= MAX_STATS_ENTRIES && !queryStats.has(key)) {
    // Remove oldest entry (first key in Map maintains insertion order)
    const firstKey = queryStats.keys().next().value;
    queryStats.delete(firstKey);
  }

  queryStats.set(key, stats);
};

export const getQueryStats = () => {
  const result = {};
  queryStats.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

export default {
  enableQueryProfiling,
  trackQuery,
  getQueryStats,
  clearQueryStats,
  queryStats,
};
