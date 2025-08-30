import React from 'react';

function TrustBadge({ title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-xs mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default TrustBadge;