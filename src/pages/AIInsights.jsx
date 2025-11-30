import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../utils/api';

function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await API.get(`/admin/insights?${params.toString()}`);
      setInsights(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchInsights();
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Helmet>
        <title>AI Insights | GNB Transfer Admin</title>
      </Helmet>

      <h2 className="text-3xl font-bold mb-6">AI-Powered Insights</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleFilterChange}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' });
              setTimeout(() => fetchInsights(), 0);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {insights && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold mb-2">Total Bookings</h3>
              <p className="text-3xl font-bold">{insights.summary.totalBookings}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold">${insights.summary.totalRevenue}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold mb-2">Avg Booking Value</h3>
              <p className="text-3xl font-bold">${insights.summary.avgBookingValue}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{insights.summary.totalUsers}</p>
            </div>
          </div>

          {insights.mostPopularTour && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Most Popular Tour</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-blue-600">
                    {insights.mostPopularTour.name}
                  </p>
                  <p className="text-gray-600">
                    {insights.mostPopularTour.bookings} bookings
                  </p>
                </div>
                <div className="text-5xl">🏆</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Revenue Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={insights.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Bookings Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">AI Suggestions</h3>
            <div className="space-y-3">
              {insights.aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AIInsights;
