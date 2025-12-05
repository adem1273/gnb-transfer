// Dashboard.jsx - GNB Pro Final
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    tours: 0,
    bookings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await API.get('/admin/users');
        const toursRes = await API.get('/admin/tours');
        const bookingsRes = await API.get('/admin/bookings');

        setStats({
          users: usersRes.data.length,
          tours: toursRes.data.length,
          bookings: bookingsRes.data.length,
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard stats.');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Dashboard" />
        <div className="p-4 max-w-6xl mx-auto">
          <Helmet>
            <title>GNB Transfer Admin | Dashboard</title>
          </Helmet>

          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

          {loading && <p className="text-center text-gray-500">Loading stats...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-100 rounded shadow text-center">
                <h3 className="text-xl font-semibold">Users</h3>
                <p className="text-2xl">{stats.users}</p>
              </div>
              <div className="p-4 bg-green-100 rounded shadow text-center">
                <h3 className="text-xl font-semibold">Tours</h3>
                <p className="text-2xl">{stats.tours}</p>
              </div>
              <div className="p-4 bg-yellow-100 rounded shadow text-center">
                <h3 className="text-xl font-semibold">Bookings</h3>
                <p className="text-2xl">{stats.bookings}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
