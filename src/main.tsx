import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Capture install prompt as early as possible (before React mounts)
// Samsung Internet and some Android Chrome builds fire it very early
(window as any).__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
