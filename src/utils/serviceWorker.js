/**
 * Service Worker Registration Utility
 * Registers the service worker for PWA functionality
 */

export async function registerServiceWorker() {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    // Wait for page load to avoid impacting initial page performance
    if (document.readyState === 'complete') {
      return await register();
    }

    window.addEventListener('load', register);
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

async function register() {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('Service worker registered successfully:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Service worker update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker installed, show update notification
          console.log('New content available, please refresh');
          
          // Dispatch custom event for UI to handle
          window.dispatchEvent(new CustomEvent('swUpdated', { detail: registration }));
        }
      });
    });

    // Listen for controller change (when new SW takes over)
    // This triggers a page reload to ensure the new version is used
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed - new version activated');
      // Dispatch event to notify the app that a new version is active
      window.dispatchEvent(new CustomEvent('swControllerChange'));
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('All service workers unregistered');
  }
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(registration) {
  if (!registration) {
    console.warn('No service worker registration available');
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return null;
    }

    // In production, you would use your VAPID public key here
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null, // Replace with your VAPID public key
    });

    console.log('Push notification subscription:', subscription);
    
    // Send subscription to your server
    // await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Skip waiting and activate new service worker immediately
 * Call this when user accepts the update prompt
 */
export function skipWaiting(registration) {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  requestNotificationPermission,
  subscribeToPushNotifications,
};
