import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { Helmet } from 'react-helmet';

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, tours: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 ml-64">
      <Helmet>
        <title>GNB Admin | Dashboard</title>
      </Helmet>

      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

      {loading ? (
        <p>Loading statistics...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-bold text-xl">Users</h3>
            <p className="text-3xl mt-2">{stats.users}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-bold text-xl">Tours</h3>
            <p className="text-3xl mt-2">{stats.tours}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h3 className="font-bold text-xl">Bookings</h3>
            <p className="text-3xl mt-2">{stats.bookings}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
