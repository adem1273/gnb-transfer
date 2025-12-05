import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CorporateClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    taxNumber: '',
    address: '',
    contactPerson: '',
    billingEmail: '',
    discount: 0,
  });

  useEffect(() => {
    fetchClients();
  }, [searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const searchParam = searchTerm ? `&search=${searchTerm}` : '';
      const response = await axios.get(`${API_URL}/admin/corporate?${searchParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setClients(response.data.data.clients);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch corporate clients');
    } finally {
      setLoading(false);
    }
  };

  const createCorporateClient = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/corporate`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSuccess('Corporate client created successfully');
        setShowCreateForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          companyName: '',
          taxNumber: '',
          address: '',
          contactPerson: '',
          billingEmail: '',
          discount: 0,
        });
        fetchClients();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create corporate client');
    }
  };

  if (loading && !showCreateForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🏢 Corporate Client Management</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showCreateForm ? '← Back to List' : '+ Add Corporate Client'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {showCreateForm ? (
          <form onSubmit={createCorporateClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Number</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Email</label>
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
            >
              Create Corporate Client
            </button>
          </form>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded px-4 py-2"
              />
            </div>

            {/* Clients List */}
            <div className="space-y-4">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <div
                    key={client._id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">
                          {client.corporateDetails?.companyName || 'N/A'}
                        </h3>
                        <p className="text-gray-600">Contact: {client.name}</p>
                        <p className="text-gray-600">Email: {client.email}</p>
                        {client.corporateDetails?.taxNumber && (
                          <p className="text-sm text-gray-500">
                            Tax Number: {client.corporateDetails.taxNumber}
                          </p>
                        )}
                        {client.stats && (
                          <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-blue-600">
                              📊 {client.stats.totalBookings} bookings
                            </span>
                            <span className="text-green-600">
                              💰 ${client.stats.totalSpent.toFixed(2)} spent
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {client.corporateDetails?.discount > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            {client.corporateDetails.discount}% discount
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">No corporate clients found</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CorporateClients;
