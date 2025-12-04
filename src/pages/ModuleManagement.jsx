import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';

function ModuleManagement() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await API.get('/admin/settings');
      setSettings(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleToggle = (module) => {
    setSettings({
      ...settings,
      activeModules: {
        ...settings.activeModules,
        [module]: !settings.activeModules[module],
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await API.patch('/admin/settings', {
        activeModules: settings.activeModules,
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Helmet>
        <title>Module Management | GNB Transfer Admin</title>
      </Helmet>

      <h2 className="text-3xl font-bold mb-6">Module Management</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-6">
          Enable or disable major system modules. Disabled modules will return a 503 error when accessed.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(settings.activeModules).map(([module, isActive]) => (
            <div
              key={module}
              className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold capitalize">{module}</h3>
                <p className="text-sm text-gray-600">
                  {module === 'tours' && 'Manage tour listings and details'}
                  {module === 'users' && 'User management and authentication'}
                  {module === 'bookings' && 'Booking system and reservations'}
                  {module === 'payments' && 'Payment processing and transactions'}
                </p>
              </div>
              <button
                onClick={() => handleToggle(module)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleManagement;
