import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, tours: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, toursRes, bookingsRes] = await Promise.all([
          API.get('/admin/users'),
          API.get('/admin/tours'),
          API.get('/admin/bookings')
        ]);

        setStats({
          users: usersRes.data.length,
          tours: toursRes.data.length,
          bookings: bookingsRes.data.length
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data.');
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard title="Users" value={stats.users} />
      <DashboardCard title="Tours" value={stats.tours} />
      <DashboardCard title="Bookings" value={stats.bookings} />
    </div>
  );
}

export default Dashboard;