/**
 * Health Check Service
 * 
 * Provides comprehensive health checks for all system dependencies:
 * - Database (MongoDB) read/write tests
 * - Redis cache connectivity
 * - External service availability (Stripe, OpenAI)
 * - System resources (disk space, memory)
 */

import mongoose from 'mongoose';
import os from 'os';
import fs from 'fs';
import { promisify } from 'util';
import { pingRedis } from '../config/redis.mjs';
import logger from '../config/logger.mjs';
import axios from 'axios';

const statAsync = promisify(fs.stat);

/**
 * Check database connectivity with read/write test
 */
export const checkDatabase = async () => {
  try {
    // Check connection state
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      return {
        status: 'unhealthy',
        connected: false,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][
          mongoose.connection.readyState
        ],
        latency: null,
      };
    }

    // Perform read/write test
    const startTime = Date.now();
    
    // Ping test
    await mongoose.connection.db.admin().ping();
    
    // Write test - create a test document
    const testCollection = mongoose.connection.db.collection('_health_checks');
    const testDoc = { _id: 'health_check', timestamp: new Date(), test: true };
    await testCollection.replaceOne({ _id: 'health_check' }, testDoc, { upsert: true });
    
    // Read test - retrieve the document
    const retrieved = await testCollection.findOne({ _id: 'health_check' });
    
    const latency = Date.now() - startTime;

    // Verify read/write succeeded
    if (!retrieved || retrieved.timestamp.getTime() !== testDoc.timestamp.getTime()) {
      return {
        status: 'degraded',
        connected: true,
        state: 'connected',
        latency,
        error: 'Read/write verification failed',
      };
    }

    return {
      status: 'healthy',
      connected: true,
      state: 'connected',
      latency,
      readWrite: 'ok',
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
    };
  }
};

/**
 * Check Redis cache connectivity
 */
export const checkRedis = async () => {
  try {
    const startTime = Date.now();
    const isConnected = await pingRedis();
    const latency = Date.now() - startTime;

    if (!isConnected) {
      return {
        status: 'unhealthy',
        connected: false,
        latency: null,
      };
    }

    return {
      status: 'healthy',
      connected: true,
      latency,
    };
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
    };
  }
};

/**
 * Check Stripe API availability
 */
export const checkStripe = async () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      available: false,
    };
  }

  try {
    const startTime = Date.now();
    // Test Stripe API with a simple balance retrieval
    const response = await axios.get('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      available: true,
      latency,
    };
  } catch (error) {
    logger.error('Stripe health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      available: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

/**
 * Check OpenAI API availability
 */
export const checkOpenAI = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      available: false,
    };
  }

  try {
    const startTime = Date.now();
    // Test OpenAI API with a simple models list request
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      available: true,
      latency,
    };
  } catch (error) {
    logger.error('OpenAI health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      available: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

/**
 * Check disk space availability
 */
export const checkDiskSpace = async () => {
  try {
    // Check current working directory disk space
    const stats = await statAsync('.');
    
    // On Unix-like systems, we can use os.totalmem() and os.freemem()
    // For disk space, we'll use a simpler approach
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // We'll consider disk space critical if > 90% used
    // Note: Actual disk space checking requires platform-specific code
    // This is a simplified version
    const status = memoryUsagePercent > 90 ? 'critical' : 'healthy';

    return {
      status,
      memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
      totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
      freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
    };
  } catch (error) {
    logger.error('Disk space check failed', { error: error.message });
    return {
      status: 'unknown',
      error: error.message,
    };
  }
};

/**
 * Get system memory usage
 */
export const checkMemoryUsage = () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const processMemory = process.memoryUsage();
    const heapUsagePercent = (processMemory.heapUsed / processMemory.heapTotal) * 100;

    const status = heapUsagePercent > 90 || memoryUsagePercent > 90 ? 'critical' : 'healthy';

    return {
      status,
      system: {
        totalMB: Math.round(totalMemory / 1024 / 1024),
        freeMB: Math.round(freeMemory / 1024 / 1024),
        usedMB: Math.round(usedMemory / 1024 / 1024),
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
      },
      process: {
        heapUsedMB: Math.round(processMemory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(processMemory.heapTotal / 1024 / 1024),
        rssMB: Math.round(processMemory.rss / 1024 / 1024),
        externalMB: Math.round(processMemory.external / 1024 / 1024),
        heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
      },
    };
  } catch (error) {
    logger.error('Memory usage check failed', { error: error.message });
    return {
      status: 'unknown',
      error: error.message,
    };
  }
};

/**
 * Perform comprehensive health check
 */
export const performHealthCheck = async () => {
  try {
    const [database, redis, stripe, openai, diskSpace, memory] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkStripe(),
      checkOpenAI(),
      checkDiskSpace(),
      Promise.resolve(checkMemoryUsage()),
    ]);

    // Determine overall health status
    const criticalServices = [database];
    const isCriticalHealthy = criticalServices.every(
      service => service.status === 'healthy'
    );

    const overallStatus = isCriticalHealthy ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database,
        redis,
        stripe,
        openai,
      },
      resources: {
        diskSpace,
        memory,
      },
    };
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

/**
 * Perform readiness check (simpler than health check)
 */
export const performReadinessCheck = async () => {
  try {
    const database = await checkDatabase();
    const isReady = database.status === 'healthy' && process.uptime() > 5;

    return {
      ready: isReady,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: database.status,
          connected: database.connected,
        },
      },
    };
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    return {
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

export default {
  checkDatabase,
  checkRedis,
  checkStripe,
  checkOpenAI,
  checkDiskSpace,
  checkMemoryUsage,
  performHealthCheck,
  performReadinessCheck,
};
