import React, { useState, useEffect } from 'react';
import API from '../../utils/api';

/**
 * SystemSettingsPanel Component
 *
 * Displays and allows updating of system-wide settings including:
 * - Site status (online/maintenance)
 * - Maintenance message
 * - Feature toggles (booking, payment, registrations)
 *
 * @component
 */
function SystemSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    siteStatus: 'online',
    maintenanceMessage: '',
    bookingEnabled: true,
    paymentEnabled: true,
    registrationsEnabled: true,
  });

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/v1/super-admin/system-settings');
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        setSettings(data);
        setFormData({
          siteStatus: data.siteStatus || 'online',
          maintenanceMessage: data.maintenanceMessage || '',
          bookingEnabled: data.bookingEnabled ?? true,
          paymentEnabled: data.paymentEnabled ?? true,
          registrationsEnabled: data.registrationsEnabled ?? true,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch system settings');
      console.error('Error fetching system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate maintenance message length
    if (formData.maintenanceMessage.length > 500) {
      setError('Maintenance message cannot exceed 500 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await API.put('/v1/super-admin/system-settings', formData);

      if (response.data && response.data.success) {
        setSuccess('System settings updated successfully');
        setSettings(response.data.data);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update system settings');
      console.error('Error updating system settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">System Settings</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Status
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="siteStatus"
                value="online"
                checked={formData.siteStatus === 'online'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm">🟢 Online</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="siteStatus"
                value="maintenance"
                checked={formData.siteStatus === 'maintenance'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm">🔴 Maintenance</span>
            </label>
          </div>
        </div>

        {/* Maintenance Message */}
        <div>
          <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Message
          </label>
          <textarea
            id="maintenanceMessage"
            name="maintenanceMessage"
            value={formData.maintenanceMessage}
            onChange={handleInputChange}
            rows={3}
            maxLength={500}
            placeholder="Enter maintenance message (max 500 characters)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.maintenanceMessage.length}/500 characters
          </p>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Feature Controls</h3>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="bookingEnabled"
              checked={formData.bookingEnabled}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Booking Enabled</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="paymentEnabled"
              checked={formData.paymentEnabled}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Payment Enabled</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="registrationsEnabled"
              checked={formData.registrationsEnabled}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">User Registrations Enabled</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-gray-500">
            Last updated: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SystemSettingsPanel;
