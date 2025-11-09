import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
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
