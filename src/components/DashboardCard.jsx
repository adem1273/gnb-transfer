import React from 'react';

function DashboardCard({ title, value, subtitle, trend, icon, color = 'blue' }) {
  // Map color to specific Tailwind classes to avoid purging
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-6 rounded-lg shadow-md ${colors.bg} border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && (
            <div className="mt-2 flex items-center text-sm">
              {trend === 'up' && (
                <svg
                  className="w-4 h-4 text-green-500 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
              {trend === 'down' && (
                <svg
                  className="w-4 h-4 text-red-500 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              <span
                className={
                  trend === 'up'
                    ? 'text-green-700'
                    : trend === 'down'
                      ? 'text-red-700'
                      : 'text-gray-600'
                }
              >
                {subtitle}
              </span>
            </div>
          )}
        </div>
        {icon && <div className="text-3xl ml-4">{icon}</div>}
      </div>
    </div>
  );
}

export default DashboardCard;
