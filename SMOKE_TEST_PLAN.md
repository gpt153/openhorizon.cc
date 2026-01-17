# Implementation Plan: Production Smoke Tests (#132)

## Epic Context
Part of [Epic 003: Production Readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)

**Purpose**: Create automated smoke tests that run against production URL (`app.openhorizon.cc`) to verify critical functionality after each deployment. These tests catch catastrophic failures before users encounter them.

**Success Criteria**: Fast (<30s), non-destructive tests that verify homepage, authentication, protected routes, database connectivity, and Inngest webhook health.

---

## Architecture Overview

### Project Structure
- **Monorepo**: `openhorizon.cc/` contains `app/` and `landing/` workspaces
- **Main App**: Next.js 16.0.10 app with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk authentication
- **Background Jobs**: Inngest for async processing
- **Existing Tests**: Playwright E2E tests in `app/tests/`

### Technology Stack
- **TypeScript** for type safety and Node.js compatibility
- **Node.js native fetch** for HTTP requests (available in Node 18+)
- **Prisma Client** for database health check
- **Zod** for response validation (already in dependencies)

---

## Implementation Tasks

### 1. Create Smoke Test Script

**File**: `scripts/smoke-test.ts`

**Location**: Root of monorepo (same level as `app/`, `landing/`, `package.json`)

**Rationale**:
- TypeScript provides better error messages and type safety
- Can leverage existing dependencies (Zod for validation)
- Easy to maintain and extend
- Works with existing npm scripts infrastructure

**Core Functionality**:
```typescript
// Main smoke test orchestrator
async function runSmokeTests(baseUrl: string): Promise<void> {
  const checks = [
    homepageCheck,
    authEndpointsCheck,
    protectedRouteCheck,
    healthCheckEndpointCheck,
    inngestWebhookCheck
  ];

  // Run all checks sequentially
  // Exit with code 1 on first failure
  // Exit with code 0 if all pass
}
```

**Test Checks**:

1. **Homepage Load Test**
   - HTTP GET to `${baseUrl}`
   - Assert HTTP 200 response
   - Assert response time < 2000ms
   - Assert HTML contains expected content (e.g., "OpenHorizon" or specific meta tags)
   - **Why**: Confirms app is reachable and basic rendering works

2. **Authentication Endpoints Test**
   - Check Clerk integration is responding
   - Test `/api/webhooks/clerk` exists (POST endpoint)
   - Verify redirect to Clerk sign-in for unauthenticated users
   - **Why**: Confirms auth system is operational
   - **Note**: Not testing full signup/login flow (that's E2E's job)

3. **Protected Route Authorization Test**
   - HTTP GET to `${baseUrl}/projects` without auth
   - Expect redirect to sign-in (302/307 status or Clerk URL in response)
   - **Why**: Confirms authorization middleware is working

4. **Database Health Check**
   - HTTP GET to `${baseUrl}/api/health`
   - Expect HTTP 200
   - Expect JSON: `{ status: "ok", database: "connected", timestamp: string }`
   - **Why**: Confirms database connectivity
   - **Implementation**: New endpoint (see Task 2)

5. **Inngest Webhook Test**
   - HTTP GET to `${baseUrl}/api/inngest`
   - Expect HTTP 200 or 405 (405 = GET not allowed, which is fine)
   - **Why**: Confirms background job system endpoint is reachable
   - **Note**: Existing endpoint at `app/src/app/api/inngest/route.ts`

**Error Handling**:
- Each check returns `{ success: boolean, message: string, duration: number }`
- Failed checks print detailed error messages
- Script exits with non-zero code on any failure
- All checks run even if one fails (collect all failures)

**Output Format**:
```
🔍 Running smoke tests against: https://app.openhorizon.cc

✅ Homepage Load (812ms)
✅ Authentication Endpoints (234ms)
✅ Protected Route Authorization (156ms)
✅ Database Health Check (89ms)
✅ Inngest Webhook (45ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL CHECKS PASSED (1.34s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Or on failure:
```
🔍 Running smoke tests against: https://app.openhorizon.cc

✅ Homepage Load (812ms)
❌ Authentication Endpoints (5002ms)
   Error: Request timeout after 5000ms
✅ Protected Route Authorization (156ms)
✅ Database Health Check (89ms)
❌ Inngest Webhook (0ms)
   Error: Connection refused

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 2 of 5 checks FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. Create Health Check API Endpoint

**File**: `app/src/app/api/health/route.ts`

**Purpose**: Lightweight endpoint that verifies database connectivity

**Implementation**:
```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db' // Prisma client

export const dynamic = 'force-dynamic' // Never cache

export async function GET() {
  try {
    // Lightweight query to verify DB connection
    // Prisma $queryRaw executes raw SQL: SELECT 1
    await db.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 } // Service Unavailable
    )
  }
}
```

**Key Decisions**:
- **`SELECT 1` query**: Minimal database operation, doesn't access any tables
- **No authentication required**: Health checks should be publicly accessible
- **503 on failure**: Standard HTTP status for service unavailability
- **Include timestamp**: Helps verify response is fresh, not cached

**Testing**:
- Should return 200 when database is up
- Should return 503 when database is down (test by stopping DB locally)

---

### 3. Add npm Scripts

**File**: `package.json` (root monorepo)

**Scripts to add**:
```json
{
  "scripts": {
    "smoke-test": "tsx scripts/smoke-test.ts",
    "smoke-test:prod": "tsx scripts/smoke-test.ts https://app.openhorizon.cc",
    "smoke-test:staging": "tsx scripts/smoke-test.ts https://oh.153.se"
  }
}
```

**Dependencies to add** (if not present):
```json
{
  "devDependencies": {
    "tsx": "^4.7.0"  // TypeScript executor (faster than ts-node)
  }
}
```

**Rationale**:
- `tsx` is already used in the codebase (check via grep)
- Allows running TypeScript directly without build step
- Simple, clean command: `npm run smoke-test:prod`

**File**: `app/package.json`

**Scripts to add**:
```json
{
  "scripts": {
    "smoke-test": "tsx ../scripts/smoke-test.ts http://localhost:3000",
    "smoke-test:prod": "tsx ../scripts/smoke-test.ts https://app.openhorizon.cc"
  }
}
```

**Rationale**: Allows running from `app/` workspace directory

---

### 4. Environment Variables

**No new environment variables needed!**

- Smoke tests accept URL as CLI argument
- Health check endpoint uses existing `DATABASE_URL` (already configured)
- No secrets needed (tests are read-only, public endpoints)

---

## File Structure Summary

```
openhorizon.cc/
├── scripts/
│   └── smoke-test.ts                 # NEW - Main smoke test script
├── app/
│   ├── src/app/api/
│   │   ├── health/
│   │   │   └── route.ts              # NEW - Health check endpoint
│   │   └── inngest/
│   │       └── route.ts              # EXISTS - Inngest webhook
│   ├── package.json                  # MODIFY - Add smoke-test script
│   └── tests/
│       └── production-verification.spec.ts  # EXISTS - Similar tests (Playwright)
└── package.json                      # MODIFY - Add smoke-test scripts, tsx dep
```

---

## Testing Strategy

### Local Testing
1. Start app locally: `cd app && npm run dev`
2. Run smoke tests: `npm run smoke-test` (from root)
3. Expected: All checks pass against `http://localhost:3000`

### Production Testing
1. Run: `npm run smoke-test:prod`
2. Expected: All checks pass against `https://app.openhorizon.cc`

### Failure Testing
1. Stop local database
2. Run smoke tests
3. Expected: Health check fails with clear error message

---

## Integration with CI/CD

**Not in scope for this issue**, but recommended next step:

```yaml
# .github/workflows/production-deployment.yml
- name: Deploy to Production
  run: ./deploy.sh

- name: Run Smoke Tests
  run: npm run smoke-test:prod

- name: Rollback on Failure
  if: failure()
  run: ./rollback.sh
```

---

## Success Metrics

- [x] Smoke test script created and executable
- [x] Homepage load test passes (HTTP 200, <2s)
- [x] Authentication endpoints verified working
- [x] Protected routes require auth (redirect to login)
- [x] Database connectivity verified (health check passes)
- [x] Inngest webhook endpoint responds
- [x] Smoke tests run in <30 seconds
- [x] Script exits with proper status codes (0=success, 1=failure)
- [x] Clear, actionable error messages on failure

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Smoke tests too slow | Delays deployment feedback | Keep checks lightweight; set 5s timeout per check |
| False positives | Ignored test failures | Make assertions specific; avoid flaky checks |
| Production data modification | Data corruption | All checks are read-only (GET requests only) |
| Clerk auth changes break tests | Tests fail unnecessarily | Test auth redirect, not full login flow |
| Database health check timeout | False negative | Use simple `SELECT 1` query; 3s timeout |

---

## Timeline

**Estimated Time**: 2 hours

1. **Health check endpoint** (20 min)
   - Create `app/src/app/api/health/route.ts`
   - Test locally (DB up/down scenarios)

2. **Smoke test script** (60 min)
   - Create `scripts/smoke-test.ts`
   - Implement all 5 checks
   - Add error handling and output formatting

3. **npm scripts & dependencies** (10 min)
   - Update `package.json` files
   - Install `tsx` if needed

4. **Testing & validation** (30 min)
   - Test locally against dev server
   - Test against production
   - Test failure scenarios
   - Verify output formatting

---

## Dependencies

**No blocking dependencies**. This task can be done independently in parallel with other Epic 003 issues.

**Related Issues** (informational only):
- Issue #133: E2E Test Infrastructure - Shares similar testing concerns
- Issue #134: Error Tracking Setup - Would consume smoke test failures in production

---

## Open Questions

**Q1**: Should smoke tests run on every commit or only post-deployment?
**A1**: Post-deployment only (as per epic). Running on every commit is E2E's job.

**Q2**: Should we test the landing page (`openhorizon.cc`) too?
**A2**: Out of scope. Issue focuses on app functionality. Landing page has minimal failure risk.

**Q3**: What if Clerk is down?
**A3**: Auth endpoint check will fail. This is correct behavior - app is unusable without Clerk.

---

## Implementation Notes

### Why TypeScript over Bash?
- Better error handling
- Type safety for response validation
- Easier to maintain and extend
- Can use Zod schemas from app codebase
- More familiar to team (Next.js/TypeScript shop)

### Why not Playwright?
- Playwright is heavy (launches browser)
- Smoke tests should be fast CLI checks
- No need for DOM interaction
- Playwright used for E2E tests (different concern)

### Why separate from E2E tests?
- E2E tests are comprehensive, slow (minutes)
- Smoke tests are quick, focused (seconds)
- E2E tests run pre-merge; smoke tests run post-deploy
- Different tools for different jobs

---

## Acceptance Criteria Checklist

- [ ] `scripts/smoke-test.ts` created and executable
- [ ] `app/src/app/api/health/route.ts` created
- [ ] Health check endpoint returns 200 when DB connected
- [ ] Health check endpoint returns 503 when DB disconnected
- [ ] Homepage load test implemented (HTTP 200, <2s)
- [ ] Auth endpoints check implemented
- [ ] Protected route check implemented
- [ ] Database connectivity check implemented
- [ ] Inngest webhook check implemented
- [ ] npm scripts added to `package.json`
- [ ] Script exits with code 0 on success
- [ ] Script exits with code 1 on failure
- [ ] Clear success/failure output with timing
- [ ] All tests pass against local dev server
- [ ] All tests pass against production URL
- [ ] Tests complete in <30 seconds
- [ ] No production data modified by tests

---

## Next Steps After Implementation

1. **Update deployment documentation** with smoke test usage
2. **Integrate into CI/CD pipeline** (separate issue)
3. **Set up alerts** if smoke tests fail in production (Issue #134)
4. **Add more checks** as needed (e.g., API response time percentiles)

---

## References

- [Epic 003: Production Readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
- [Existing production verification tests](app/tests/production-verification.spec.ts)
- [Playwright config](app/playwright.config.ts)
- [Inngest route](app/src/app/api/inngest/route.ts)
- [Prisma schema](app/prisma/schema.prisma)
