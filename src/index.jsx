import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import { queryClient } from './lib/queryClient';
import { registerServiceWorker } from './utils/serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
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
