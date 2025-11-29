import mongoose from 'mongoose';
import logger from '../config/logger.mjs';

const SLOW_QUERY_THRESHOLD_MS = 100;

export const enableQueryProfiling = () => {
  mongoose.set('debug', (collectionName, methodName, ...args) => {
    const startTime = Date.now();

    // Log slow queries
    process.nextTick(() => {
      const duration = Date.now() - startTime;
      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('Slow query detected:', {
          collection: collectionName,
          method: methodName,
          duration: `${duration}ms`,
          query: JSON.stringify(args[0] || {}).substring(0, 200),
        });
      }
    });
  });
};

export const queryStats = new Map();

export const trackQuery = (collection, operation, duration) => {
  const key = `${collection}.${operation}`;
  const stats = queryStats.get(key) || { count: 0, totalTime: 0, avgTime: 0 };

  stats.count += 1;
  stats.totalTime += duration;
  stats.avgTime = stats.totalTime / stats.count;

  queryStats.set(key, stats);
};

export const getQueryStats = () => {
  const result = {};
  queryStats.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

export default { enableQueryProfiling, trackQuery, getQueryStats, queryStats };
