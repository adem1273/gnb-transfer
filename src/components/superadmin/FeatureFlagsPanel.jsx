import { useState, useEffect } from 'react';
import API from '../../utils/api';

/**
 * FeatureFlagsPanel Component
 *
 * Displays and controls individual feature flags with optimistic UI updates.
 * - Booking Enabled
 * - Payment Enabled
 * - Registrations Enabled
 *
 * Uses optimistic UI: toggles immediately, reverts on error
 *
 * @component
 */
function FeatureFlagsPanel() {
  const [features, setFeatures] = useState({
    bookingEnabled: true,
    paymentEnabled: true,
    registrationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingFeature, setUpdatingFeature] = useState(null);

  // Fetch current feature flags on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get('/v1/super-admin/system-settings');

        if (response.data && response.data.data) {
          const settingsData = response.data.data;
          setFeatures({
            bookingEnabled: settingsData.bookingEnabled ?? true,
            paymentEnabled: settingsData.paymentEnabled ?? true,
            registrationsEnabled: settingsData.registrationsEnabled ?? true,
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch feature flags');
        console.error('Error fetching feature flags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const handleToggleFeature = async (featureName) => {
    // Store the current value for rollback
    const previousValue = features[featureName];
    const newValue = !previousValue;

    // Optimistic UI update
    setFeatures((prev) => ({
      ...prev,
      [featureName]: newValue,
    }));

    try {
      setUpdatingFeature(featureName);
      setError(null);

      // Send update to backend
      const response = await API.put('/v1/super-admin/system-settings', {
        [featureName]: newValue,
      });

      if (!response.data || !response.data.success) {
        throw new Error('Failed to update feature flag');
      }

      // Update with actual server response
      if (response.data.data) {
        setFeatures((prev) => ({
          ...prev,
          [featureName]: response.data.data[featureName],
        }));
      }
    } catch (err) {
      // Revert optimistic update on error
      setFeatures((prev) => ({
        ...prev,
        [featureName]: previousValue,
      }));
      
      setError(err.message || `Failed to update ${featureName}`);
      console.error(`Error updating ${featureName}:`, err);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingFeature(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Flags</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Booking Feature */}
        <FeatureToggle
          label="Booking System"
          description="Allow users to create new bookings"
          enabled={features.bookingEnabled}
          onToggle={() => handleToggleFeature('bookingEnabled')}
          isUpdating={updatingFeature === 'bookingEnabled'}
          icon="📅"
        />

        {/* Payment Feature */}
        <FeatureToggle
          label="Payment Processing"
          description="Enable payment transactions"
          enabled={features.paymentEnabled}
          onToggle={() => handleToggleFeature('paymentEnabled')}
          isUpdating={updatingFeature === 'paymentEnabled'}
          icon="💳"
        />

        {/* Registration Feature */}
        <FeatureToggle
          label="User Registrations"
          description="Allow new user sign-ups"
          enabled={features.registrationsEnabled}
          onToggle={() => handleToggleFeature('registrationsEnabled')}
          isUpdating={updatingFeature === 'registrationsEnabled'}
          icon="👤"
        />
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Changes take effect immediately. Disabled features will show error messages to users.
        </p>
      </div>
    </div>
  );
}

/**
 * FeatureToggle Component
 *
 * Individual feature toggle switch with label and description
 *
 * @param {Object} props
 * @param {string} props.label - Feature name
 * @param {string} props.description - Feature description
 * @param {boolean} props.enabled - Current state
 * @param {Function} props.onToggle - Toggle handler
 * @param {boolean} props.isUpdating - Loading state
 * @param {string} props.icon - Emoji icon
 */
function FeatureToggle({ label, description, enabled, onToggle, isUpdating, icon }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-start flex-1">
        <span className="text-2xl mr-3">{icon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>

      <div className="flex items-center ml-4">
        {isUpdating && (
          <div className="mr-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            enabled ? 'bg-green-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default FeatureFlagsPanel;
