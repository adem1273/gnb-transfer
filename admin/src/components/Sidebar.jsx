import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const menu = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Tours', path: '/admin/tours' },
    { name: 'Bookings', path: '/admin/bookings' }
  ];

  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed">
      <div className="p-6 text-2xl font-bold">GNB Admin</div>
      <nav className="mt-6">
        {menu.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-6 py-3 hover:bg-gray-700 ${
              location.pathname === item.path ? 'bg-gray-700' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
