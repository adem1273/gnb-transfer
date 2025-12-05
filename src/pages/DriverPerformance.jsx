import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function DriverPerformance() {
  const [driverStats, setDriverStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchDriverStats();
  }, [period]);

  const fetchDriverStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/drivers/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDriverStats(response.data.data.driverStats);
        setSummary(response.data.data.summary);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch driver statistics');
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

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Driver Performance Dashboard</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Total Drivers</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.totalDrivers}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Active Drivers</h3>
              <p className="text-3xl font-bold text-green-600">{summary.activeDrivers}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Total Bookings</h3>
              <p className="text-3xl font-bold text-purple-600">{summary.totalBookings}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Avg On-Time Rate</h3>
              <p className="text-3xl font-bold text-yellow-600">{summary.avgOnTimeRate}%</p>
            </div>
          </div>
        )}

        {/* Driver Stats Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Driver</th>
                <th className="py-3 px-4 text-center">Total Bookings</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Revenue</th>
                <th className="py-3 px-4 text-center">On-Time Rate</th>
                <th className="py-3 px-4 text-center">Rating</th>
              </tr>
            </thead>
            <tbody>
              {driverStats.length > 0 ? (
                driverStats.map((driver) => (
                  <tr key={driver.driverId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{driver.driverName}</div>
                        <div className="text-sm text-gray-500">{driver.driverEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{driver.totalBookings}</td>
                    <td className="py-3 px-4 text-center">{driver.completedBookings}</td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      ${driver.revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded ${
                          driver.onTimeRate >= 90
                            ? 'bg-green-100 text-green-800'
                            : driver.onTimeRate >= 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {driver.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className="text-yellow-500">⭐</span>
                        <span className="ml-1">{driver.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">({driver.totalRatings})</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    No driver statistics available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DriverPerformance;
