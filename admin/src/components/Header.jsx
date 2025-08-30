import React from 'react';

function Header({ title }) {
  return (
    <header className="ml-64 p-4 bg-white shadow flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
