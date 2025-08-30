import React from 'react';
import { logout } from '../utils/auth';

function Header() {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center ml-64">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </header>
  );
}

export default Header;
