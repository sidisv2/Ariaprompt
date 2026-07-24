import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/responsive.css';
import './i18n';
import ErrorBoundary from './components/common/ErrorBoundary';

// Global error handlers to avoid the app being a white screen on runtime errors
try {
  window.addEventListener('error', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Global error captured:', ev.error || ev.message, ev);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled rejection:', ev.reason);
  });
} catch (e) {
  // ignore in non-browser env
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  // If root missing, create minimal fallback
  const fallback = document.createElement('div');
  fallback.id = 'root';
  document.body.appendChild(fallback);
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (err) {
  // Render minimal fallback UI so user sees something instead of blank page
  // eslint-disable-next-line no-console
  console.error('Render failed:', err);
  const root = document.getElementById('root')!;
  root.innerHTML = `
    <div style="padding:24px;background:#0b1220;color:#fff;min-height:100vh;">
      <h2>Error al renderizar la aplicación</h2>
      <pre style="white-space:pre-wrap;color:#f1f1f1">${String(err)}</pre>
    </div>
  `;
}
