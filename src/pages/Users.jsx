// Users.jsx - GNB Pro Final
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/users'); // authMiddleware backend tarafından kontrol edilecek
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Users" />
        <div className="p-4 max-w-6xl mx-auto">
          <Helmet>
            <title>GNB Transfer Admin | Users</title>
          </Helmet>

          <h2 className="text-2xl font-bold mb-4">User Management</h2>

          {loading && <p className="text-center text-gray-500">Loading users...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2 flex gap-2">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                      {/* İleride Edit butonu eklenebilir */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
