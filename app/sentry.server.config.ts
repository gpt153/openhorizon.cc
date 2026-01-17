import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Enhanced server-side integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: undefined }), // Will be set when Prisma client is available
  ],

  // Ignore certain errors
  beforeSend(event, hint) {
    // Filter out errors we don't care about
    if (event.exception) {
      const error = hint.originalException;

      // Ignore database connection errors during build time
      if (error instanceof Error && error.message.includes('database') && process.env.CI) {
        return null;
      }

      // Ignore Prisma errors during build
      if (error instanceof Error && error.message.includes('PrismaClient') && process.env.CI) {
        return null;
      }
    }

    // Add server context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'node',
        version: process.version,
      },
      server: {
        environment: process.env.NODE_ENV,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };

    return event;
  },
});
