import { useState, useEffect } from 'react';
import API from '../../utils/api';

/**
 * KillSwitchPanel Component
 *
 * Emergency controls for the system with two-step confirmation.
 * - Activate Kill Switch: Requires typing "ONAY" to confirm
 * - Restore System: Returns system to normal operation
 *
 * @component
 */
function KillSwitchPanel() {
  const [siteStatus, setSiteStatus] = useState('online');
  const [loading, setLoading] = useState(true);
  const [showKillModal, setShowKillModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [killReason, setKillReason] = useState('');
  const [killMessage, setKillMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const CONFIRM_STRING = 'ONAY'; // Turkish for "CONFIRM"

  // Fetch current system status on mount
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const response = await API.get('/v1/super-admin/system-settings');

        if (response.data && response.data.data) {
          setSiteStatus(response.data.data.siteStatus || 'online');
        }
      } catch (err) {
        console.error('Error fetching system status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const handleActivateKillSwitch = () => {
    setShowKillModal(true);
    setConfirmText('');
    setKillReason('');
    setKillMessage('Emergency maintenance in progress. We apologize for the inconvenience.');
    setError(null);
  };

  const handleConfirmKillSwitch = async () => {
    if (confirmText !== CONFIRM_STRING) {
      setError(`Please type "${CONFIRM_STRING}" to confirm`);
      return;
    }

    if (!killReason.trim()) {
      setError('Please provide a reason for activating the kill switch');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await API.post('/v1/super-admin/kill-switch', {
        message: killMessage,
        reason: killReason,
      });

      if (response.data && response.data.success) {
        setSuccess('🚨 Kill switch activated successfully');
        setSiteStatus('maintenance');
        setShowKillModal(false);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to activate kill switch');
      console.error('Error activating kill switch:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreSystem = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to restore the system to normal operation?')) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await API.post('/v1/super-admin/restore', {});

      if (response.data && response.data.success) {
        setSuccess('✅ System restored successfully');
        setSiteStatus('online');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to restore system');
      console.error('Error restoring system:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowKillModal(false);
    setConfirmText('');
    setKillReason('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Controls</h2>

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

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Current System Status</p>
            <p className="text-lg font-bold mt-1">
              {siteStatus === 'maintenance' ? (
                <span className="text-red-600">🔴 MAINTENANCE MODE</span>
              ) : (
                <span className="text-green-600">🟢 ONLINE</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {siteStatus === 'online' ? (
          <button
            onClick={handleActivateKillSwitch}
            disabled={processing}
            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : '🚨 Activate Kill Switch'}
          </button>
        ) : (
          <button
            onClick={handleRestoreSystem}
            disabled={processing}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : '✅ Restore System'}
          </button>
        )}

        <p className="text-xs text-gray-500 text-center">
          {siteStatus === 'online'
            ? 'Kill switch will immediately disable bookings and payments'
            : 'Restore will re-enable all system features'}
        </p>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Confirm Kill Switch Activation
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="killMessage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maintenance Message
                </label>
                <textarea
                  id="killMessage"
                  value={killMessage}
                  onChange={(e) => setKillMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="killReason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reason for Kill Switch *
                </label>
                <input
                  type="text"
                  id="killReason"
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  placeholder="e.g., Security breach, critical bug, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmText"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Type <strong>{CONFIRM_STRING}</strong> to confirm *
                </label>
                <input
                  type="text"
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_STRING}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmKillSwitch}
                disabled={processing || confirmText !== CONFIRM_STRING}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Activating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KillSwitchPanel;
