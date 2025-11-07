import React from 'react';

function DashboardCard({ title, value, icon, color = 'blue' }) {
  return (
    <div className={`p-6 rounded-lg shadow-md bg-${color}-50 border border-${color}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );
}

export default DashboardCard;
