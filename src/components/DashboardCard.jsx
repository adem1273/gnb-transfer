import React from 'react';

function DashboardCard({ title, value, icon, color = 'blue' }) {
  // Map color to specific Tailwind classes to avoid purging
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-6 rounded-lg shadow-md ${colors.bg} border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );
}

export default DashboardCard;
