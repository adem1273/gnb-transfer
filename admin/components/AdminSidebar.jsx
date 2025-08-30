import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed">
      <div className="p-4 font-bold text-xl border-b border-gray-700">GNB Admin</div>
      <ul className="mt-4 space-y-2">
        <li><Link to="/dashboard" className="block p-2 hover:bg-gray-700 rounded">Dashboard</Link></li>
        <li><Link to="/users" className="block p-2 hover:bg-gray-700 rounded">Users</Link></li>
        <li><Link to="/tours" className="block p-2 hover:bg-gray-700 rounded">Tours</Link></li>
        <li><Link to="/bookings" className="block p-2 hover:bg-gray-700 rounded">Bookings</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;
