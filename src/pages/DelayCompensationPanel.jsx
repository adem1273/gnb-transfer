import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function DelayCompensationPanel() {
  const [compensations, setCompensations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedCompensation, setSelectedCompensation] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCompensations();
  }, [statusFilter]);

  const fetchCompensations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/admin/delay/pending?status=${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCompensations(response.data.data.compensations);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch compensations');
    } finally {
      setLoading(false);
    }
  };

  const approveCompensation = async (id) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/delay/approve/${id}`,
        { notes },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess('Compensation approved successfully');
        setNotes('');
        setSelectedCompensation(null);
        fetchCompensations();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve compensation');
    }
  };

  const rejectCompensation = async (id) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/delay/reject/${id}`,
        { notes },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess('Compensation rejected successfully');
        setNotes('');
        setSelectedCompensation(null);
        fetchCompensations();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject compensation');
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">⏰ Delay Compensation Panel</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="applied">Applied</option>
          </select>
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

        {/* Compensations List */}
        <div className="space-y-4">
          {compensations.length > 0 ? (
            compensations.map((comp) => (
              <div key={comp._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      Booking #{comp.booking?.bookingNumber || 'N/A'}
                    </h3>
                    <p className="text-gray-600">Customer: {comp.user?.name}</p>
                    <p className="text-gray-600">Email: {comp.user?.email}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Delay:</span> {comp.delayMinutes} minutes
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Compensation:</span> {comp.compensationValue}
                        {comp.compensationType === 'percentage' ? '%' : ' EUR'}
                      </p>
                      {comp.discountCode && (
                        <p className="text-sm">
                          <span className="font-medium">Discount Code:</span>{' '}
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {comp.discountCode}
                          </span>
                        </p>
                      )}
                      {comp.aiSuggestion && (
                        <div className="mt-2 bg-blue-50 p-2 rounded">
                          <p className="text-sm text-blue-800">
                            🤖 AI Suggestion: {comp.aiSuggestion.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        comp.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : comp.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {comp.status}
                    </span>

                    {comp.status === 'pending' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={() => setSelectedCompensation(comp._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Modal */}
                {selectedCompensation === comp._id && (
                  <div className="mt-4 border-t pt-4">
                    <textarea
                      placeholder="Add notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-2"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveCompensation(comp._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => rejectCompensation(comp._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCompensation(null);
                          setNotes('');
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No {statusFilter} compensations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DelayCompensationPanel;
