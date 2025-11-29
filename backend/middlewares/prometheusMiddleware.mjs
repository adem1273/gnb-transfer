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
  let finished = false;

  const recordMetrics = () => {
    if (finished) return;
    finished = true;

    const duration = (Date.now() - startTime) / 1000;
    // Normalize route to avoid high cardinality (replace IDs with :id)
    let route = req.route?.path || req.path || 'unknown';
    route = route.split('?')[0].replace(/\/[0-9a-f]{24}/gi, '/:id');
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();
  };

  // On response finish
  res.on('finish', recordMetrics);
  // Handle abrupt connection close
  res.on('close', recordMetrics);

  next();
};
