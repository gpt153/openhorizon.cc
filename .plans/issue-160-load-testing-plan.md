# Implementation Plan: Issue #160 - K6 Load Testing

**Epic:** #003 Production Readiness & Testing
**Issue:** #160 - Performance Testing - Load Validation
**Priority:** Medium
**Depends on:** #154
**Status:** Plan Complete, Ready for Execution

---

## Executive Summary

Load testing infrastructure for K6 **already exists** but is incomplete. The existing implementation:
- ✅ Has K6 scripts (load-test.js, smoke-test.js, load-test.sh)
- ✅ Has comprehensive documentation (PERFORMANCE.md, scripts/README.md)
- ✅ Has NPM scripts configured (`test:load`, `test:smoke`)
- ❌ Missing K6 binary installation (k6 not found at ~/bin/k6)
- ❌ Missing authentication setup for protected endpoints
- ❌ Missing tests for specific endpoints mentioned in issue (project creation, vendor search, document export)
- ⏳ Never been run with authentication (only smoke tested without auth)

**This plan will:**
1. Install K6 binary
2. Enhance existing load test to cover issue requirements
3. Set up authentication for protected endpoints
4. Run baseline load test and collect metrics
5. Identify and fix performance bottlenecks
6. Validate acceptance criteria

---

## Issue Requirements Analysis

### Tasks from Issue #160

1. ✅ **Install K6 for load testing** - Scripts exist, binary missing
2. ✅ **Create load test scenario (50 concurrent users)** - Script exists in `scripts/load-test.js`
3. ⚠️ **Test critical endpoints** - Partially covered, missing specific endpoints:
   - ❌ Project creation (POST mutation)
   - ❌ Vendor search (background job trigger)
   - ❌ Document export (file generation)
4. ⏳ **Identify performance bottlenecks** - Can't run until auth configured
5. ⏳ **Optimize if needed** - Depends on results

### Acceptance Criteria

- [ ] System handles 50 concurrent users
- [ ] p95 latency < 1s for critical endpoints
- [ ] Project creation tested under load
- [ ] Vendor search tested under load
- [ ] Document export tested under load
- [ ] Performance bottlenecks identified
- [ ] Optimizations applied (if needed)

---

## Current State Assessment

### What Already Exists

**Files:**
```
scripts/
├── load-test.js           # K6 load test (50 users, 7 min)
├── smoke-test.js          # K6 smoke test (1 user, 30s)
├── load-test.sh           # Test runner script
└── README.md              # Quick start guide

docs/
└── PERFORMANCE.md         # Comprehensive documentation (3000+ lines)

LOAD_TESTING_IMPLEMENTATION.md  # Previous implementation summary
```

**NPM Scripts (app/package.json):**
```json
{
  "test:load": "K6_BIN=$HOME/bin/k6 ../scripts/load-test.sh",
  "test:smoke": "BASE_URL=https://app.openhorizon.cc $HOME/bin/k6 run ../scripts/smoke-test.js"
}
```

**Current Test Coverage (load-test.js):**
- ✅ Health check (GET /)
- ✅ Project list (GET /api/trpc/projects.list)
- ✅ Pipeline projects list (GET /api/trpc/pipeline.projects.list)
- ✅ Saved seeds list (GET /api/trpc/brainstorm.listSavedSeeds)
- ✅ Vendor list (GET /api/trpc/pipeline.vendors.list)
- ✅ Programme list (GET /api/trpc/programmes.list)

**Missing from Issue Requirements:**
- ❌ Project creation (POST /api/trpc/pipeline.projects.create)
- ❌ Vendor search trigger (POST /api/trpc/pipeline.searchJobs.triggerSearch)
- ❌ Document export (GET /api/projects/[id]/export)

### Gaps to Fill

1. **K6 Installation**
   - Binary not installed at ~/bin/k6
   - Scripts reference K6_BIN=$HOME/bin/k6

2. **Authentication**
   - All tRPC endpoints require Clerk JWT
   - Scripts have placeholder for AUTH_TOKEN
   - Need test user credentials

3. **Missing Endpoint Tests**
   - Project creation mutations
   - Vendor search background jobs
   - Document export endpoints

4. **Never Run with Auth**
   - Only smoke tested without auth (401 errors expected)
   - No baseline metrics collected
   - No bottlenecks identified

---

## Implementation Strategy

### Phase 1: Infrastructure Setup (30 min)

**Goal:** Install K6 and verify basic functionality

**Tasks:**
1. Install K6 binary to ~/bin/k6
2. Verify K6 version and functionality
3. Run smoke test without auth (baseline)
4. Document installation steps

**Success Criteria:**
- `~/bin/k6 version` shows v0.54.0 or later
- Smoke test runs successfully (401s are acceptable)
- Infrastructure validated

**Commands:**
```bash
# Install K6
cd /tmp
curl -L https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz -o k6.tar.gz
tar -xzf k6.tar.gz
mkdir -p ~/bin
mv k6-v0.54.0-linux-amd64/k6 ~/bin/
chmod +x ~/bin/k6

# Verify
~/bin/k6 version

# Test
BASE_URL=https://app.openhorizon.cc ~/bin/k6 run scripts/smoke-test.js
```

---

### Phase 2: Authentication Setup (45 min)

**Goal:** Configure load tests to use authenticated requests

**Approach:** Create a test user session token

**Options:**

**Option A: Manual Token (Quick, for testing)**
```bash
# 1. Log in to https://app.openhorizon.cc
# 2. Open browser DevTools → Application → Cookies
# 3. Copy __session cookie value
# 4. Use in tests:
export AUTH_TOKEN="<session-token>"
```

**Option B: Programmatic (Better, for CI/CD)**
```javascript
// In setup() function of load-test.js
import http from 'k6/http';

export function setup() {
  // Login via Clerk and get session
  const loginRes = http.post('https://app.openhorizon.cc/api/auth/signin', {
    // Auth payload
  });

  const sessionToken = loginRes.cookies.__session[0].value;
  return { sessionToken };
}
```

**Option C: Environment Variable (Simplest)**
```bash
# Set in environment
export CLERK_TEST_TOKEN="<manually-obtained-token>"

# Update load-test.js headers
const headers = {
  'Content-Type': 'application/json',
  'Cookie': `__session=${__ENV.CLERK_TEST_TOKEN}`
};
```

**Implementation:**
1. Create test user in Clerk dashboard (if not exists)
2. Obtain session token via Option C (simplest)
3. Update `scripts/load-test.js` to use token
4. Test with single authenticated request
5. Document token refresh process

**Files to Modify:**
- `scripts/load-test.js` - Add authentication headers
- `scripts/smoke-test.js` - Add authentication headers
- `.env.test.example` - Document CLERK_TEST_TOKEN variable

**Success Criteria:**
- Can make authenticated tRPC requests
- Receives 200 responses (not 401s)
- Can list user's actual projects

---

### Phase 3: Enhance Load Tests for Issue Requirements (1 hour)

**Goal:** Add tests for project creation, vendor search, and document export

**Current Coverage:**
```
✅ Dashboard loading (projects.list, pipeline.projects.list, brainstorm.listSavedSeeds)
✅ Resource browsing (pipeline.vendors.list, programmes.list)
❌ Project creation (mutation)
❌ Vendor search (mutation + job polling)
❌ Document export (file download)
```

**New Test Functions to Add:**

#### 3.1 Project Creation Test
```javascript
/**
 * Test project creation endpoint
 */
function testProjectCreation() {
  group('Project Creation', () => {
    const projectData = {
      name: `Load Test Project ${Date.now()}`,
      description: 'Performance testing project',
      seedId: null, // Optional: link to seed
      // Other required fields
    };

    const start = Date.now();
    const response = trpcMutation('pipeline.projects.create', projectData);
    const duration = Date.now() - start;

    projectCreationDuration.add(duration);

    const success = check(response, {
      'project creation status is 200': (r) => r.status === 200,
      'project creation time < 2s': (r) => r.timings.duration < 2000,
      'project has ID in response': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result?.data?.id !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);

    // Store created project ID for cleanup
    if (success && response.status === 200) {
      try {
        const body = JSON.parse(response.body);
        const projectId = body.result.data.id;
        // Note: We may need cleanup later
        return projectId;
      } catch {}
    }
  });
}
```

#### 3.2 Vendor Search Test
```javascript
/**
 * Test vendor search trigger (background job)
 */
function testVendorSearch(projectId) {
  group('Vendor Search', () => {
    const searchData = {
      projectId: projectId,
      phaseId: '<phase-id>', // Need to get from project
      searchType: 'food', // or 'accommodation', 'travel'
      location: 'Barcelona, Spain',
      participantCount: 30,
      startDate: '2026-07-01',
      endDate: '2026-07-10',
    };

    const start = Date.now();
    const response = trpcMutation('pipeline.searchJobs.triggerSearch', searchData);
    const duration = Date.now() - start;

    vendorSearchDuration.add(duration);

    const success = check(response, {
      'vendor search trigger status is 200': (r) => r.status === 200,
      'vendor search trigger time < 1s': (r) => r.timings.duration < 1000,
      'job ID returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result?.data?.jobId !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);

    // Note: We're not polling for results in load test (too slow)
    // We just verify the job was triggered successfully
  });
}
```

#### 3.3 Document Export Test
```javascript
/**
 * Test document export endpoint
 */
function testDocumentExport(projectId) {
  group('Document Export', () => {
    // Test PDF export
    const pdfUrl = `${BASE_URL}/api/projects/${projectId}/export?format=pdf`;

    const start = Date.now();
    const response = http.get(pdfUrl, {
      headers: {
        ...headers,
      },
      tags: { type: 'export', format: 'pdf' }
    });
    const duration = Date.now() - start;

    documentExportDuration.add(duration);

    const success = check(response, {
      'export status is 200': (r) => r.status === 200,
      'export response time < 3s': (r) => r.timings.duration < 3000,
      'export content-type is PDF': (r) => r.headers['Content-Type']?.includes('application/pdf'),
      'export file size > 0': (r) => r.body.length > 0,
    });

    errorRate.add(!success);
  });
}
```

#### 3.4 Update Main Test Flow
```javascript
export default function () {
  // Existing: Health check and dashboard loading
  testHealthCheck();
  sleep(1);
  testProjectList();
  sleep(0.5);
  testPipelineList();
  sleep(0.5);
  testSeedList();
  sleep(0.5);

  // NEW: Test write operations (with lower frequency)
  // Only 10% of users create projects (to avoid DB bloat)
  if (Math.random() < 0.1) {
    const projectId = testProjectCreation();
    sleep(1);

    if (projectId) {
      testVendorSearch(projectId);
      sleep(2);
      testDocumentExport(projectId);
      sleep(1);
    }
  }

  // Continue with read operations
  testVendorList();
  sleep(0.5);
  testProgrammesList();

  sleep(Math.random() * 2 + 1);
}
```

**Custom Metrics to Add:**
```javascript
const projectCreationDuration = new Trend('project_creation_duration');
const vendorSearchDuration = new Trend('vendor_search_duration');
const documentExportDuration = new Trend('document_export_duration');
```

**Files to Modify:**
- `scripts/load-test.js` - Add new test functions
- `scripts/load-test.js` - Add custom metrics
- `scripts/load-test.js` - Update main flow

**Success Criteria:**
- All 3 new endpoints are tested
- Metrics collected for each
- Tests run without errors (200 responses)

---

### Phase 4: Run Baseline Load Test (1 hour)

**Goal:** Collect performance metrics with 50 concurrent users

**Prerequisites:**
- ✅ K6 installed
- ✅ Authentication configured
- ✅ Enhanced tests deployed

**Test Execution:**
```bash
# 1. Set authentication
export CLERK_TEST_TOKEN="<your-token>"

# 2. Run full load test
cd /worktrees/openhorizon.cc/issue-160
./scripts/load-test.sh --url https://app.openhorizon.cc

# 3. Monitor in real-time
tail -f test-results/load-tests/*.json
```

**Metrics to Collect:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Response Times** | | |
| p50 (median) | < 500ms | Via K6 http_req_duration |
| p95 (95th percentile) | < 1s | Via K6 http_req_duration |
| p99 (99th percentile) | < 2s | Via K6 http_req_duration |
| **Error Rate** | < 1% | Via K6 http_req_failed |
| **Throughput** | > 100 req/s | Via K6 http_reqs |
| **Endpoint-Specific** | | |
| Project creation | < 2s (p95) | project_creation_duration |
| Vendor search trigger | < 1s (p95) | vendor_search_duration |
| Document export | < 3s (p95) | document_export_duration |
| Project list | < 1s (p95) | project_list_duration |
| Pipeline list | < 1s (p95) | pipeline_list_duration |

**Expected Outputs:**
```
test-results/load-tests/
├── results_YYYYMMDD_HHMMSS.json    # Full metrics
├── summary_YYYYMMDD_HHMMSS.json    # Summary
└── baseline-report.md               # Human-readable analysis
```

**Analysis Tasks:**
1. Extract key metrics from summary JSON
2. Identify slow endpoints (p95 > threshold)
3. Check error rates per endpoint
4. Document findings in baseline-report.md

**Success Criteria:**
- Test completes successfully (no crashes)
- Metrics collected for all endpoints
- Results documented
- Bottlenecks identified

---

### Phase 5: Identify and Fix Bottlenecks (2-4 hours, conditional)

**Goal:** Optimize slow endpoints to meet performance targets

**Approach:** Data-driven optimization based on baseline results

**Common Bottlenecks and Fixes:**

#### 5.1 Slow Database Queries (if p95 > 1s)

**Diagnosis:**
```sql
-- Check slow queries in production
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Common Fixes:**
1. **Add indexes** for frequent WHERE clauses
   ```sql
   CREATE INDEX idx_projects_user_id ON projects(user_id);
   CREATE INDEX idx_phases_project_id ON phases(project_id);
   ```

2. **Optimize Prisma includes** (N+1 query problems)
   ```typescript
   // Before (N+1 problem)
   const projects = await prisma.project.findMany();
   // Each project fetches phases separately

   // After (single query with JOIN)
   const projects = await prisma.project.findMany({
     include: {
       phases: true,
       seeds: true,
     }
   });
   ```

3. **Add database connection pooling**
   ```env
   DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
   ```

#### 5.2 Large Response Payloads (if export > 3s)

**Diagnosis:**
- Check response size in K6 metrics
- Monitor network transfer time

**Fixes:**
1. **Enable compression** (if not already)
   ```typescript
   // next.config.ts
   module.exports = {
     compress: true, // Enable gzip
   }
   ```

2. **Paginate large lists**
   ```typescript
   // Add pagination to project list
   input: z.object({
     limit: z.number().default(20),
     offset: z.number().default(0),
   })
   ```

3. **Reduce included data**
   ```typescript
   // Only include what UI needs
   select: {
     id: true,
     name: true,
     status: true,
     // Don't include large fields
   }
   ```

#### 5.3 Slow tRPC Batching (if dashboard load > 1s)

**Diagnosis:**
- Check if batch requests are slower than individual
- Monitor http_req_duration for batch vs. single

**Fixes:**
1. **Optimize batch configuration**
   ```typescript
   // app/src/utils/trpc.ts
   links: [
     httpBatchLink({
       url: '/api/trpc',
       maxURLLength: 2083,
       maxBatchSize: 10, // Limit batch size
     }),
   ]
   ```

2. **Use dataloader pattern** for common lookups
   ```typescript
   // Cache user lookups within request
   const userLoader = new DataLoader(loadUsers);
   ```

#### 5.4 Slow Document Export (if export > 3s)

**Diagnosis:**
- Check if PDF generation is blocking
- Monitor CPU usage during export

**Fixes:**
1. **Cache generated documents**
   ```typescript
   // Check if already generated
   const cached = await redis.get(`export:${projectId}:pdf`);
   if (cached) return cached;

   // Generate and cache
   const pdf = await generatePDF(project);
   await redis.set(`export:${projectId}:pdf`, pdf, 'EX', 3600);
   ```

2. **Offload to background job**
   ```typescript
   // Return job ID immediately, generate async
   const jobId = await inngest.send({
     name: 'export.generate',
     data: { projectId, format: 'pdf' }
   });

   return { jobId, status: 'processing' };
   ```

**Optimization Priority:**
1. **Critical** (blocking launch): p95 > 2s for any endpoint
2. **High** (affects UX): p95 > 1s for dashboard/list endpoints
3. **Medium** (nice to have): p95 > 500ms
4. **Low**: Throughput < 100 req/s (unlikely with 50 users)

**Files to Modify (examples):**
- `app/src/server/routers/pipeline/projects.ts` - Add indexes, optimize queries
- `app/src/server/routers/projects.ts` - Optimize includes
- `app/src/app/api/projects/[id]/export/route.ts` - Add caching or async
- `prisma/schema.prisma` - Add indexes

**Success Criteria:**
- All endpoints meet p95 targets
- Error rate < 1%
- No obvious bottlenecks remaining

---

### Phase 6: Re-test and Validate (30 min)

**Goal:** Confirm optimizations improved performance

**Tasks:**
1. Run full load test again
2. Compare metrics to baseline
3. Document improvements
4. Update performance targets

**Comparison Report:**
```markdown
# Performance Improvement Report

## Baseline (Before Optimization)
- p95 latency: 1.8s
- p99 latency: 3.2s
- Error rate: 0.2%
- Throughput: 95 req/s

## After Optimization
- p95 latency: 0.7s ✅ (-61%)
- p99 latency: 1.4s ✅ (-56%)
- Error rate: 0.1% ✅ (-50%)
- Throughput: 125 req/s ✅ (+31%)

## Changes Applied
1. Added index on projects.user_id
2. Optimized Prisma includes for project list
3. Enabled response compression
4. Cached programme list (rarely changes)

## Acceptance Criteria
- [x] System handles 50 concurrent users
- [x] p95 latency < 1s
- [x] Error rate < 1%
```

**Success Criteria:**
- All acceptance criteria met
- Performance regression tests pass
- Documentation updated

---

### Phase 7: Documentation and Handoff (30 min)

**Goal:** Document setup, results, and maintenance procedures

**Deliverables:**

1. **Update LOAD_TESTING_IMPLEMENTATION.md**
   - Mark all tasks complete
   - Add baseline metrics
   - Document optimizations applied

2. **Create PERFORMANCE_BASELINE.md**
   ```markdown
   # Performance Baseline (2026-01-17)

   ## Test Configuration
   - Users: 50 concurrent
   - Duration: 7 minutes
   - Location: Europe (Cloud Run)

   ## Metrics
   - p50: 350ms
   - p95: 720ms
   - p99: 1.2s
   - Error rate: 0.08%
   - Throughput: 125 req/s

   ## Endpoint Performance
   | Endpoint | p95 | p99 | Notes |
   |----------|-----|-----|-------|
   | projects.list | 450ms | 780ms | Optimized with indexes |
   | project.create | 1.2s | 1.8s | Within target |
   | vendor.search | 650ms | 980ms | Triggers background job |
   | export.pdf | 2.1s | 2.8s | Acceptable for file generation |
   ```

3. **Update scripts/README.md**
   - Add authentication instructions
   - Document how to run tests
   - Add troubleshooting section

4. **Add CI/CD Integration (optional)**
   ```yaml
   # .github/workflows/load-test.yml
   name: Load Test
   on:
     schedule:
       - cron: '0 2 * * 1' # Weekly on Monday 2 AM
     workflow_dispatch:

   jobs:
     load-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Install K6
           run: |
             curl -L https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz | tar -xz
             sudo mv k6-v0.54.0-linux-amd64/k6 /usr/local/bin/
         - name: Run Load Test
           env:
             CLERK_TEST_TOKEN: ${{ secrets.CLERK_TEST_TOKEN }}
           run: ./scripts/load-test.sh --url https://app.openhorizon.cc
         - name: Upload Results
           uses: actions/upload-artifact@v3
           with:
             name: load-test-results
             path: test-results/load-tests/
   ```

**Success Criteria:**
- Documentation complete and accurate
- Team can reproduce tests
- Results archived for comparison

---

## Risk Assessment

### High Risk ⚠️

**Risk:** Authentication setup may be complex
**Mitigation:** Use simple cookie-based approach first, document process
**Fallback:** Create staging environment with mock auth

**Risk:** Performance issues may require significant refactoring
**Mitigation:** Start with low-hanging fruit (indexes, compression), prioritize critical endpoints
**Fallback:** Defer non-critical optimizations to future sprint

### Medium Risk ⚠️

**Risk:** Test data pollution (creating many projects during load test)
**Mitigation:** Only 10% of VUs create projects, add cleanup script
**Fallback:** Use dedicated test database

**Risk:** Background jobs (vendor search) may timeout
**Mitigation:** Only test trigger endpoint, not job completion
**Fallback:** Mock Inngest for load tests

### Low Risk ✅

**Risk:** K6 installation issues
**Mitigation:** Well-documented installation process, tested previously

**Risk:** Test scripts have bugs
**Mitigation:** Start with smoke test, gradually increase load

---

## Estimated Timeline

| Phase | Duration | Complexity | Dependencies |
|-------|----------|------------|--------------|
| 1. Infrastructure Setup | 30 min | Low | None |
| 2. Authentication Setup | 45 min | Medium | Phase 1 |
| 3. Enhance Load Tests | 1 hour | Medium | Phase 2 |
| 4. Run Baseline Test | 1 hour | Low | Phase 3 |
| 5. Identify & Fix Bottlenecks | 2-4 hours | High | Phase 4 (conditional) |
| 6. Re-test & Validate | 30 min | Low | Phase 5 |
| 7. Documentation | 30 min | Low | Phase 6 |
| **Total** | **5.5-7.5 hours** | | |

**Best Case:** 5.5 hours (no major optimizations needed)
**Likely Case:** 6.5 hours (minor optimizations)
**Worst Case:** 7.5 hours (significant optimizations required)

---

## Success Criteria (from Issue)

- [ ] K6 installed and configured
- [ ] Load test scenario created (50 concurrent users)
- [ ] Critical endpoints tested:
  - [ ] Project creation
  - [ ] Vendor search
  - [ ] Document export
- [ ] Performance metrics collected
- [ ] Bottlenecks identified
- [ ] Optimizations applied (if needed)
- [ ] System handles 50 concurrent users
- [ ] p95 latency < 1s for critical endpoints
- [ ] Error rate < 1% during load test

---

## Files to Create/Modify

### New Files
```
.github/workflows/load-test.yml         # CI/CD integration (optional)
docs/PERFORMANCE_BASELINE.md            # Baseline metrics
test-results/load-tests/.gitkeep        # Results directory
```

### Modified Files
```
scripts/load-test.js                    # Add authentication, new endpoints
scripts/smoke-test.js                   # Add authentication
scripts/load-test.sh                    # Update documentation
scripts/README.md                       # Add auth instructions
.env.test.example                       # Document CLERK_TEST_TOKEN
LOAD_TESTING_IMPLEMENTATION.md          # Update status
app/src/server/routers/**/*.ts          # Potential optimizations
prisma/schema.prisma                    # Add indexes (if needed)
```

---

## Validation Checklist

### Before Starting
- [ ] Read existing documentation (LOAD_TESTING_IMPLEMENTATION.md, PERFORMANCE.md)
- [ ] Understand current test scripts (load-test.js, smoke-test.js)
- [ ] Identify available test environment (production or staging)
- [ ] Confirm access to Clerk dashboard (for test user)

### During Implementation
- [ ] K6 binary installed and verified
- [ ] Smoke test runs successfully (with auth)
- [ ] All 3 new endpoints added to load test
- [ ] Baseline test completed
- [ ] Metrics collected and analyzed
- [ ] Bottlenecks documented
- [ ] Optimizations applied and tested

### After Completion
- [ ] All acceptance criteria met
- [ ] Performance targets achieved
- [ ] Documentation updated
- [ ] Results archived
- [ ] Team trained on running tests
- [ ] CI/CD integration (optional)

---

## Conclusion

This implementation plan builds on existing K6 infrastructure to complete Issue #160. The main work is:

1. **Installing K6 binary** (30 min)
2. **Setting up authentication** (45 min)
3. **Adding missing endpoint tests** (1 hour)
4. **Running baseline test and optimizing** (3-5 hours)

**Total Effort:** 5.5-7.5 hours

**Key Insight:** Infrastructure already exists, we're completing unfinished work and adding missing coverage for issue-specific endpoints (project creation, vendor search, document export).

**Next Step:** Exit plan mode and begin execution with Phase 1.
