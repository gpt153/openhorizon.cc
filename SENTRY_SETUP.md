# Sentry Error Tracking Setup

This document describes the Sentry error tracking integration for both the Next.js frontend and Fastify backend.

## Overview

Sentry has been integrated into both applications to provide:
- Real-time error tracking and alerting
- Stack trace visibility with source maps
- Custom error context (user ID, organization ID, request details)
- Performance monitoring
- Error dashboards and analytics

## Setup Instructions

### 1. Create a Sentry Project

1. Go to https://sentry.io and create an account (or log in)
2. Create a new project:
   - For the **Next.js app**: Select "Next.js" as the platform
   - For the **Backend**: Select "Node.js" or "Express" as the platform
3. Note the **DSN** (Data Source Name) provided by Sentry

### 2. Configure Environment Variables

#### Next.js App (`/app/.env.local`)

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_DSN=https://YOUR_KEY@o0.ingest.sentry.io/PROJECT_ID
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug

# Optional: For source map upload
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_RELEASE=${GIT_SHA}
```

#### Backend (`/project-pipeline/backend/.env`)

```bash
# Monitoring & Error Tracking
SENTRY_DSN=https://YOUR_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### 3. Source Maps Configuration

Source maps are automatically uploaded during build when:
- `SENTRY_ORG` and `SENTRY_PROJECT` are set
- `SENTRY_AUTH_TOKEN` is provided (for authentication)

To generate an auth token:
1. Go to Sentry Settings → Account → API → Auth Tokens
2. Create a new token with `project:releases` and `org:read` scopes
3. Add it to your environment variables

### 4. Testing the Integration

#### Frontend Tests

Test the Next.js integration by visiting these endpoints:

```bash
# Test 1: Trigger an error
curl http://localhost:3000/api/sentry-test?type=error

# Test 2: Send a message
curl http://localhost:3000/api/sentry-test?type=message

# Test 3: Send error with custom context
curl http://localhost:3000/api/sentry-test?type=context
```

#### Backend Tests

Test the backend integration:

```bash
# Test 1: Trigger an error
curl http://localhost:3000/sentry-test?type=error

# Test 2: Send a message
curl http://localhost:3000/sentry-test?type=message

# Test 3: Send error with custom context
curl http://localhost:3000/sentry-test?type=context
```

After triggering these tests, check your Sentry dashboard to verify the errors appear.

## Features Implemented

### ✅ Next.js Frontend

- **Client-side error tracking** (`sentry.client.config.ts`)
  - Captures unhandled exceptions
  - Session replay (10% of sessions, 100% with errors)
  - Performance monitoring (10% sample rate in production)
  - Filters out browser extension errors

- **Server-side error tracking** (`sentry.server.config.ts`)
  - Captures API route errors
  - Server-side rendering errors
  - Filters database connection errors during builds

- **Edge runtime tracking** (`sentry.edge.config.ts`)
  - Captures middleware errors
  - Edge function errors

- **Source maps upload** (configured in `next.config.ts`)
  - Readable stack traces in production
  - Automatic React component annotations
  - Ad-blocker bypass via `/monitoring` tunnel route

### ✅ Fastify Backend

- **Global error handler** (`src/lib/sentry.ts`)
  - Captures all unhandled exceptions
  - Automatic request context (method, URL, query, body)
  - User context from JWT tokens
  - Custom error filtering (validation errors ignored)

- **Request middleware**
  - Adds request context to all errors
  - Extracts user information from authentication
  - Clears context after each request

- **Performance monitoring**
  - 10% trace sampling in production
  - 100% trace sampling in development

## Custom Context

Both integrations automatically capture:

- **User Context**: User ID, email (from Clerk/JWT)
- **Request Context**: HTTP method, URL, query params, headers
- **Custom Tags**: Environment, test tags
- **Breadcrumbs**: User actions, API calls, database queries

### Example: Manual Error Reporting

#### Frontend
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.withScope((scope) => {
    scope.setTag("feature", "user-upload");
    scope.setContext("upload", {
      fileName: file.name,
      fileSize: file.size,
    });
    Sentry.captureException(error);
  });
}
```

#### Backend
```typescript
import { Sentry } from './lib/sentry.js';

try {
  // Your code
} catch (error) {
  Sentry.withScope((scope) => {
    scope.setTag("operation", "data-import");
    scope.setContext("import", {
      recordCount: records.length,
    });
    Sentry.captureException(error);
  });
}
```

## Alert Configuration

Configure alerts in Sentry dashboard:

1. Go to **Alerts** → **Create Alert Rule**
2. Recommended alerts:
   - **Error spike**: Alert if error rate > 1%
   - **New error**: Alert on first occurrence of new errors
   - **Critical errors**: Alert on errors with `level: fatal`
   - **Performance degradation**: Alert if response time > 2s

### Email Alerts
- Configured per-project in Sentry settings
- Set recipients in **Settings** → **Teams** → **Team Alerts**

### Slack Alerts (Optional)
1. Install Sentry Slack app
2. Configure webhook in **Settings** → **Integrations** → **Slack**
3. Route alerts to specific channels

## Dashboard

Access your error dashboard at: `https://sentry.io/organizations/YOUR_ORG/issues/`

Key metrics to monitor:
- Error count and error rate
- Affected users
- Error grouping and trends
- Release health (if releases configured)

## Production Checklist

Before deploying to production:

- [ ] Sentry DSN configured in environment variables
- [ ] Auth token set for source map upload
- [ ] Test endpoints removed or protected (delete `/api/sentry-test` and `/sentry-test`)
- [ ] Email alerts configured
- [ ] Slack alerts configured (optional)
- [ ] Dashboard reviewed and useful
- [ ] Sample rates adjusted for production traffic
- [ ] Release tracking configured (`SENTRY_RELEASE`)

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `SENTRY_DSN` is set correctly
2. Verify environment matches (development/production)
3. Check browser console for Sentry errors
4. Verify Sentry SDK initialization in logs
5. Test with the `/sentry-test` endpoints

### Source maps not uploading

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` are correct
3. Review build logs for upload errors
4. Ensure token has correct scopes (`project:releases`, `org:read`)

### Too many errors / High costs

1. Adjust `tracesSampleRate` in config files (lower = fewer events)
2. Add more filters in `beforeSend` hooks
3. Upgrade Sentry plan if needed
4. Review ignored errors in Sentry dashboard

## Cost Management

Sentry free tier includes:
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month

To stay within limits:
- Use appropriate sample rates (10% in production)
- Filter out non-critical errors in `beforeSend`
- Monitor usage in Sentry dashboard
- Disable replays if not needed

## Further Reading

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Alert Configuration](https://docs.sentry.io/product/alerts/)
