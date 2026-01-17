# Performance Testing Guide

## Overview

This document describes the performance testing setup for OpenHorizon using K6 load testing tool. The tests validate that the system can handle 50 concurrent users with acceptable performance metrics before the February 2026 Erasmus+ application deadlines.

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| **p50 Latency** | < 500ms | 🟡 To be measured |
| **p95 Latency** | < 1s | 🟡 To be measured |
| **p99 Latency** | < 2s | 🟡 To be measured |
| **Error Rate** | < 1% | 🟡 To be measured |
| **Throughput** | > 100 req/s | 🟡 To be measured |
| **Max Concurrent Users** | 50 users | 🟡 To be validated |

## Test Setup

### Prerequisites

1. **K6 Installation**: Load testing tool is installed at `~/bin/k6`
   ```bash
   k6 version
   # Output: k6 v0.54.0 (commit/baba871c8a, go1.23.1, linux/amd64)
   ```

2. **Test Scripts**: Located in `scripts/` directory
   - `load-test.js` - Full load test (50 users, 7 minutes)
   - `smoke-test.js` - Quick validation (1 user, 30 seconds)
   - `load-test.sh` - Test runner script

3. **Authentication**: Tests require valid authentication tokens to access protected tRPC endpoints

### Load Test Scenarios

#### Scenario 1: Smoke Test (Quick Validation)

**Purpose**: Verify endpoints are accessible before running full tests

**Configuration**:
- Users: 1
- Duration: 30 seconds
- Thresholds:
  - p95 latency < 2s
  - Error rate < 5%

**Usage**:
```bash
BASE_URL=https://app.openhorizon.cc ~/bin/k6 run scripts/smoke-test.js
```

**Results** (Initial Run - No Auth):
```
✓ http_req_duration: p(95) = 390ms (< 2s threshold) ✅
✗ http_req_failed: 65% (expected due to 401 auth errors)
✓ Home page loads: 100% success
✗ tRPC endpoints: Require authentication
```

**Findings**:
- Public endpoints (homepage) load quickly (50ms average)
- Protected tRPC endpoints return 401 (expected without auth)
- Infrastructure is responsive
- **Next Step**: Configure authenticated testing

#### Scenario 2: Load Test (Production Readiness)

**Purpose**: Validate system handles 50 concurrent users

**Configuration**:
- Ramp-up: 0 → 50 users over 1 minute
- Steady state: 50 users for 5 minutes
- Ramp-down: 50 → 0 users over 1 minute
- Total duration: 7 minutes

**Thresholds**:
- p95 latency < 1s (95% of requests complete within 1 second)
- p99 latency < 2s (99% of requests complete within 2 seconds)
- Error rate < 1% (highly available)
- Throughput > 100 req/s

**Usage**:
```bash
./scripts/load-test.sh
```

**Test Coverage**:

The load test exercises these critical user workflows:

1. **Dashboard Loading**:
   - `projects.list` - Lists all projects for organization
   - `pipeline.projects.list` - Lists pipeline projects with phases
   - `brainstorm.listSavedSeeds` - Lists saved brainstorm seeds

2. **Resource Browsing**:
   - `pipeline.vendors.list` - Vendor directory
   - `programmes.list` - Available funding programmes

3. **Think Time**: 1-3 second delays between actions (realistic user behavior)

### Authentication Configuration

**Current Status**: ⚠️ Not configured

The application uses Clerk for authentication. To run authenticated load tests:

**Option 1: Test User Tokens** (Recommended for staging)
```javascript
// In load-test.js, add auth header:
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`
};
```

```bash
# Run with auth token
AUTH_TOKEN="your_clerk_token" ./scripts/load-test.sh
```

**Option 2: Staging Environment**
```bash
# Test against staging with test auth
./scripts/load-test.sh --url https://staging.openhorizon.cc
```

**Option 3: Mock Organization**
- Create a dedicated test organization
- Generate persistent API key for load testing
- Configure in `.env.load-test`

## Test Execution

### Running Smoke Test

```bash
# Quick validation (30 seconds, 1 user)
BASE_URL=https://app.openhorizon.cc ~/bin/k6 run scripts/smoke-test.js
```

### Running Full Load Test

```bash
# Full 7-minute test with 50 concurrent users
./scripts/load-test.sh

# Custom configuration
./scripts/load-test.sh --url https://staging.example.com --users 25 --duration 3m

# With HTML report generation
./scripts/load-test.sh --report
```

### Results Location

Test results are saved in `test-results/load-tests/`:
- `results_YYYYMMDD_HHMMSS.json` - Full K6 metrics (JSON)
- `summary_YYYYMMDD_HHMMSS.json` - Summary statistics

## Performance Metrics

### Understanding K6 Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `http_req_duration` | Total request time (send + wait + receive) | p95 < 1s |
| `http_req_waiting` | Time waiting for server response (TTFB) | p95 < 800ms |
| `http_req_blocked` | Time waiting for connection slot | p95 < 10ms |
| `http_reqs` | Total requests made | > 100/s |
| `http_req_failed` | Percentage of failed requests | < 1% |

### Custom Metrics

The load test tracks additional metrics:

- `project_list_duration` - Time to load project list
- `pipeline_list_duration` - Time to load pipeline projects
- `seed_list_duration` - Time to load saved seeds
- `errors` - Custom error rate tracker
- `total_requests` - Request counter

## Bottleneck Identification

### Database Performance

Common bottlenecks to monitor:

1. **N+1 Query Problems**
   - Symptom: Latency increases with data size
   - Solution: Use Prisma `include` for eager loading
   - Example:
     ```typescript
     // Bad (N+1)
     const projects = await prisma.project.findMany();
     for (const p of projects) {
       const phases = await prisma.phase.findMany({ where: { projectId: p.id }});
     }

     // Good (Single query)
     const projects = await prisma.project.findMany({
       include: { phases: true }
     });
     ```

2. **Missing Indexes**
   - Symptom: Slow queries on WHERE clauses
   - Check: Monitor Supabase slow query log
   - Solution: Add database indexes
     ```prisma
     @@index([tenantId, createdAt])
     @@index([userId, isSaved])
     ```

3. **Large Result Sets**
   - Symptom: High latency on list endpoints
   - Solution: Implement pagination
     ```typescript
     .take(50)
     .skip(page * 50)
     ```

### Application Performance

1. **Slow AI Operations**
   - Monitor: `brainstorm.generate`, `seeds.elaborate` endpoints
   - Expected: 5-30 seconds (async job)
   - Optimization: Ensure Inngest queue is processing

2. **Memory Leaks**
   - Monitor: Response times degrade over test duration
   - Check: Server memory usage during load test
   - Solution: Profile with Node.js memory tools

3. **Connection Pool Exhaustion**
   - Symptom: "Too many connections" errors
   - Check: `DATABASE_URL` pool size (current: 6543 pooler port)
   - Solution: Increase Supabase connection pool

## Optimization Checklist

After running load tests, optimize if performance targets aren't met:

### Backend Optimizations

- [ ] **Database Indexes**
  ```sql
  -- Check slow queries in Supabase
  SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

  -- Add indexes for commonly filtered fields
  CREATE INDEX idx_projects_tenant_created ON "Project" ("tenantId", "createdAt" DESC);
  CREATE INDEX idx_seeds_user_saved ON "Seed" ("userId", "isSaved", "isDismissed");
  ```

- [ ] **Query Optimization**
  - Review Prisma queries with `DEBUG=prisma:query`
  - Eliminate N+1 queries with `include` or `select`
  - Add field-level projections to reduce data transfer

- [ ] **Caching**
  - Cache frequently accessed data (programmes list, etc.)
  - Add Redis for session storage
  - Implement HTTP caching headers for static content

- [ ] **Response Compression**
  - Enable Next.js compression
  - Compress large JSON responses

### Frontend Optimizations

- [ ] **Code Splitting**
  - Lazy load heavy components
  - Split vendor bundles

- [ ] **API Request Batching**
  - tRPC already batches - verify it's enabled
  - Reduce parallel requests on page load

- [ ] **Resource Optimization**
  - Optimize images (WebP, lazy loading)
  - Minimize JavaScript bundle size

## Continuous Monitoring

### Pre-Deployment Tests

Run load tests before each production deployment:

```bash
# Add to CI/CD pipeline
npm run test:load
```

### Production Monitoring

Set up monitoring to track real-world performance:

1. **Application Performance Monitoring (APM)**
   - Recommended: Vercel Analytics, New Relic, or Datadog
   - Track p95/p99 latencies in production

2. **Database Monitoring**
   - Supabase Query Performance dashboard
   - Alert on slow queries (> 1s)

3. **Error Tracking**
   - Sentry for error monitoring
   - Alert on error rate > 1%

## Known Issues & Limitations

### Current Setup

✅ **Completed**:
- K6 installed and configured
- Smoke test validates infrastructure
- Load test script ready (50 users, 7 minutes)
- Test runner script with reporting

⚠️ **Pending**:
- Authentication configuration for protected endpoints
- Baseline performance measurement
- Staging environment setup (optional)
- CI/CD integration

### Authentication Requirement

The current tests return 401 errors on tRPC endpoints because:
1. tRPC routes use `orgProcedure` which requires Clerk authentication
2. Load tests need valid bearer tokens to access protected routes

**Workaround Options**:
1. Create test user with API key
2. Set up staging environment with mock auth
3. Modify tRPC context for load test mode (not recommended for production)

## Next Steps

1. ✅ **Install K6** - Complete
2. ✅ **Create test scripts** - Complete
3. ✅ **Run smoke test** - Complete (with expected auth errors)
4. ⏳ **Configure authentication** - Pending
5. ⏳ **Run full load test** - Pending auth setup
6. ⏳ **Analyze results** - After authenticated test runs
7. ⏳ **Optimize bottlenecks** - Based on results
8. ⏳ **Re-test** - Validate optimizations

## References

- [K6 Documentation](https://k6.io/docs/)
- [K6 Performance Testing Guide](https://k6.io/docs/testing-guides/running-large-tests/)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

---

**Last Updated**: 2026-01-17
**Test Status**: Infrastructure ready, awaiting auth configuration
**Next Milestone**: Configure test authentication and establish baseline metrics
