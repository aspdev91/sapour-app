import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import {
  BrowserRouter,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration({
      // routingInstrumentation: Sentry.reactRouterV6Instrumentation(
      //   React.useEffect,
      //   useLocation,
      //   useNavigationType,
      //   createRoutesFromChildren,
      //   matchRoutes,
      // ),
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // Session Replay
  replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter out non-critical errors in development
    if (import.meta.env.MODE === 'development') {
      // Skip React hydration warnings
      if (event.message?.includes('Hydration')) return null;
    }
    return event;
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
