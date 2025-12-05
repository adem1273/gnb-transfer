import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function RevenueAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
        {error}
      </div>
    );
  }

  const { summary, revenueByStatus, revenueTrend, topRevenueSources } = analyticsData || {};

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">💰 Revenue & KPI Analytics</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Summary KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-semibold opacity-90">Total Revenue</h3>
              <p className="text-3xl font-bold">${summary.totalRevenue.toFixed(2)}</p>
              <p className="text-xs mt-1">
                {summary.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.revenueGrowth)}% vs prev
                period
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-semibold opacity-90">Total Bookings</h3>
              <p className="text-3xl font-bold">{summary.totalBookings}</p>
              <p className="text-xs mt-1">
                {summary.bookingGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.bookingGrowth)}% vs prev
                period
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-semibold opacity-90">Avg Order Value</h3>
              <p className="text-3xl font-bold">${summary.aov.toFixed(2)}</p>
              <p className="text-xs mt-1">Per booking</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <h3 className="text-sm font-semibold opacity-90">Repeat Rate</h3>
              <p className="text-3xl font-bold">{summary.repeatBookingRate.toFixed(1)}%</p>
              <p className="text-xs mt-1">Customer retention</p>
            </div>
          </div>
        )}

        {/* Revenue Trend Chart */}
        {revenueTrend && revenueTrend.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">📈 Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Status */}
        {revenueByStatus && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 Revenue by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm text-gray-600">Completed</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${revenueByStatus.completed.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm text-gray-600">Confirmed</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${revenueByStatus.confirmed.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm text-gray-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  ${revenueByStatus.pending.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm text-gray-600">Cancelled</h3>
                <p className="text-2xl font-bold text-red-600">
                  ${revenueByStatus.cancelled.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Revenue Sources */}
        {topRevenueSources && topRevenueSources.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">🏆 Top Revenue Sources</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topRevenueSources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tourName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default RevenueAnalytics;
