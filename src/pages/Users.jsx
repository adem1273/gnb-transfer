// Users.jsx - GNB Pro Final - Updated with ConfirmModal and ToastProvider
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { ConfirmModal, LoadingButton } from '../components/ui';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/users');
        setUsers(res.data);
        setLoading(false);
        setError('');
      } catch (err) {
        const { userMessage } = handleError(err, 'loading users');
        setError(userMessage);
        setLoading(false);
        toast.error(userMessage);
      }
    };
    fetchUsers();
  }, [toast]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete._id);
    try {
      await API.delete(`/users/${userToDelete._id}`);
      setUsers(users.filter((user) => user._id !== userToDelete._id));
      toast.success(`User "${userToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      const { userMessage } = handleError(err, 'deleting user');
      
      // Check for permission error
      if (err.status === 403) {
        toast.error('You do not have permission to delete users');
      } else {
        toast.error(userMessage);
      }
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
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
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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
                      <LoadingButton
                        type="button"
                        onClick={() => handleDeleteClick(user)}
                        loading={deletingUserId === user._id}
                        variant="danger"
                        className="px-2 py-1 text-sm"
                      >
                        Delete
                      </LoadingButton>
                      {/* Future: Add Edit button here */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            open={deleteModalOpen}
            title="Delete User"
            message={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone.`}
            confirmButtonText="Delete"
            cancelButtonText="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        </div>
      </div>
    </div>
  );
}

export default Users;
