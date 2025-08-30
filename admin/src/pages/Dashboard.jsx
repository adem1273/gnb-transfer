import React, { useEffect, useState } from 'react';
import API from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, bookings: 0, tours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow p-4 rounded">
            <h3 className="text-xl font-semibold">Users</h3>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
          <div className="bg-white shadow p-4 rounded">
            <h3 className="text-xl font-semibold">Bookings</h3>
            <p className="text-2xl font-bold">{stats.bookings}</p>
          </div>
          <div className="bg-white shadow p-4 rounded">
            <h3 className="text-xl font-semibold">Tours</h3>
            <p className="text-2xl font-bold">{stats.tours}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
