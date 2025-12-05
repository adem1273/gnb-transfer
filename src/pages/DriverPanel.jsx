import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function DriverPanel() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/drivers');
      setDrivers(response.data?.data || []);
    } catch (err) {
      setError(t('drivers.fetchError') || 'Failed to fetch driver information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'on_trip':
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'available':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'on_trip':
      case 'busy':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  if (loading) {
    return <Loading message={t('drivers.loading') || 'Loading driver information...'} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDrivers} />;
  }

  // Calculate dashboard statistics
  const stats = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((d) => d.status === 'active' || d.status === 'available').length,
    onTripDrivers: drivers.filter((d) => d.status === 'on_trip' || d.status === 'busy').length,
    offlineDrivers: drivers.filter((d) => d.status === 'offline' || d.status === 'inactive').length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('drivers.panelTitle') || 'Driver Panel'}
      </h1>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">
                {t('drivers.totalDrivers') || 'Total Drivers'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{t('drivers.activeDrivers') || 'Active'}</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{t('drivers.onTrip') || 'On Trip'}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.onTripDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-full">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{t('drivers.offline') || 'Offline'}</p>
              <p className="text-2xl font-bold text-gray-600">{stats.offlineDrivers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('drivers.driverList') || 'Driver List'}
          </h2>
        </div>

        {drivers.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="mt-4 text-gray-600">{t('drivers.noDrivers') || 'No drivers found'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {drivers.map((driver) => (
              <div key={driver._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-600">
                          {driver.name?.charAt(0).toUpperCase() || 'D'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-500">{driver.phone || driver.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(driver.status)}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}
                      >
                        {driver.status || 'offline'}
                      </span>
                    </div>
                    {driver.currentTrip && (
                      <div className="text-sm text-gray-500">
                        {t('drivers.currentTrip') || 'Current Trip'}: {driver.currentTrip}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverPanel;
