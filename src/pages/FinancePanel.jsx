import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

function FinancePanel() {
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const { toast } = useToast();
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const [overviewRes, forecastRes] = await Promise.all([
        API.get(`/finance/overview?${params.toString()}`),
        API.get('/finance/forecast?days=30'),
      ]);

      setOverview(overviewRes.data.data);
      setForecast(forecastRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load finance data');
      setLoading(false);
    }
  };

  const handleExport = async (format, type) => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      let url = '';
      if (format === 'csv') {
        url = type === 'bookings' ? '/finance/export/bookings' : '/finance/export/revenue';
      } else {
        url = type === 'bookings' ? '/finance/export/bookings-pdf' : '/finance/export/revenue-pdf';
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type}-${format === 'csv' ? 'export.csv' : 'report.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export completed successfully!');
    } catch (err) {
      const { userMessage } = handleError(err, 'exporting data');
      toast.error(userMessage);
    }
  };

  if (loading) return <Loading message="Loading finance data..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!overview) return <div>No data available</div>;

  const paymentMethodData = Object.entries(overview.paymentMethods || {}).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Finance Panel</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv', 'bookings')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Bookings CSV
          </button>
          <button
            onClick={() => handleExport('pdf', 'revenue')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Revenue Report PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <button
            onClick={fetchFinanceData}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg">
          <div className="text-sm opacity-90">Total Revenue</div>
          <div className="text-3xl font-bold mt-2">
            ${overview.summary.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg">
          <div className="text-sm opacity-90">Total Bookings</div>
          <div className="text-3xl font-bold mt-2">{overview.summary.totalBookings}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg">
          <div className="text-sm opacity-90">Estimated Profit</div>
          <div className="text-3xl font-bold mt-2">
            ${overview.summary.estimatedProfit.toLocaleString()}
          </div>
          <div className="text-xs opacity-75 mt-1">
            {overview.summary.profitMargin.toFixed(1)}% margin
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-6 rounded-lg shadow-lg">
          <div className="text-sm opacity-90">Avg Booking Value</div>
          <div className="text-3xl font-bold mt-2">
            ${overview.summary.avgBookingValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {overview.monthlyBreakdown && overview.monthlyBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Revenue & Profit</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overview.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#667eea" name="Revenue" />
              <Bar dataKey="estimatedProfit" fill="#10b981" name="Estimated Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Methods */}
      {paymentMethodData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue by Payment Method</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Booking Forecast */}
      {forecast && forecast.bookingForecast && forecast.bookingForecast.success && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            30-Day Booking Forecast
            <span className="text-sm text-gray-500 ml-2">
              ({forecast.bookingForecast.analytics.trend} trend)
            </span>
          </h2>
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">
              {forecast.bookingForecast.analytics.interpretation}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast.bookingForecast.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="predictedBookings"
                stroke="#667eea"
                strokeWidth={2}
                name="Predicted Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default FinancePanel;
