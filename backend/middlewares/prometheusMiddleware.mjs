import {
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
} from '../services/metricsService.mjs';

export const metricsMiddleware = (req, res, next) => {
  // Track active connections
  activeConnections.inc();

  // Start timer
  const startTime = Date.now();

  // On response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();
  });

  next();
};
