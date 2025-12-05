import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function FleetTrackingDashboard() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFleetData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchFleetData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFleetData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/fleet/live`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFleetData(response.data.data);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch fleet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚗 Live Fleet Tracking</h1>
          <button
            onClick={fetchFleetData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {fleetData?.summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Total Active</h3>
              <p className="text-3xl font-bold text-blue-600">{fleetData.summary.totalActive}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">In Progress</h3>
              <p className="text-3xl font-bold text-green-600">{fleetData.summary.inProgress}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600">Confirmed</h3>
              <p className="text-3xl font-bold text-yellow-600">{fleetData.summary.confirmed}</p>
            </div>
          </div>
        )}

        {/* Fleet Location List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Active Vehicles</h2>
          {fleetData?.fleetLocation && fleetData.fleetLocation.length > 0 ? (
            fleetData.fleetLocation.map((vehicle) => (
              <div
                key={vehicle.bookingId}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{vehicle.driver.name}</h3>
                    <p className="text-gray-600">📞 {vehicle.driver.phone}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Tour: {vehicle.tour?.title || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Pickup: {vehicle.pickup.location} at{' '}
                      {new Date(vehicle.pickup.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Dropoff: {vehicle.dropoff.location}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        vehicle.status === 'in_progress'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {vehicle.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(vehicle.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">No active vehicles at the moment</div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 text-right">
          Last updated:{' '}
          {fleetData?.timestamp ? new Date(fleetData.timestamp).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}

export default FleetTrackingDashboard;
