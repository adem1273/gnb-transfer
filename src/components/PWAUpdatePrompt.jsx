import React, { useEffect, useState } from 'react';
import { skipWaiting } from '../utils/serviceWorker';

/**
 * PWA Update Prompt Component
 * Shows an update prompt when a new version of the service worker is available
 */
function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Listen for service worker update events
    const handleSwUpdated = (event) => {
      console.log('New service worker version available');
      setRegistration(event.detail);
      setShowPrompt(true);
    };

    // Listen for controller change (reload after update)
    const handleControllerChange = () => {
      console.log('Service worker controller changed, reloading page...');
      window.location.reload();
    };

    window.addEventListener('swUpdated', handleSwUpdated);
    window.addEventListener('swControllerChange', handleControllerChange);

    return () => {
      window.removeEventListener('swUpdated', handleSwUpdated);
      window.removeEventListener('swControllerChange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (registration) {
      skipWaiting(registration);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">Update Available</h3>
            <p className="mt-1 text-sm text-gray-500">
              A new version of GNB Transfer is available. Update now to get the latest features and
              improvements.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Later
              </button>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAUpdatePrompt;
