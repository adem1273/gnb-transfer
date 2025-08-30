// Loading.jsx - GNB Pro Final
import React from 'react';

function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex justify-center items-center py-8">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default Loading;
