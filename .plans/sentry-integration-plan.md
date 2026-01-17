# Sentry Error Tracking Integration - Implementation Plan

**Issue**: #158
**Epic**: #003 Production Readiness & Testing
**Priority**: High

## Executive Summary

This plan outlines the comprehensive implementation of Sentry error tracking for the OpenHorizon platform, covering both the Next.js frontend (app) and Fastify backend (project-pipeline). The existing partial implementation will be enhanced with source maps, alerts, custom contexts, and dashboards.

## Current State Analysis

### ✅ Already Implemented

#### Next.js App
- **Package**: `@sentry/nextjs` v10.34.0 installed
- **Configuration Files**:
  - `sentry.client.config.ts` - Client-side error tracking
  - `sentry.server.config.ts` - Server-side error tracking
  - `sentry.edge.config.ts` - Edge runtime error tracking
- **Webpack Integration**: `next.config.ts` uses `withSentryConfig` with:
  - Source map upload configuration
  - React component annotation
  - Tunnel route (`/monitoring`)
  - Automatic Vercel Cron monitoring
- **Test Endpoint**: `/api/sentry-test` with multiple test types
- **Error UI**: Custom error page (`error.tsx`)

#### Fastify Backend
- **Package**: `@sentry/node` v10.34.0 installed
- **Module**: `src/lib/sentry.ts` with:
  - `initSentry()` - SDK initialization
  - `setupSentryMiddleware()` - Request/user context enrichment
  - `setupSentryErrorHandler()` - Global error handler
- **Test Endpoint**: `/sentry-test` with test types
- **Integration**: Initialized in `src/app.ts`

### ⚠️ Missing Components

1. **Source Maps**:
   - Backend has no source map generation/upload
   - Frontend source maps configured but need validation

2. **Alert Configuration**:
   - No email/Slack alerts configured in Sentry dashboard
   - No alert rules for critical errors

3. **Custom Error Contexts**:
   - Basic contexts exist, but missing:
     - Organization ID tracking (multi-tenant context)
     - Detailed request metadata
     - Performance breadcrumbs
     - Database query contexts

4. **Error Dashboard**:
   - No custom Sentry dashboard
   - No Google Cloud Monitoring integration

5. **Environment Variables**:
   - Sentry vars defined in `.env.example` but need verification
   - Backend missing `SENTRY_ORG` and `SENTRY_PROJECT`

## Implementation Tasks

### Task 1: Configure Source Maps for Next.js

**Status**: Partially Complete
**Effort**: 2 hours
**Files**:
- `app/next.config.ts` ✅ (already configured)
- `app/.env.example` ✅ (already has vars)

**Actions**:
1. ✅ Verify `widenClientFileUpload: true` (already set)
2. ✅ Verify `SENTRY_ORG` and `SENTRY_PROJECT` in env
3. 🔄 Add source map generation validation to build process
4. 🔄 Test source maps with a production build
5. 🔄 Document source map verification procedure

**Acceptance Criteria**:
- Stack traces in Sentry show actual source code (not minified)
- Line numbers match original TypeScript files
- Source maps uploaded during CI/CD builds

---

### Task 2: Configure Source Maps for Fastify Backend

**Status**: Not Started
**Effort**: 3 hours
**Files**:
- `project-pipeline/backend/tsconfig.json`
- `project-pipeline/backend/package.json`
- `project-pipeline/backend/.env.example`
- New: `project-pipeline/backend/sentry.config.js`

**Actions**:
1. Enable source map generation in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "sourceMap": true,
       "inlineSources": true,
       "sourceRoot": "/"
     }
   }
   ```

2. Install Sentry CLI for source map upload:
   ```bash
   npm install --save-dev @sentry/cli
   ```

3. Create `sentry.config.js` for build-time upload:
   ```javascript
   module.exports = {
     org: process.env.SENTRY_ORG,
     project: process.env.SENTRY_PROJECT,
     authToken: process.env.SENTRY_AUTH_TOKEN,
   }
   ```

4. Update `package.json` build script:
   ```json
   {
     "scripts": {
       "build": "tsc && sentry-cli sourcemaps upload --release=$npm_package_version dist"
     }
   }
   ```

5. Add environment variables to `.env.example`:
   ```
   SENTRY_ORG=your-org-name
   SENTRY_PROJECT=openhorizon-backend
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

6. Update `src/lib/sentry.ts` to include release tracking:
   ```typescript
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     release: process.env.SENTRY_RELEASE || `backend@${process.env.npm_package_version}`,
     // ... existing config
   });
   ```

**Acceptance Criteria**:
- TypeScript source maps generated during build
- Source maps uploaded to Sentry on production builds
- Stack traces show original TypeScript code
- Release tracking linked to source maps

---

### Task 3: Set Up Error Alerts (Email/Slack)

**Status**: Not Started
**Effort**: 2 hours
**Platform**: Sentry Dashboard Configuration

**Actions**:
1. **Create Alert Rules in Sentry Dashboard**:

   **Rule 1: Critical Errors (Immediate)**
   - Trigger: Any error with level `error` or `fatal`
   - Filter: `environment:production`
   - Actions:
     - Send email to: `team@openhorizon.cc`
     - Send Slack notification to: `#alerts-production`
   - Frequency: Immediately for first occurrence, then once per hour

   **Rule 2: High-Volume Errors (Threshold)**
   - Trigger: More than 50 errors in 5 minutes
   - Filter: `environment:production`
   - Actions:
     - Send email to: `team@openhorizon.cc`
     - Send Slack notification to: `#alerts-production`
   - Frequency: Once per hour

   **Rule 3: New Issue Detected**
   - Trigger: First occurrence of new error type
   - Filter: `environment:production`
   - Actions:
     - Send Slack notification to: `#dev-errors`
   - Frequency: Immediately

2. **Configure Slack Integration**:
   - Install Sentry Slack app in workspace
   - Authorize channels: `#alerts-production`, `#dev-errors`
   - Test notification delivery

3. **Configure Email Integration**:
   - Add team email addresses in Sentry
   - Set up email templates for alerts
   - Test email delivery

4. **Configure Alert Grouping**:
   - Enable smart grouping for similar errors
   - Set fingerprinting rules for custom grouping
   - Configure issue ownership rules

**Documentation**:
- Create runbook: `.docs/runbooks/sentry-alerts.md`
- Document escalation procedures
- Document alert muting/resolution workflows

**Acceptance Criteria**:
- Test alerts received via email within 1 minute
- Slack notifications appear in correct channels
- Critical errors trigger immediate alerts
- High-volume errors trigger threshold alerts
- Alert grouping prevents spam

---

### Task 4: Add Custom Error Contexts

**Status**: Partially Complete
**Effort**: 4 hours

#### 4a. Next.js App Custom Contexts

**Files**:
- `app/sentry.client.config.ts`
- `app/sentry.server.config.ts`
- `app/sentry.edge.config.ts`
- `app/src/middleware.ts` (may need creation)

**Actions**:

1. **Add Organization Context** (Multi-tenancy):
   ```typescript
   // In middleware or API route handler
   import * as Sentry from '@sentry/nextjs';
   import { auth } from '@clerk/nextjs';

   export async function middleware(request: NextRequest) {
     const { userId, orgId } = auth();

     if (userId) {
       Sentry.setUser({
         id: userId,
         organizationId: orgId || 'none',
       });

       Sentry.setContext('organization', {
         id: orgId,
         // Add org details from database if needed
       });
     }
   }
   ```

2. **Add Request Metadata**:
   ```typescript
   // In API route handlers
   Sentry.setContext('request_details', {
     url: request.url,
     method: request.method,
     headers: {
       'user-agent': request.headers.get('user-agent'),
       'referer': request.headers.get('referer'),
     },
     query: Object.fromEntries(request.nextUrl.searchParams),
     timestamp: new Date().toISOString(),
   });
   ```

3. **Add Database Query Context** (tRPC middleware):
   ```typescript
   // In tRPC context or middleware
   const queryMiddleware = t.middleware(async ({ ctx, next, path }) => {
     const start = Date.now();

     Sentry.addBreadcrumb({
       category: 'trpc',
       message: `Query: ${path}`,
       level: 'info',
       data: { path, user: ctx.userId },
     });

     try {
       const result = await next();

       Sentry.addBreadcrumb({
         category: 'trpc',
         message: `Query completed: ${path}`,
         level: 'info',
         data: { duration: Date.now() - start },
       });

       return result;
     } catch (error) {
       Sentry.withScope((scope) => {
         scope.setContext('trpc_query', {
           path,
           duration: Date.now() - start,
           user: ctx.userId,
         });
         Sentry.captureException(error);
       });
       throw error;
     }
   });
   ```

4. **Add Performance Breadcrumbs**:
   ```typescript
   // Update sentry configs
   Sentry.init({
     // ... existing config
     integrations: [
       new Sentry.BrowserTracing({
         tracingOrigins: ['localhost', 'openhorizon.cc', /^\//],
       }),
       new Sentry.Replay({
         maskAllText: false,
         blockAllMedia: false,
       }),
     ],
     beforeBreadcrumb(breadcrumb) {
       // Filter sensitive data
       if (breadcrumb.category === 'console' && breadcrumb.message?.includes('password')) {
         return null;
       }
       return breadcrumb;
     },
   });
   ```

#### 4b. Fastify Backend Custom Contexts

**Files**:
- `project-pipeline/backend/src/lib/sentry.ts`
- `project-pipeline/backend/src/auth/middleware.ts`

**Actions**:

1. **Enhance Request Context** in `setupSentryMiddleware`:
   ```typescript
   export function setupSentryMiddleware(app: FastifyInstance) {
     app.addHook('onRequest', async (request, reply) => {
       // Existing request context
       Sentry.setContext('request', {
         method: request.method,
         url: request.url,
         query: request.query,
         headers: {
           'user-agent': request.headers['user-agent'],
           'content-type': request.headers['content-type'],
         },
       });

       // NEW: Add organization context
       if (request.user) {
         const user = request.user as any;
         Sentry.setUser({
           id: user.userId || user.id,
           email: user.email,
           organizationId: user.organizationId,
         });

         if (user.organizationId) {
           Sentry.setContext('organization', {
             id: user.organizationId,
             // Fetch org details if needed
           });
         }
       }

       // NEW: Add performance breadcrumb
       Sentry.addBreadcrumb({
         category: 'http',
         message: `${request.method} ${request.url}`,
         level: 'info',
         data: {
           url: request.url,
           method: request.method,
         },
       });
     });
   }
   ```

2. **Add Database Query Context**:
   ```typescript
   // Create new file: src/lib/prisma-sentry.ts
   import { PrismaClient } from '@prisma/client';
   import * as Sentry from '@sentry/node';

   export function createPrismaWithSentry() {
     const prisma = new PrismaClient({
       log: [
         { level: 'query', emit: 'event' },
         { level: 'error', emit: 'event' },
       ],
     });

     prisma.$on('query' as any, (e: any) => {
       Sentry.addBreadcrumb({
         category: 'db.query',
         message: e.query,
         level: 'info',
         data: {
           duration: e.duration,
           target: e.target,
         },
       });
     });

     prisma.$on('error' as any, (e: any) => {
       Sentry.captureException(new Error(`Database error: ${e.message}`), {
         contexts: {
           database: {
             target: e.target,
             timestamp: e.timestamp,
           },
         },
       });
     });

     return prisma;
   }
   ```

3. **Add WebSocket Error Context**:
   ```typescript
   // In src/websocket.ts
   import * as Sentry from '@sentry/node';

   socket.on('error', (error) => {
     Sentry.withScope((scope) => {
       scope.setContext('websocket', {
         socketId: socket.id,
         rooms: Array.from(socket.rooms),
         handshake: socket.handshake.query,
       });
       Sentry.captureException(error);
     });
   });
   ```

**Acceptance Criteria**:
- User ID and email appear in all error reports
- Organization ID tracked for multi-tenant errors
- Request metadata (URL, method, headers) captured
- Database queries appear in breadcrumbs
- Performance data included in traces
- WebSocket errors include connection context

---

### Task 5: Create Error Dashboard

**Status**: Not Started
**Effort**: 3 hours

#### 5a. Sentry Custom Dashboard

**Platform**: Sentry Dashboard UI

**Actions**:

1. **Create Dashboard: "Production Health"**
   - Navigate to Sentry → Dashboards → Create Dashboard
   - Add widgets:

     **Widget 1: Error Rate (Time Series)**
     - Metric: `count()`
     - Group by: `environment`
     - Filter: `event.type:error`
     - Time range: Last 24 hours

     **Widget 2: Errors by Endpoint (Table)**
     - Metric: `count()`
     - Group by: `transaction`
     - Filter: `environment:production`
     - Sort: Descending by count

     **Widget 3: User Impact (Number)**
     - Metric: `count_unique(user)`
     - Filter: `event.type:error AND environment:production`

     **Widget 4: Response Time (P95)**
     - Metric: `p95(transaction.duration)`
     - Group by: `transaction`
     - Filter: `event.type:transaction`

     **Widget 5: Errors by Browser (Pie Chart)**
     - Metric: `count()`
     - Group by: `browser.name`
     - Filter: `event.type:error AND platform:javascript`

     **Widget 6: Top Error Messages (Table)**
     - Metric: `count()`
     - Group by: `error.type`, `error.value`
     - Filter: `environment:production`
     - Limit: Top 10

2. **Create Dashboard: "Backend Performance"**
   - Widgets:
     - API endpoint latency (P50, P95, P99)
     - Database query performance
     - WebSocket connection errors
     - Memory usage trends
     - CPU usage correlation with errors

3. **Configure Dashboard Sharing**:
   - Generate shareable link for team
   - Set up automated dashboard emails (weekly summary)

#### 5b. Google Cloud Monitoring Integration

**Platform**: Google Cloud Console + Sentry Integration

**Actions**:

1. **Enable Sentry → Google Cloud Export**:
   - In Sentry: Settings → Integrations → Google Cloud Platform
   - Authorize GCP project: `openhorizon-production`
   - Configure export settings:
     - Export errors to Cloud Logging
     - Export traces to Cloud Trace
     - Export metrics to Cloud Monitoring

2. **Create Cloud Monitoring Dashboard**:
   ```yaml
   # Dashboard configuration
   displayName: "OpenHorizon Error Tracking"
   mosaicLayout:
     columns: 12
     tiles:
       - width: 6
         height: 4
         widget:
           title: "Error Rate (Sentry)"
           xyChart:
             dataSets:
               - timeSeriesQuery:
                   timeSeriesFilter:
                     filter: 'resource.type="generic_task" AND metric.type="logging.googleapis.com/user/sentry_errors"'
                     aggregation:
                       alignmentPeriod: "60s"
                       perSeriesAligner: ALIGN_RATE

       - width: 6
         height: 4
         widget:
           title: "Critical Errors (Last Hour)"
           scorecard:
             timeSeriesQuery:
               timeSeriesFilter:
                 filter: 'metric.type="logging.googleapis.com/user/sentry_errors" AND metric.label.level="error"'
   ```

3. **Set up Cloud Monitoring Alerts** (backup to Sentry):
   - Alert on error rate > 100/min
   - Alert on P95 latency > 5s
   - Alert on memory usage > 80%

4. **Create Uptime Checks**:
   - Frontend: `https://app.openhorizon.cc/health`
   - Backend: `https://api.openhorizon.cc/health`
   - Frequency: Every 1 minute
   - Alert on 2 consecutive failures

**Documentation**:
- Create guide: `.docs/monitoring/dashboards.md`
- Document dashboard KPIs and interpretation
- Create incident response playbook

**Acceptance Criteria**:
- Sentry dashboard shows production errors in real-time
- Google Cloud Monitoring receives Sentry data
- Dashboards accessible to all team members
- Weekly summary emails sent automatically
- Uptime checks alert on downtime

---

## Environment Variables Checklist

### Next.js App (`app/.env.local`)
```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
SENTRY_ENVIRONMENT="production"
SENTRY_ORG="your-org"
SENTRY_PROJECT="openhorizon-app"
SENTRY_AUTH_TOKEN="sntrys_xxx" # For CI/CD source map upload
```

### Fastify Backend (`project-pipeline/backend/.env`)
```bash
# Sentry Configuration
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ENVIRONMENT="production"
SENTRY_ORG="your-org"
SENTRY_PROJECT="openhorizon-backend"
SENTRY_AUTH_TOKEN="sntrys_xxx"
SENTRY_RELEASE="${GIT_SHA}" # Set by CI/CD
```

---

## Testing Strategy

### Manual Testing

1. **Frontend Error Tracking**:
   ```bash
   # Test client-side error
   curl https://app.openhorizon.cc/api/sentry-test?type=error

   # Test message
   curl https://app.openhorizon.cc/api/sentry-test?type=message

   # Test custom context
   curl https://app.openhorizon.cc/api/sentry-test?type=context
   ```

2. **Backend Error Tracking**:
   ```bash
   # Test backend error
   curl https://api.openhorizon.cc/sentry-test?type=error

   # Test with auth context
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.openhorizon.cc/sentry-test?type=context
   ```

3. **Source Maps Validation**:
   - Trigger error in production
   - Check Sentry issue for stack trace
   - Verify line numbers match source code
   - Verify file paths show TypeScript files

4. **Alert Testing**:
   - Trigger test error
   - Verify email received within 1 minute
   - Verify Slack notification in correct channel
   - Test alert muting/resolution

### Automated Testing

```typescript
// Add to app/e2e/monitoring.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sentry Integration', () => {
  test('should capture client-side errors', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Inject error
    await page.evaluate(() => {
      throw new Error('E2E test error');
    });

    // Wait for Sentry to capture
    await page.waitForTimeout(2000);

    // Verify error appears in console (Sentry logs)
    // Note: Actual Sentry API verification requires Sentry API key
  });

  test('should include user context in errors', async ({ page }) => {
    // Sign in as test user
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpass');
    await page.click('[type="submit"]');

    // Trigger error with user context
    await page.goto('/api/sentry-test?type=context');

    // Check response
    const response = await page.textContent('body');
    expect(response).toContain('Test error with custom context sent to Sentry');
  });
});
```

---

## Deployment Strategy

### Phase 1: Development Environment (Week 1)
- ✅ Tasks 1-2: Source maps for dev/staging
- ✅ Task 4: Custom contexts in dev
- Test all integrations thoroughly

### Phase 2: Staging Environment (Week 1)
- Deploy to staging
- Run load tests to generate errors
- Validate source maps
- Validate contexts
- Test alert delivery

### Phase 3: Production Rollout (Week 2)
- ✅ Task 3: Configure production alerts
- ✅ Task 5: Create dashboards
- Deploy to production with monitoring
- Monitor for 48 hours
- Document any issues

### Phase 4: Optimization (Week 2)
- Review error grouping
- Optimize alert thresholds
- Add custom fingerprinting rules
- Document common errors and solutions

---

## Success Metrics

1. **Error Detection**:
   - ✅ 100% of unhandled errors captured
   - ✅ < 1 minute from error to alert
   - ✅ Source maps working for all environments

2. **Error Resolution**:
   - ✅ All critical errors resolved within 4 hours
   - ✅ All errors have user/org context
   - ✅ Stack traces show original source code

3. **Team Efficiency**:
   - ✅ Average time to identify root cause < 15 minutes
   - ✅ 90% of errors resolved without deploying fixes
   - ✅ Weekly error review meeting < 30 minutes

4. **System Health**:
   - ✅ Error rate < 1% of total requests
   - ✅ Zero critical errors in production
   - ✅ P95 response time < 500ms

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Source maps expose proprietary code | Medium | Use Sentry's source map scrubbing, restrict access |
| Alert fatigue from too many notifications | High | Start with strict filters, tune over 2 weeks |
| Performance impact from Sentry SDK | Low | Use sampling rates: 10% in production |
| Sentry quota exceeded | Medium | Set up quota alerts, use `beforeSend` to filter |
| Missing critical errors due to filtering | High | Whitelist critical error types, review filters weekly |

---

## Documentation Deliverables

1. **Runbooks**:
   - `.docs/runbooks/sentry-alerts.md` - Alert response procedures
   - `.docs/runbooks/incident-response.md` - Critical error handling

2. **Guides**:
   - `.docs/monitoring/dashboards.md` - Dashboard usage guide
   - `.docs/monitoring/sentry-setup.md` - Sentry configuration guide

3. **Developer Docs**:
   - `.docs/development/error-handling.md` - How to add custom contexts
   - `.docs/development/testing-errors.md` - How to test error tracking

---

## Timeline

| Task | Effort | Start | End | Owner |
|------|--------|-------|-----|-------|
| Task 1: Next.js Source Maps | 2h | Day 1 | Day 1 | TBD |
| Task 2: Backend Source Maps | 3h | Day 1 | Day 2 | TBD |
| Task 4a: Next.js Custom Contexts | 2h | Day 2 | Day 2 | TBD |
| Task 4b: Backend Custom Contexts | 2h | Day 2 | Day 3 | TBD |
| Testing & Validation | 4h | Day 3 | Day 3 | TBD |
| Task 3: Alert Configuration | 2h | Day 4 | Day 4 | TBD |
| Task 5a: Sentry Dashboard | 2h | Day 4 | Day 4 | TBD |
| Task 5b: GCP Integration | 1h | Day 5 | Day 5 | TBD |
| Documentation | 2h | Day 5 | Day 5 | TBD |
| **Total** | **20h** | **Day 1** | **Day 5** | |

**Estimated Completion**: 5 business days (1 week)

---

## Acceptance Criteria (Issue #158)

- [x] Sentry integrated for Next.js frontend ✅ (existing)
- [x] Sentry integrated for Fastify backend ✅ (existing)
- [ ] Source maps configured and working for both
- [ ] Email/Slack alerts configured for critical errors
- [ ] Custom error contexts (user ID, org ID, request details) captured
- [ ] Sentry dashboard created and accessible
- [ ] Google Cloud Monitoring dashboard created (optional)
- [ ] All test endpoints working (`/api/sentry-test`, `/sentry-test`)
- [ ] Documentation complete

---

## Appendix A: Sentry Best Practices

1. **Error Grouping**:
   - Use custom fingerprinting for dynamic errors
   - Group by root cause, not error message

2. **Performance Monitoring**:
   - Enable Sentry Performance for slow transactions
   - Set up alerts for P95 latency spikes

3. **Privacy**:
   - Use `beforeSend` to scrub sensitive data
   - Mask PII in breadcrumbs
   - Configure data retention policies

4. **Cost Optimization**:
   - Use sampling in production (10-20%)
   - Filter out noisy errors (e.g., browser extensions)
   - Set up monthly quota alerts

---

## Appendix B: References

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Google Cloud Monitoring Integration](https://docs.sentry.io/product/integrations/gcp/)
- [Fastify Error Handling](https://www.fastify.io/docs/latest/Reference/Errors/)

---

**Plan Status**: Ready for Review
**Created**: 2026-01-17
**Last Updated**: 2026-01-17
