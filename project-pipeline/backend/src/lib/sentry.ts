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
    release: process.env.SENTRY_RELEASE || `backend@${process.env.npm_package_version || '1.0.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Integrate with Node.js profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enhanced integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true, breadcrumbs: true }),
      new Sentry.Integrations.Express({ app: undefined }), // Will be set when Express app is available
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    beforeSend(event, hint) {
      // Filter out errors we don't care about
      if (event.exception) {
        const error = hint.originalException;

        // Ignore validation errors (they're expected)
        if (error instanceof Error && error.message.includes('Validation error')) {
          return null;
        }

        // Ignore JWT errors in development
        if (error instanceof Error && error.message.includes('jwt') && process.env.NODE_ENV === 'development') {
          return null;
        }
      }

      // Add server runtime context
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

  console.log('✅ Sentry initialized');
}

export function setupSentryMiddleware(app: FastifyInstance) {
  // Add request data to Sentry context
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id || `req-${Date.now()}`;

    // Enhanced request context
    Sentry.setContext('request', {
      id: requestId,
      method: request.method,
      url: request.url,
      query: request.query,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        'origin': request.headers['origin'],
        'referer': request.headers['referer'],
      },
      ip: request.ip,
      hostname: request.hostname,
      protocol: request.protocol,
    });

    // Add user context if available (from JWT)
    if (request.user) {
      const user = request.user as any;

      Sentry.setUser({
        id: user.userId || user.id,
        email: user.email,
        username: user.username,
      });

      // Add organization context if available
      if (user.organizationId) {
        Sentry.setContext('organization', {
          id: user.organizationId,
          name: user.organizationName,
        });
      }
    }

    // Add performance breadcrumb
    Sentry.addBreadcrumb({
      category: 'http.request',
      message: `${request.method} ${request.url}`,
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
        requestId,
      },
    });

    // Track request start time for performance monitoring
    (request as any).startTime = Date.now();
  });

  // Add performance tracking on response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now());

    // Add response breadcrumb with performance data
    Sentry.addBreadcrumb({
      category: 'http.response',
      message: `${request.method} ${request.url} - ${reply.statusCode}`,
      level: reply.statusCode >= 400 ? 'warning' : 'info',
      data: {
        statusCode: reply.statusCode,
        duration,
        method: request.method,
        url: request.url,
      },
    });

    // Clear context after response
    Sentry.setContext('request', null);
    Sentry.setContext('organization', null);
    Sentry.setUser(null);
  });
}

export function setupSentryErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    // Log to Fastify logger
    app.log.error(error);

    // Send to Sentry (with full context)
    Sentry.withScope((scope) => {
      // Enhanced request context
      scope.setContext('request', {
        id: request.id,
        method: request.method,
        url: request.url,
        query: request.query,
        body: request.body,
        params: request.params,
        headers: {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type'],
          'origin': request.headers['origin'],
        },
        ip: request.ip,
      });

      // Add user context
      if (request.user) {
        const user = request.user as any;
        scope.setUser({
          id: user.userId || user.id,
          email: user.email,
          username: user.username,
        });

        // Add organization context
        if (user.organizationId) {
          scope.setContext('organization', {
            id: user.organizationId,
            name: user.organizationName,
          });
        }
      }

      // Add error details
      scope.setContext('error_details', {
        name: error.name,
        message: error.message,
        statusCode: (error as any).statusCode,
        validation: (error as any).validation,
        stack: error.stack,
      });

      // Set tags for better filtering
      scope.setTag('environment', process.env.NODE_ENV || 'development');
      scope.setTag('error_type', error.name);
      scope.setTag('http_method', request.method);
      scope.setTag('endpoint', request.url);

      // Set level based on status code
      const statusCode = (error as any).statusCode || 500;
      if (statusCode < 400) {
        scope.setLevel('info');
      } else if (statusCode < 500) {
        scope.setLevel('warning');
      } else {
        scope.setLevel('error');
      }

      // Add fingerprint for better grouping
      scope.setFingerprint([
        error.name,
        request.method,
        request.url.split('?')[0], // Remove query params for grouping
      ]);

      Sentry.captureException(error);
    });

    // Send response to client
    if ((error as any).validation) {
      return reply.code(400).send({
        error: 'Validation error',
        details: (error as any).validation,
      });
    }

    const statusCode = (error as any).statusCode || 500;
    return reply.code(statusCode).send({
      error: statusCode < 500 ? error.message : 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId: request.id,
    });
  });
}

// Export Sentry for manual error reporting
export { Sentry };
