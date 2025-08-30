import React from 'react';
import DashboardCard from '../components/DashboardCard';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard title="Users" value={120} />
      <DashboardCard title="Tours" value={35} />
      <DashboardCard title="Bookings" value={78} />
    </div>
  );
}

export default Dashboard;
