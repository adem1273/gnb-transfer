import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function FeatureManagement() {
  const { user } = useAuth();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/features`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setFeatures(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId, currentState) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/features/toggle`,
        {
          featureId,
          enabled: !currentState,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess(`Feature ${!currentState ? 'enabled' : 'disabled'} successfully`);
        fetchFeatures(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle feature');
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
        <h1 className="text-3xl font-bold mb-6">Feature Management</h1>
        
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

        <div className="space-y-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{feature.name}</h3>
                  <p className="text-gray-600 mt-1">{feature.description}</p>
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span>📍 Route: {feature.route}</span>
                    <span>🔐 Permission: {feature.permission}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>🌐 API: {feature.api}</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => toggleFeature(feature.id, feature.enabled)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      feature.enabled
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                    }`}
                  >
                    {feature.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No features found. Please check your database configuration.
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Feature Toggle Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Features are disabled by default for safety</li>
          <li>• Disabled features return 503 Service Unavailable</li>
          <li>• Changes take effect immediately (cached for 60 seconds)</li>
          <li>• Only admins can toggle features</li>
        </ul>
      </div>
    </div>
  );
}

export default FeatureManagement;
