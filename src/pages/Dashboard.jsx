import React, { useEffect, useState } from 'react';
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
import DashboardCard from '../components/DashboardCard';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get(`/admin/analytics?period=${period}`);
      setAnalytics(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to fetch dashboard data.');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!analytics) {
    return <ErrorMessage message="No analytics data available" />;
  }

  const {
    summary,
    statusBreakdown,
    paymentMethodBreakdown,
    topTours,
    mostBookedTours,
    dailyRevenue,
  } = analytics;

  // Format status data for pie chart
  const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Format payment method data for pie chart
  const paymentData = Object.entries(paymentMethodBreakdown).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="365days">Last Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          subtitle={`${summary.revenueGrowth >= 0 ? '+' : ''}${summary.revenueGrowth.toFixed(1)}% vs previous period`}
          trend={summary.revenueGrowth >= 0 ? 'up' : 'down'}
        />
        <DashboardCard
          title="Total Bookings"
          value={summary.totalBookings}
          subtitle={`${summary.bookingsGrowth >= 0 ? '+' : ''}${summary.bookingsGrowth.toFixed(1)}% vs previous period`}
          trend={summary.bookingsGrowth >= 0 ? 'up' : 'down'}
        />
        <DashboardCard
          title="Total Users"
          value={summary.totalUsers}
          subtitle={`${summary.userGrowth >= 0 ? '+' : ''}${summary.userGrowth.toFixed(1)}% vs previous period`}
          trend={summary.userGrowth >= 0 ? 'up' : 'down'}
        />
        <DashboardCard title="Avg Booking Value" value={`$${summary.avgBookingValue.toFixed(2)}`} />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
            <Line type="monotone" dataKey="bookings" stroke="#82ca9d" name="Bookings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Booking Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#82ca9d"
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tours by Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Tours by Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Booked Tours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Most Booked Tours</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostBookedTours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
