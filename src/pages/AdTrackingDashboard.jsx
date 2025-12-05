import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../utils/api';
import Loading from '../components/Loading';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

function AdTrackingDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, campaignsRes] = await Promise.all([
        API.get(`/admin/tracking/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        API.get(`/admin/tracking/campaigns?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);

      setDashboard(dashboardRes.data.data);
      setCampaigns(campaignsRes.data.data.campaigns || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading tracking data..." />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📊 Ad Pixel & Conversion Tracking</h1>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboard?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Sessions</div>
            <div className="text-3xl font-bold mt-2">{dashboard.summary.totalSessions?.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Conversions</div>
            <div className="text-3xl font-bold mt-2">{dashboard.summary.totalConversions?.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Revenue</div>
            <div className="text-3xl font-bold mt-2">${dashboard.summary.totalRevenue?.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Conversion Rate</div>
            <div className="text-3xl font-bold mt-2">{dashboard.summary.conversionRate?.toFixed(2)}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Conversions Chart */}
        {dashboard?.dailyConversions && dashboard.dailyConversions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Daily Conversions</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.dailyConversions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#667eea" name="Sessions" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform Summary */}
        {dashboard?.platformSummary && dashboard.platformSummary.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Traffic by Platform</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.platformSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, sessions }) => `${platform}: ${sessions}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {dashboard.platformSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">AOV</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{campaign.campaign || '-'}</td>
                  <td className="px-4 py-3">{campaign.source || '-'}</td>
                  <td className="px-4 py-3">{campaign.medium || '-'}</td>
                  <td className="px-4 py-3 text-right">{campaign.sessions?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{campaign.conversions}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      campaign.conversionRate > 5 ? 'bg-green-100 text-green-800' :
                      campaign.conversionRate > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.conversionRate?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">${campaign.revenue?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${campaign.avgOrderValue?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No campaign data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pixel Integration Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🔌 Pixel Integration Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Google Analytics</div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Configure in Settings</span>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium">Google Ads</div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Configure in Settings</span>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📘</div>
            <div className="font-medium">Meta Pixel</div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Configure in Settings</span>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-medium">TikTok Pixel</div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Configure in Settings</span>
          </div>
        </div>
      </div>

      {/* Revenue by Platform */}
      {dashboard?.platformSummary && dashboard.platformSummary.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue by Platform</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard.platformSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#667eea" name="Revenue ($)" />
              <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default AdTrackingDashboard;
