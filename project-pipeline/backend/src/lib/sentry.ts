import * as Sentry from "@sentry/node";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Integrate with Node.js profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    beforeSend(event, hint) {
      // Filter out errors we don't care about
      if (event.exception) {
        const error = hint.originalException;

        // Ignore validation errors (they're expected)
        if (error instanceof Error && error.message.includes('Validation error')) {
          return null;
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized');
}

export function setupSentryMiddleware(app: FastifyInstance) {
  // Add request data to Sentry context
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      query: request.query,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
      },
    });

    // Add user context if available (from JWT)
    if (request.user) {
      Sentry.setUser({
        id: (request.user as any).userId || (request.user as any).id,
        email: (request.user as any).email,
      });
    }
  });

  // Clear context after response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    Sentry.setContext('request', null);
    Sentry.setUser(null);
  });
}

export function setupSentryErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    // Log to Fastify logger
    app.log.error(error);

    // Send to Sentry (with full context)
    Sentry.withScope((scope) => {
      scope.setContext('request', {
        method: request.method,
        url: request.url,
        query: request.query,
        body: request.body,
        params: request.params,
      });

      if (request.user) {
        scope.setUser({
          id: (request.user as any).userId || (request.user as any).id,
          email: (request.user as any).email,
        });
      }

      scope.setTag('environment', process.env.NODE_ENV || 'development');
      scope.setLevel(error.statusCode && error.statusCode < 500 ? 'warning' : 'error');

      Sentry.captureException(error);
    });

    // Send response to client
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation error',
        details: error.validation,
      });
    }

    return reply.code(error.statusCode || 500).send({
      error: error.statusCode && error.statusCode < 500 ? error.message : 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  });
}

// Export Sentry for manual error reporting
export { Sentry };
