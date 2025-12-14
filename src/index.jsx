import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import { queryClient } from './lib/queryClient';
import { registerServiceWorker } from './utils/serviceWorker';
import { initSentry, ErrorBoundary } from './config/sentry';

// Initialize Sentry as early as possible
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">{error.message}</p>
            <button
              onClick={resetError}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA functionality
// Only in production to avoid caching issues during development
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
    .then((registration) => {
      if (registration) {
        console.log('Service worker registered successfully');
      }
    })
    .catch((error) => {
      console.error('Service worker registration failed:', error);
    });
}

