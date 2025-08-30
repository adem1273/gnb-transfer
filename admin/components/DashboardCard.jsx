import React from 'react';

function DashboardCard({ title, value }) {
  return (
    <div className="bg-white p-4 shadow rounded text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
}

export default DashboardCard;
