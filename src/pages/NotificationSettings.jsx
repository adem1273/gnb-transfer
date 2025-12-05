import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';

function NotificationSettings() {
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

  const handleToggle = (setting) => {
    setSettings({
      ...settings,
      notificationSettings: {
        ...settings.notificationSettings,
        [setting]: !settings.notificationSettings[setting],
      },
    });
  };

  const handleEmailConfigChange = (field, value) => {
    setSettings({
      ...settings,
      emailConfig: {
        ...settings.emailConfig,
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await API.patch('/admin/settings', {
        notificationSettings: settings.notificationSettings,
        emailConfig: settings.emailConfig,
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
        <title>Notification Settings | GNB Transfer Admin</title>
      </Helmet>

      <h2 className="text-3xl font-bold mb-6">Notification Settings</h2>

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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Email Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure the sender email address and name for automated notifications.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Email</label>
            <input
              type="email"
              value={settings.emailConfig.fromEmail}
              onChange={(e) => handleEmailConfigChange('fromEmail', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Name</label>
            <input
              type="text"
              value={settings.emailConfig.fromName}
              onChange={(e) => handleEmailConfigChange('fromName', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Email Notifications</h3>
        <p className="text-gray-600 mb-4">
          Choose which events trigger automated email notifications.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
            <div>
              <h4 className="text-lg font-semibold">Booking Confirmation</h4>
              <p className="text-sm text-gray-600">
                Send confirmation email when a booking is created
              </p>
            </div>
            <button
              onClick={() => handleToggle('bookingConfirmation')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationSettings.bookingConfirmation ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationSettings.bookingConfirmation
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
            <div>
              <h4 className="text-lg font-semibold">Payment Received</h4>
              <p className="text-sm text-gray-600">
                Send confirmation email when payment is received
              </p>
            </div>
            <button
              onClick={() => handleToggle('paymentReceived')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationSettings.paymentReceived ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationSettings.paymentReceived ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
            <div>
              <h4 className="text-lg font-semibold">Campaign Started</h4>
              <p className="text-sm text-gray-600">Notify users when a new campaign starts</p>
            </div>
            <button
              onClick={() => handleToggle('campaignStarted')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationSettings.campaignStarted ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationSettings.campaignStarted ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
            <div>
              <h4 className="text-lg font-semibold">System Alerts</h4>
              <p className="text-sm text-gray-600">
                Send alerts for system errors and important events
              </p>
            </div>
            <button
              onClick={() => handleToggle('systemAlerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationSettings.systemAlerts ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationSettings.systemAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">📧 Email Setup Required</h4>
          <p className="text-sm text-blue-700">
            To enable email notifications, configure your SMTP settings in the .env file:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
            <li>EMAIL_PROVIDER (gmail, mailtrap, or smtp)</li>
            <li>EMAIL_USER (your email address)</li>
            <li>EMAIL_PASSWORD (app password for Gmail)</li>
          </ul>
        </div>
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
  );
}

export default NotificationSettings;
