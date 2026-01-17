import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Enhanced integrations for better context
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'openhorizon.cc', /^\//],
      // Track navigation and fetch requests
      traceFetch: true,
      traceXHR: true,
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
      // Mask sensitive form inputs
      maskAllInputs: true,
    }),
  ],

  // Filter and enhance breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out sensitive console logs
    if (breadcrumb.category === 'console') {
      const message = breadcrumb.message || '';
      if (message.includes('password') || message.includes('token') || message.includes('secret')) {
        return null;
      }
    }

    // Add additional context to fetch breadcrumbs
    if (breadcrumb.category === 'fetch') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
      };
    }

    return breadcrumb;
  },

  // Adjust this value in production, or use tracesSampler for greater control
  beforeSend(event, hint) {
    // Filter out errors we don't care about
    if (event.exception) {
      const error = hint.originalException;

      // Ignore network errors from browser extensions
      if (error instanceof Error && error.message.includes('chrome-extension://')) {
        return null;
      }

      // Ignore ResizeObserver errors (common browser quirk)
      if (error instanceof Error && error.message.includes('ResizeObserver')) {
        return null;
      }
    }

    // Add browser context
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        browser_info: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          screen: {
            width: window.screen.width,
            height: window.screen.height,
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
    }

    return event;
  },
});
