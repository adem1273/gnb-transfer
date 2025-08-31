import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 w-64 h-full bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6">GNB Admin</h2>
      <nav className="flex flex-col gap-2">
        {user?.role === 'admin' && (
          <>
            <Link to="/dashboard" className="px-2 py-1 hover:bg-gray-700 rounded">Dashboard</Link>
            <Link to="/users" className="px-2 py-1 hover:bg-gray-700 rounded">User Management</Link>
            <Link to="/tours" className="px-2 py-1 hover:bg-gray-700 rounded">Tour Management</Link>
            <Link to="/bookings" className="px-2 py-1 hover:bg-gray-700 rounded">Bookings</Link>
            <Link to="/admin/ai" className="px-2 py-1 hover:bg-gray-700 rounded">AI Admin</Link>
            <Link to="/admin/marketing" className="px-2 py-1 hover:bg-gray-700 rounded">AI Marketing</Link>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;