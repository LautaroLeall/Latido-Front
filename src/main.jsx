import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Carga asíncrona CSP-strict de Google Fonts (sin handlers inline, no bloquea FCP)
if (typeof document !== 'undefined') {
  const fontHref =
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap';
  if (!document.head.querySelector(`link[rel="stylesheet"][href="${fontHref}"]`)) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = fontHref;
    document.head.appendChild(fontLink);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
