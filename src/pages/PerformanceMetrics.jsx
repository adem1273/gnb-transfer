import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import API from '../utils/api';
// import Loading from '../components/Loading';
// import ErrorMessage from '../components/ErrorMessage';

// const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
const TIME_RANGES = [
  { value: '5m', label: 'Last 5 Minutes' },
  { value: '30m', label: 'Last 30 Minutes' },
  { value: '1h', label: 'Last Hour' },
];

function PerformanceMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('5m');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connected, setConnected] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch metrics from API
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await API.get(`/admin/metrics?timeRange=${timeRange}`);
      const { data } = response.data;
      setMetrics(data);
      setLoading(false);
      setError('');

      // Add to historical data
      setHistoricalData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date(data.timestamp).toLocaleTimeString(),
            responseTime: parseFloat(data.performance.avgResponseTime),
            requestRate: parseFloat(data.performance.requestRate),
            errorRate: parseFloat(data.performance.errorRate),
            cacheHitRatio: parseFloat(data.cache.hitRatio),
            activeConnections: data.performance.activeConnections,
            cpuUsage: parseFloat(data.system.cpu),
            memoryUsage: parseFloat(data.system.memory),
          },
        ];
        return newData.slice(-20);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch metrics:', err);
      setError('Failed to fetch metrics data');
      setLoading(false);
    }
  }, [timeRange]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    // eslint-disable-next-line no-console
    console.log('Starting polling fallback');
    fetchMetrics(); // Fetch immediately

    pollingIntervalRef.current = setInterval(() => {
      if (autoRefresh) {
        fetchMetrics();
      }
    }, 5000);
  }, [autoRefresh, fetchMetrics]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return undefined;
    }

    // Try Socket.IO first
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socketUrl = apiUrl.replace('/api', '');

      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('Connected to metrics socket');
        setConnected(true);
        setError('');

        // Subscribe to metrics updates
        socket.emit('metrics:subscribe', { updateInterval: 5000 });
      });

      socket.on('metrics:update', (data) => {
        setMetrics(data);
        setLoading(false);

        // Add to historical data for charts
        setHistoricalData((prev) => {
          const newData = [
            ...prev,
            {
              time: new Date(data.timestamp).toLocaleTimeString(),
              responseTime: parseFloat(data.performance.avgResponseTime),
              requestRate: parseFloat(data.performance.requestRate),
              errorRate: parseFloat(data.performance.errorRate),
              cacheHitRatio: parseFloat(data.cache.hitRatio),
              activeConnections: data.performance.activeConnections,
              cpuUsage: parseFloat(data.system.cpu),
              memoryUsage: parseFloat(data.system.memory),
            },
          ];

          // Keep only last 20 data points
          return newData.slice(-20);
        });
      });

      socket.on('metrics:error', (metricsError) => {
        // eslint-disable-next-line no-console
        console.error('Metrics error:', metricsError);
        setError(metricsError.message || 'Failed to fetch metrics');
      });

      socket.on('disconnect', () => {
        // eslint-disable-next-line no-console
        console.log('Disconnected from metrics socket');
        setConnected(false);

        // Fallback to polling if socket disconnects
        startPolling();
      });

      socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.error('Socket connection error:', err);
        setConnected(false);

        // Fallback to polling
        startPolling();
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Socket.IO initialization failed:', err);
      // Fallback to polling
      startPolling();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('metrics:unsubscribe');
        socketRef.current.disconnect();
      }
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <ErrorMessage message="No metrics data available" />;
  }

  const cacheData = [
    { name: 'Hits', value: metrics.cache.hits, color: '#10b981' },
    { name: 'Misses', value: metrics.cache.misses, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Metrics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time monitoring • Updated every 5 seconds
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}
            />
            <span className="text-sm font-medium">{connected ? 'Live' : 'Polling'}</span>
          </div>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            aria-label="Time range selector"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Auto-refresh Toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              autoRefresh
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={`Auto-refresh ${autoRefresh ? 'enabled' : 'disabled'}`}
          >
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
            aria-label="Refresh metrics"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.performance.avgResponseTime} ms`}
          trend={parseFloat(metrics.performance.avgResponseTime) < 100 ? 'good' : 'warning'}
          icon="⚡"
        />
        <MetricCard
          title="Request Rate"
          value={`${metrics.performance.requestRate} req/s`}
          trend="neutral"
          icon="📊"
        />
        <MetricCard
          title="Cache Hit Ratio"
          value={`${metrics.cache.hitRatio.toFixed(1)}%`}
          trend={metrics.cache.hitRatio > 80 ? 'good' : 'warning'}
          icon="💾"
        />
        <MetricCard
          title="Active Connections"
          value={metrics.performance.activeConnections}
          trend="neutral"
          icon="🔌"
        />
      </div>

      {/* Response Time & Request Rate Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Response Time & Request Rate Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis
              yAxisId="left"
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Request Rate', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="responseTime"
              stroke="#3b82f6"
              name="Response Time (ms)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="requestRate"
              stroke="#10b981"
              name="Request Rate (req/s)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cache Performance & System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Hit/Miss Ratio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Cache Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cacheData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                dataKey="value"
              >
                {cacheData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Keys</p>
              <p className="text-lg font-bold">{metrics.cache.keys}</p>
            </div>
            <div>
              <p className="text-gray-600">Hit Ratio</p>
              <p className="text-lg font-bold text-green-600">
                {metrics.cache.hitRatio.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">System Resources</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm font-bold">{metrics.system.cpu}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(parseFloat(metrics.system.cpu), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm font-bold">{metrics.system.memory.toFixed(2)} MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{
                    width: `${Math.min((parseFloat(metrics.system.memory) / 512) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm font-bold">{metrics.performance.errorRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-red-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(parseFloat(metrics.performance.errorRate), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Endpoints */}
      {metrics.slowEndpoints && metrics.slowEndpoints.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Slow Endpoints</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.slowEndpoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Avg Duration (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgDuration" fill="#ef4444" name="Avg Duration (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Database & Queue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Database Performance</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Query Count</span>
              <span className="font-bold">{metrics.database.queryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Query Time</span>
              <span className="font-bold">{metrics.database.avgQueryTime} ms</span>
            </div>
            {metrics.database.slowQueries && metrics.database.slowQueries.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Slow Queries</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {metrics.database.slowQueries.map((query, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{query.operation}</span>
                        <span className="text-red-600 font-bold">{query.duration} ms</span>
                      </div>
                      <span className="text-gray-600">{query.collection}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Queue Stats */}
        {metrics.queue && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Queue Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.queue.waiting}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{metrics.queue.active}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{metrics.queue.failed}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.queue.processed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Metric Card Component
function MetricCard({ title, value, trend, icon }) {
  const trendColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    neutral: 'bg-gray-50 border-gray-200',
  };

  return (
    <div className={`rounded-lg shadow p-4 border-2 ${trendColors[trend] || trendColors.neutral}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default PerformanceMetrics;
