# Performance Monitoring Dashboard

## Overview

The Performance Monitoring Dashboard provides real-time visibility into the application's performance metrics, including response times, request rates, cache performance, database queries, system resources, and queue statistics.

## Features

### Real-Time Monitoring
- **Socket.IO Integration**: Live metrics updates every 5 seconds
- **Polling Fallback**: Automatic fallback to HTTP polling if WebSocket connection fails
- **Connection Status Indicator**: Visual indication of connection state (Live/Polling)

### Key Metrics

#### Performance Metrics
- **Average Response Time**: Average HTTP request duration in milliseconds
- **Request Rate**: Number of requests per second
- **Error Rate**: Percentage of failed requests
- **Active Connections**: Current number of active HTTP connections

#### Cache Performance
- **Cache Hit Ratio**: Percentage of cache hits vs total cache operations
- **Cache Hits/Misses**: Absolute counts of cache operations
- **Total Cache Keys**: Number of keys stored in cache

#### Database Performance
- **Query Count**: Total number of database queries
- **Average Query Time**: Average database query duration in milliseconds
- **Slow Queries**: List of queries taking more than 100ms with operation details

#### System Resources
- **CPU Usage**: Process CPU utilization percentage
- **Memory Usage**: Process memory consumption in MB

#### Queue Statistics (if BullMQ enabled)
- **Waiting Jobs**: Number of jobs waiting in queue
- **Active Jobs**: Number of currently processing jobs
- **Failed Jobs**: Number of failed jobs
- **Processed Jobs**: Total number of processed jobs

### Interactive Charts

#### Response Time & Request Rate Trends
- Real-time line chart showing response time and request rate over the last 20 data points
- Dual Y-axis for different metric scales
- Automatic updates every 5 seconds

#### Cache Performance
- Pie chart showing cache hits vs misses distribution
- Visual representation of cache efficiency

#### Top Slow Endpoints
- Bar chart displaying endpoints with average response time > 100ms
- Sorted by slowest endpoints first
- Shows top 10 slow endpoints

### Controls

#### Time Range Selector
- **Last 5 Minutes**: Short-term monitoring
- **Last 30 Minutes**: Medium-term trends
- **Last Hour**: Long-term analysis

#### Auto-Refresh Toggle
- Enable/disable automatic metric updates
- Visual indication of auto-refresh state

#### Manual Refresh
- Force immediate metrics update
- Useful when auto-refresh is disabled

## Access

### URL
`/admin/metrics`

### Permissions
- **Admin Only**: Only users with `admin` role can access this dashboard
- Authentication required via JWT token

## Technical Implementation

### Backend

#### API Endpoint
`GET /api/admin/metrics?timeRange=5m`

**Query Parameters:**
- `timeRange`: Optional (default: '5m') - Options: '5m', '30m', '1h'

**Response Format:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-02T22:00:00.000Z",
    "timeRange": "5m",
    "performance": {
      "avgResponseTime": "45.23",
      "requestRate": "12.45",
      "errorRate": "0.15",
      "activeConnections": 8
    },
    "cache": {
      "hitRatio": 87.5,
      "hits": 350,
      "misses": 50,
      "keys": 128,
      "redis": { ... }
    },
    "database": {
      "queryCount": 256,
      "avgQueryTime": "12.34",
      "slowQueries": [...]
    },
    "system": {
      "cpu": "15.23",
      "memory": "245.67"
    },
    "slowEndpoints": [...],
    "queue": {
      "waiting": 5,
      "active": 2,
      "failed": 0,
      "processed": 1234
    }
  }
}
```

#### Socket.IO Events

**Connection:**
- Namespace: Default namespace
- Path: `/socket.io`
- Auth: JWT token via `auth.token` or `Authorization` header

**Events:**
- `metrics:subscribe` - Subscribe to real-time metrics updates
  - Payload: `{ updateInterval: 5000 }`
- `metrics:update` - Receive metrics update
  - Payload: Same as API response data
- `metrics:unsubscribe` - Unsubscribe from metrics updates
- `metrics:error` - Error notification
  - Payload: `{ message: "Error description" }`

#### Metrics Collection
- Uses existing Prometheus middleware (`metricsMiddleware`)
- Aggregates metrics from `metricsService.mjs`
- Parses Prometheus text format into structured JSON
- Calculates derived metrics (averages, ratios, etc.)

### Frontend

#### Component
`src/pages/PerformanceMetrics.jsx`

#### Dependencies
- `socket.io-client`: WebSocket communication
- `recharts`: Chart visualization
- `react`: UI framework

#### State Management
- Local component state using React hooks
- Historical data maintained for last 20 updates
- Automatic cleanup on unmount

#### Responsive Design
- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Breakpoints: sm (640px), md (768px), lg (1024px)

#### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Semantic HTML structure
- Color contrast compliance

## Usage Guide

### Accessing the Dashboard

1. Log in as an admin user
2. Navigate to **Settings** section in the sidebar
3. Click on **📊 Performance Metrics**

### Interpreting Metrics

#### Response Time
- **Good**: < 100ms (green indicator)
- **Warning**: 100-500ms (yellow indicator)
- **Critical**: > 500ms (red indicator)

#### Cache Hit Ratio
- **Excellent**: > 90%
- **Good**: 80-90%
- **Needs Improvement**: < 80%

#### Error Rate
- **Healthy**: < 1%
- **Warning**: 1-5%
- **Critical**: > 5%

#### Database Query Time
- **Fast**: < 10ms
- **Acceptable**: 10-50ms
- **Slow**: 50-100ms
- **Critical**: > 100ms (shown in slow queries list)

### Troubleshooting

#### "Failed to fetch metrics"
- Check backend server is running
- Verify admin authentication token is valid
- Check network connectivity

#### "Socket connection failed"
- Dashboard automatically falls back to polling
- Check firewall settings for WebSocket connections
- Verify CORS configuration allows your domain

#### Metrics not updating
- Check auto-refresh toggle is ON
- Click manual refresh button
- Verify Socket.IO service is running on backend

## Security Considerations

### Authentication
- JWT token verification on all requests
- Admin role requirement enforced
- Token expiry handling

### Data Exposure
- Metrics contain no sensitive user data
- Endpoint paths are sanitized (IDs replaced with `:id`)
- Error messages don't expose internal details

### Rate Limiting
- Socket.IO connections are rate-limited
- HTTP endpoint uses global rate limiter
- Admin-only access reduces attack surface

## Performance Impact

### Backend
- Minimal overhead from Prometheus metrics collection
- Socket.IO broadcasts only when clients connected
- Metrics parsing cached for 5-second intervals

### Frontend
- Lazy-loaded component (not in main bundle)
- Historical data limited to last 20 points
- Efficient React re-renders with proper memoization

### Network
- WebSocket: ~1-2KB per update (every 5s)
- HTTP Polling: ~3-5KB per request (every 5s)
- Compressed payloads via brotli/gzip

## Future Enhancements

### Planned Features
- [ ] Historical metrics retention (24h, 7d, 30d)
- [ ] Custom alert thresholds
- [ ] Export metrics to CSV/JSON
- [ ] Comparison between time periods
- [ ] Endpoint filtering and search
- [ ] Custom dashboard layouts
- [ ] Integration with external monitoring tools (Grafana, Datadog)

### Configuration Options
- [ ] Configurable update intervals
- [ ] Metric selection (show/hide specific metrics)
- [ ] Custom slow query threshold
- [ ] Dashboard themes (dark mode)

## Related Documentation

- [Prometheus Middleware](../backend/middlewares/prometheusMiddleware.mjs)
- [Metrics Service](../backend/services/metricsService.mjs)
- [Admin Routes](../backend/routes/adminRoutes.mjs)
- [Socket.IO Configuration](../backend/services/metricsSocketService.mjs)

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with label `performance-monitoring`
3. Include browser console logs and network tab screenshots
4. Specify admin credentials used (without passwords)
