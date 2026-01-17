# Implementation Plan: Issue #134 - Monitoring & Alerting (Metrics & Observability)

**Epic Reference:** [003-production-readiness.md](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
**Issue:** #134
**Estimated Time:** 4 hours
**Priority:** MEDIUM-HIGH

## Executive Summary

This plan implements comprehensive monitoring and observability for OpenHorizon using **Google Cloud Monitoring (recommended approach)**. The system is deployed on Google Cloud Run in the `openhorizon-cc` project (region: `europe-west1`), consisting of:

- **Frontend:** Next.js 16 application with tRPC API (`openhorizon-app`)
- **Backend:** Fastify API server (`project-pipeline-backend`)
- **Background Jobs:** Inngest functions for long-running AI tasks
- **Database:** Supabase (PostgreSQL) via Prisma ORM

The implementation will track system metrics (performance), business metrics (usage), and Inngest job metrics (background job health), with automated alerting for anomalies and a Cloud Monitoring dashboard for visualization.

---

## Architecture Overview

### Technology Stack Analysis

**Current Infrastructure:**
- **Cloud Platform:** Google Cloud Run (region: `europe-west1`)
- **Project ID:** `openhorizon-cc`
- **Frontend Framework:** Next.js 16 (App Router)
- **Backend Framework:** Fastify 5.x
- **Background Jobs:** Inngest
- **Database:** Supabase (PostgreSQL) with Prisma ORM
- **Authentication:** Clerk
- **Deployment:** GitHub Actions + Cloud Build (automatic deployment on `main` branch)

**Existing Logging:**
- Fastify: Built-in Pino logger (configured in `app.ts`)
- Next.js: Default Next.js logging
- Cloud Run: Automatic stdout/stderr capture to Cloud Logging

**No Existing Monitoring:**
- ❌ No custom metrics collection
- ❌ No performance tracking middleware
- ❌ No business metrics instrumentation
- ❌ No alerting rules configured
- ❌ No monitoring dashboard

### Recommended Solution: Google Cloud Monitoring + OpenTelemetry

**Why Google Cloud Monitoring:**
1. **Native Integration:** Already deployed on Cloud Run, automatic system metrics available
2. **Zero Infrastructure:** Managed service, no additional servers needed
3. **Free Tier Sufficient:** Under 150 GB of logs/month and standard metrics free
4. **Built-in Features:** Alerting, dashboards, log-based metrics included
5. **OpenTelemetry Support:** Modern, vendor-neutral observability standard

**Alternative Considered (Not Recommended):**
- Self-hosted Grafana + Prometheus: Requires additional infrastructure, more complex setup, operational overhead

---

## Implementation Phases

### Phase 1: System Metrics (Cloud Run Auto-Metrics)
**Effort:** 0.5 hours
**Status:** Mostly automatic, minimal configuration needed

Cloud Run automatically provides:
- `run.googleapis.com/request_count` - Total requests
- `run.googleapis.com/request_latencies` - Response time distribution (p50, p95, p99)
- `run.googleapis.com/container/cpu/utilizations` - CPU usage
- `run.googleapis.com/container/memory/utilizations` - Memory usage
- `run.googleapis.com/container/instance_count` - Autoscaling instances

**Tasks:**
1. ✅ Verify Cloud Run metrics are enabled (enabled by default)
2. Create initial dashboard to visualize system metrics
3. Document how to access metrics in Google Cloud Console

### Phase 2: Custom Application Metrics (OpenTelemetry)
**Effort:** 1.5 hours
**Deliverables:** Performance tracking middleware, custom metric instrumentation

#### 2.1 Install Dependencies

**Frontend (Next.js):**
```bash
npm install --workspace=app \
  @google-cloud/opentelemetry-cloud-monitoring-exporter \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/instrumentation-http \
  @opentelemetry/instrumentation-fetch
```

**Backend (Fastify):**
```bash
cd project-pipeline/backend
npm install \
  @google-cloud/opentelemetry-cloud-monitoring-exporter \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/instrumentation-fastify
```

#### 2.2 Create Monitoring Library

**File:** `app/src/lib/monitoring/metrics.ts`
- Export singleton `MetricsCollector` class
- Methods: `recordRequest()`, `recordError()`, `recordLatency()`
- Initialize OpenTelemetry with Cloud Monitoring exporter
- Create custom metric descriptors:
  - `custom.googleapis.com/http/request_count` (Counter)
  - `custom.googleapis.com/http/error_count` (Counter)
  - `custom.googleapis.com/http/response_time` (Histogram)

**File:** `app/src/lib/monitoring/business-metrics.ts`
- Export `BusinessMetrics` class
- Methods for tracking business events:
  - `recordProjectCreated()`
  - `recordSearchCompleted(searchType: 'food' | 'accommodation')`
  - `recordExportGenerated(format: 'pdf' | 'docx' | 'excel')`
  - `recordUserSignup()`
- Custom metrics:
  - `custom.googleapis.com/business/projects_created` (Counter)
  - `custom.googleapis.com/business/searches_completed` (Counter with labels)
  - `custom.googleapis.com/business/exports_generated` (Counter with labels)

#### 2.3 Create Middleware for Request Tracking

**File:** `app/src/server/middleware/metrics.ts`
- tRPC middleware to track all API requests
- Record: request count, latency, errors
- Attach to tRPC router configuration

**Example Implementation:**
```typescript
import { MetricsCollector } from '@/lib/monitoring/metrics'

export const metricsMiddleware = async (opts: any) => {
  const start = Date.now()
  const { path, type } = opts

  try {
    const result = await opts.next()
    const duration = Date.now() - start

    MetricsCollector.recordRequest(path, type, 'success', duration)
    return result
  } catch (error) {
    const duration = Date.now() - start
    MetricsCollector.recordRequest(path, type, 'error', duration)
    MetricsCollector.recordError(path, error)
    throw error
  }
}
```

**Integration:** Update `app/src/server/trpc.ts` to include metrics middleware in all procedures.

#### 2.4 Backend Metrics (Fastify)

**File:** `project-pipeline/backend/src/lib/monitoring.ts`
- Similar metrics library for Fastify backend
- Export `FastifyMetricsCollector`

**File:** `project-pipeline/backend/src/middleware/metrics.ts`
- Fastify plugin for request tracking
- Hook into `onRequest`, `onResponse`, `onError` lifecycle hooks

**Integration:** Register plugin in `project-pipeline/backend/src/app.ts`:
```typescript
import { metricsPlugin } from './middleware/metrics.js'

await app.register(metricsPlugin)
```

### Phase 3: Inngest Job Metrics
**Effort:** 1 hour
**Deliverables:** Inngest function instrumentation, job success/failure tracking

#### 3.1 Inngest Metrics Library

**File:** `app/src/lib/monitoring/inngest-metrics.ts`
- Export `InngestMetrics` class
- Methods:
  - `recordJobStart(functionId: string)`
  - `recordJobSuccess(functionId: string, durationMs: number)`
  - `recordJobFailure(functionId: string, error: Error, durationMs: number)`
  - `recordJobRetry(functionId: string, attemptNumber: number)`
- Custom metrics:
  - `custom.googleapis.com/inngest/job_count` (Counter with status label)
  - `custom.googleapis.com/inngest/job_duration` (Histogram)
  - `custom.googleapis.com/inngest/job_failures` (Counter)
  - `custom.googleapis.com/inngest/job_retries` (Counter)

#### 3.2 Instrument Inngest Functions

Update all Inngest functions to include metrics:

**Files to modify:**
- `app/src/inngest/functions/generate-project.ts`
- `app/src/inngest/functions/generate-seeds.ts`
- `app/src/inngest/functions/generate-programme.ts`
- `app/src/inngest/functions/food-agent-search.ts`
- `app/src/inngest/functions/accommodation-agent-search.ts`

**Pattern:**
```typescript
import { InngestMetrics } from '@/lib/monitoring/inngest-metrics'

export const generateProjectFromIdea = inngest.createFunction(
  { id: 'project.generate-from-idea', name: 'Generate Project from Idea' },
  { event: 'project.generate-from-idea' },
  async ({ event, step }) => {
    const startTime = Date.now()
    const functionId = 'project.generate-from-idea'

    try {
      InngestMetrics.recordJobStart(functionId)

      // ... existing implementation ...

      const duration = Date.now() - startTime
      InngestMetrics.recordJobSuccess(functionId, duration)

      return project
    } catch (error) {
      const duration = Date.now() - startTime
      InngestMetrics.recordJobFailure(functionId, error, duration)
      throw error
    }
  }
)
```

### Phase 4: Business Metrics Integration
**Effort:** 0.5 hours
**Deliverables:** Event tracking in business logic

#### 4.1 Track Business Events

**Projects Created:**
- **File:** `app/src/inngest/functions/generate-project.ts`
- **Location:** After project save in step 5
- **Code:** `BusinessMetrics.recordProjectCreated(tenantId)`

**Searches Completed:**
- **File:** `app/src/inngest/functions/food-agent-search.ts` (line after search completes)
- **File:** `app/src/inngest/functions/accommodation-agent-search.ts`
- **Code:** `BusinessMetrics.recordSearchCompleted('food')` / `BusinessMetrics.recordSearchCompleted('accommodation')`

**Exports Generated:**
- **File:** `app/src/lib/budget/export.ts` (after PDF/Excel generation)
- **Code:** `BusinessMetrics.recordExportGenerated('pdf')` / `BusinessMetrics.recordExportGenerated('excel')`

**User Signups:**
- **File:** Clerk webhook handler (if exists) or `app/src/server/routers/projects.ts`
- **Code:** `BusinessMetrics.recordUserSignup()`

### Phase 5: Alerting Rules
**Effort:** 0.5 hours
**Deliverables:** Automated alert policies via script

#### 5.1 Create Alert Policies Script

**File:** `scripts/setup-monitoring.sh`

```bash
#!/bin/bash
set -e

PROJECT_ID="openhorizon-cc"
EMAIL="alerts@openhorizon.cc"  # Update with actual alert email

echo "🔔 Setting up Cloud Monitoring Alert Policies for OpenHorizon..."

# 1. Alert: Error Rate > 1%
gcloud alpha monitoring policies create \
  --notification-channels=projects/${PROJECT_ID}/notificationChannels/YOUR_CHANNEL_ID \
  --display-name="High Error Rate (>1%)" \
  --condition-display-name="Error rate exceeds 1%" \
  --condition-threshold-value=0.01 \
  --condition-threshold-duration=300s \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    metric.type=\"run.googleapis.com/request_count\" AND
    metric.label.response_code_class=\"5xx\"
  "

# 2. Alert: P95 Latency > 1s
gcloud alpha monitoring policies create \
  --notification-channels=projects/${PROJECT_ID}/notificationChannels/YOUR_CHANNEL_ID \
  --display-name="High Latency (p95 > 1s)" \
  --condition-display-name="P95 latency exceeds 1 second" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    metric.type=\"run.googleapis.com/request_latencies\" AND
    metric.percentile=95
  "

# 3. Alert: Inngest Job Failure Rate > 10%
gcloud alpha monitoring policies create \
  --notification-channels=projects/${PROJECT_ID}/notificationChannels/YOUR_CHANNEL_ID \
  --display-name="High Inngest Job Failure Rate (>10%)" \
  --condition-display-name="Inngest job failures exceed 10%" \
  --condition-threshold-value=0.10 \
  --condition-threshold-duration=600s \
  --condition-expression="
    resource.type=\"global\" AND
    metric.type=\"custom.googleapis.com/inngest/job_failures\"
  "

# 4. Alert: No Activity for > 1 hour (potential downtime)
gcloud alpha monitoring policies create \
  --notification-channels=projects/${PROJECT_ID}/notificationChannels/YOUR_CHANNEL_ID \
  --display-name="Service Inactive (>1 hour)" \
  --condition-display-name="No requests in the last hour" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=3600s \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    metric.type=\"run.googleapis.com/request_count\"
  " \
  --condition-absent=true

echo "✅ Alert policies created successfully!"
```

**Prerequisites:**
1. Create notification channel first (email/Slack/PagerDuty)
2. Update `YOUR_CHANNEL_ID` in script
3. Make script executable: `chmod +x scripts/setup-monitoring.sh`

#### 5.2 Alert Configuration Summary

| Alert | Condition | Threshold | Duration | Notification |
|-------|-----------|-----------|----------|--------------|
| High Error Rate | 5xx responses / total requests | >1% | 5 minutes | Email |
| High Latency | p95 request latency | >1000ms | 5 minutes | Email |
| Job Failures | Failed Inngest jobs / total jobs | >10% | 10 minutes | Email |
| Service Down | Request count | 0 requests | 1 hour | Email |

### Phase 6: Monitoring Dashboard
**Effort:** 0.5 hours
**Deliverables:** Custom Cloud Monitoring dashboard JSON configuration

#### 6.1 Dashboard Structure

**Dashboard Sections:**
1. **System Health Overview** (top row)
   - Request count (24h)
   - Error rate (%)
   - P95 latency (ms)
   - Service uptime (%)

2. **Performance Metrics** (row 2)
   - Request latency distribution (p50, p90, p95, p99)
   - CPU utilization (%)
   - Memory utilization (%)
   - Active instances

3. **Business Metrics** (row 3)
   - Projects created (counter)
   - Searches completed (counter, by type)
   - Exports generated (counter, by format)
   - Active users (gauge)

4. **Inngest Job Metrics** (row 4)
   - Job completion rate (%)
   - Average job duration (ms)
   - Job failure rate (%)
   - Job retry count

5. **Historical Trends** (row 5)
   - Request count (7 days)
   - Error rate trend (7 days)
   - Project creation trend (30 days)

#### 6.2 Dashboard Creation Script

**File:** `scripts/create-dashboard.sh`

```bash
#!/bin/bash
set -e

PROJECT_ID="openhorizon-cc"
DASHBOARD_FILE="scripts/monitoring-dashboard.json"

echo "📊 Creating Cloud Monitoring Dashboard..."

gcloud monitoring dashboards create --config-from-file=${DASHBOARD_FILE}

echo "✅ Dashboard created successfully!"
echo "🔗 View at: https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}"
```

**File:** `scripts/monitoring-dashboard.json`
*(Full JSON configuration for dashboard - to be created in implementation phase)*

---

## Database Metrics (Supabase)

**Note:** Supabase provides its own built-in monitoring dashboard at `https://supabase.com/dashboard/project/<project-id>/database/query-performance`

**Available Metrics:**
- Active connections
- Query performance (slow query log)
- Table sizes and growth
- Index usage

**Recommendation:** Use Supabase dashboard for database-specific metrics. Optionally, export metrics to Cloud Monitoring via Supabase API if needed (lower priority).

---

## Files to Create/Modify

### New Files

| File Path | Purpose | Lines of Code |
|-----------|---------|---------------|
| `app/src/lib/monitoring/metrics.ts` | Core metrics collection library | ~150 |
| `app/src/lib/monitoring/business-metrics.ts` | Business event tracking | ~100 |
| `app/src/lib/monitoring/inngest-metrics.ts` | Inngest job metrics | ~100 |
| `app/src/server/middleware/metrics.ts` | tRPC metrics middleware | ~80 |
| `project-pipeline/backend/src/lib/monitoring.ts` | Fastify metrics library | ~120 |
| `project-pipeline/backend/src/middleware/metrics.ts` | Fastify metrics plugin | ~100 |
| `scripts/setup-monitoring.sh` | Alert policy creation script | ~100 |
| `scripts/create-dashboard.sh` | Dashboard creation script | ~20 |
| `scripts/monitoring-dashboard.json` | Dashboard configuration | ~500 (JSON) |

**Total New Code:** ~1,270 lines

### Files to Modify

| File Path | Modification | Complexity |
|-----------|--------------|------------|
| `app/package.json` | Add OpenTelemetry dependencies | Low |
| `project-pipeline/backend/package.json` | Add OpenTelemetry dependencies | Low |
| `app/src/server/trpc.ts` | Integrate metrics middleware | Low |
| `project-pipeline/backend/src/app.ts` | Register metrics plugin | Low |
| `app/src/inngest/functions/generate-project.ts` | Add metrics tracking | Medium |
| `app/src/inngest/functions/generate-seeds.ts` | Add metrics tracking | Medium |
| `app/src/inngest/functions/generate-programme.ts` | Add metrics tracking | Medium |
| `app/src/inngest/functions/food-agent-search.ts` | Add metrics tracking | Medium |
| `app/src/inngest/functions/accommodation-agent-search.ts` | Add metrics tracking | Medium |
| `app/src/lib/budget/export.ts` | Add export metrics | Low |
| `app/Dockerfile` | Set GOOGLE_CLOUD_PROJECT env var | Low |
| `project-pipeline/backend/Dockerfile` | Set GOOGLE_CLOUD_PROJECT env var | Low |
| `env-app.yaml` | Add monitoring config vars | Low |
| `README.md` | Add monitoring documentation section | Low |

**Total Modified Files:** 14

---

## Environment Variables

### Add to `env-app.yaml` (Cloud Run)

```yaml
# Existing environment variables...

# Monitoring Configuration
GOOGLE_CLOUD_PROJECT: "openhorizon-cc"
ENABLE_METRICS: "true"
OTEL_SERVICE_NAME: "openhorizon-app"
OTEL_EXPORTER_OTLP_ENDPOINT: "https://cloudmonitoring.googleapis.com"
```

### Add to Local Development (`.env.local`)

```bash
# Monitoring (disabled in development by default)
GOOGLE_CLOUD_PROJECT="openhorizon-cc"
ENABLE_METRICS="false"  # Set to "true" to test metrics locally
OTEL_SERVICE_NAME="openhorizon-app-dev"
```

---

## Testing Plan

### Unit Tests
1. **Metrics Collection:** Verify metrics are recorded correctly
   - Test `MetricsCollector.recordRequest()` increments counters
   - Test `BusinessMetrics.recordProjectCreated()` sends custom metrics
   - Test `InngestMetrics.recordJobFailure()` logs errors

2. **Middleware:** Verify middleware tracks requests/errors
   - Mock tRPC request → verify metrics recorded
   - Simulate error → verify error count incremented

### Integration Tests
1. **End-to-End Metrics Flow:**
   - Create project via API
   - Verify metric appears in Cloud Monitoring (within 1-2 minutes)
   - Check dashboard displays metric

2. **Alert Triggering:**
   - Manually trigger error (e.g., invalid input)
   - Wait 5 minutes → verify alert fires (if threshold exceeded)

### Production Smoke Test (Post-Deployment)
1. Navigate to Cloud Monitoring Dashboard
2. Verify all widgets display data
3. Trigger test alert (manually induce error)
4. Confirm alert notification received via email
5. Verify Inngest job metrics appear after running background job

---

## Deployment Strategy

### Step 1: Development Branch
1. Create branch: `feature/monitoring-observability-issue-134`
2. Implement all code changes
3. Test locally (with `ENABLE_METRICS=true`)
4. Commit changes

### Step 2: Staging Deployment (oh.153.se)
1. Deploy to staging environment
2. Run E2E tests → verify metrics collected
3. Check Cloud Monitoring for test data
4. Validate dashboard displays correctly

### Step 3: Production Deployment
1. Merge to `main` branch
2. GitHub Actions deploys automatically
3. Run `scripts/setup-monitoring.sh` (one-time setup)
4. Run `scripts/create-dashboard.sh` (one-time setup)
5. Monitor deployment via Cloud Logging
6. Verify metrics appear in dashboard within 5 minutes

### Step 4: Post-Deployment Validation
1. Wait 24 hours for historical data
2. Review dashboard for anomalies
3. Test alert notifications
4. Document dashboard URL in team wiki

---

## Success Criteria

✅ **Performance Metrics Tracked:**
- Request count per endpoint (tRPC procedures)
- Request latency (p50, p95, p99) < 500ms for p95
- Error rate tracked and visible
- Response times by endpoint visible

✅ **Business Metrics Tracked:**
- Projects created (count per day/week)
- Searches completed (food, accommodation)
- Documents exported (PDF, DOCX, Excel)
- User signups and active users

✅ **Inngest Job Metrics Tracked:**
- Job completion rate (successful vs. failed)
- Job duration (average, p95)
- Job failure rate (percentage)
- Job retry count
- Queue depth (if available via Inngest API)

✅ **Alerts Configured:**
- Alert fires when error rate > 1% (5 min window)
- Alert fires when p95 latency > 1s (5 min window)
- Alert fires when job failure rate > 10% (10 min window)
- Alert fires when no activity for > 1 hour

✅ **Monitoring Dashboard Accessible:**
- Dashboard displays all metrics sections
- Real-time data visible (< 2 min latency)
- Historical trends displayed (24h, 7d, 30d views)
- Dashboard URL documented and shared with team

✅ **Documentation Complete:**
- README updated with monitoring section
- Dashboard access instructions documented
- Alert response procedures documented (runbook)
- Metrics reference guide created

---

## Risk Mitigation

### Risk 1: Metric Collection Overhead
**Concern:** Recording metrics adds latency to requests
**Mitigation:**
- Use asynchronous metric recording (non-blocking)
- OpenTelemetry batches metrics before export
- Test impact: Add load test comparing latency with/without metrics
- **Expected overhead:** < 5ms per request

### Risk 2: Cost Overruns
**Concern:** Cloud Monitoring costs exceed budget
**Mitigation:**
- Free tier covers: 150 GB logs/month, all standard metrics
- Custom metrics: First 250 time series free, then $0.06/time series/month
- **Estimated cost:** $0-5/month (well within free tier for MVP)
- Set up billing alerts at $10/month threshold

### Risk 3: Alert Fatigue
**Concern:** Too many false-positive alerts
**Mitigation:**
- Conservative thresholds (1% error rate, 1s latency)
- Require sustained condition (5-10 min duration)
- Start with email only, add PagerDuty later
- Review alert history weekly, tune thresholds as needed

### Risk 4: Missing Metrics
**Concern:** Some business events not tracked
**Mitigation:**
- Start with high-value metrics (projects, searches, exports)
- Iteratively add metrics based on stakeholder feedback
- Plan Phase 2 metrics expansion (user engagement, feature usage)

---

## Future Enhancements (Out of Scope for Issue #134)

1. **Distributed Tracing:** OpenTelemetry traces across services (Next.js → Inngest → Fastify)
2. **User Analytics:** Track user journeys, feature adoption, session duration
3. **Performance Profiling:** CPU/memory flame graphs, slow query detection
4. **SLO/SLA Dashboards:** Service Level Objectives (e.g., 99.5% uptime)
5. **Cost Monitoring:** Track Cloud Run costs, storage costs per tenant
6. **A/B Testing Metrics:** Compare feature variants, conversion rates
7. **Security Monitoring:** Failed login attempts, suspicious activity detection

---

## Documentation Updates

### Add to `README.md`

```markdown
## Monitoring & Observability

OpenHorizon uses Google Cloud Monitoring for comprehensive observability.

### Dashboard Access
- **Production Dashboard:** [Cloud Monitoring Dashboard](https://console.cloud.google.com/monitoring/dashboards?project=openhorizon-cc)
- **Alerts:** [Alert Policies](https://console.cloud.google.com/monitoring/alerting?project=openhorizon-cc)

### Key Metrics
- **System:** Request count, latency (p50/p95/p99), error rate, CPU/memory
- **Business:** Projects created, searches completed, exports generated
- **Background Jobs:** Inngest job success/failure rate, duration, retries

### Alert Notifications
Alerts are sent to `alerts@openhorizon.cc` for:
- Error rate > 1% (5 min sustained)
- P95 latency > 1s (5 min sustained)
- Inngest job failure rate > 10% (10 min sustained)
- Service inactive > 1 hour

### Local Development
Metrics are disabled by default. To enable:
```bash
export ENABLE_METRICS=true
export GOOGLE_CLOUD_PROJECT=openhorizon-cc
```

### Troubleshooting
- **Metrics not appearing:** Check Cloud Logging for export errors
- **Alerts not firing:** Verify notification channels configured
- **Dashboard empty:** Wait 2-5 minutes for data propagation
```

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 0.5h | System metrics (auto-configured) |
| **Phase 2** | 1.5h | Custom application metrics (OpenTelemetry) |
| **Phase 3** | 1h | Inngest job metrics |
| **Phase 4** | 0.5h | Business metrics integration |
| **Phase 5** | 0.5h | Alerting rules |
| **Phase 6** | 0.5h | Monitoring dashboard |
| **Testing** | 0.5h | Integration tests, production validation |
| **Total** | **4.5h** | |

---

## Acceptance Checklist

- [ ] OpenTelemetry dependencies installed (frontend & backend)
- [ ] Metrics libraries created (`metrics.ts`, `business-metrics.ts`, `inngest-metrics.ts`)
- [ ] Middleware integrated (tRPC and Fastify)
- [ ] All Inngest functions instrumented
- [ ] Business event tracking added (projects, searches, exports)
- [ ] Alert policies script created and executed
- [ ] Monitoring dashboard created and accessible
- [ ] Environment variables configured (`env-app.yaml`)
- [ ] Documentation updated (`README.md`)
- [ ] Integration tests passing
- [ ] Production smoke test successful (metrics visible within 5 min)
- [ ] Alert notification test successful (email received)
- [ ] Team trained on dashboard usage
- [ ] Runbook created for alert response

---

## References

### Google Cloud Documentation
- [Cloud Monitoring Overview](https://cloud.google.com/monitoring/docs)
- [Custom Metrics with OpenTelemetry](https://cloud.google.com/monitoring/custom-metrics)
- [Node.js Instrumentation](https://cloud.google.com/stackdriver/docs/instrumentation/setup/nodejs)
- [Alert Policies](https://cloud.google.com/monitoring/alerts)
- [Dashboard Configuration](https://cloud.google.com/monitoring/dashboards)

### OpenTelemetry
- [@google-cloud/monitoring](https://www.npmjs.com/package/@google-cloud/monitoring)
- [OpenTelemetry Node.js SDK](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/)

### Related Issues
- Issue #131: Error Tracking Integration (Sentry) - Complements this issue
- Issue #135: Performance/Load Testing - Uses metrics for validation
- Epic #003: Production Readiness - Parent epic

---

**Plan Created:** 2026-01-17
**Last Updated:** 2026-01-17
**Author:** SCAR (AI Agent)
**Status:** Ready for Implementation
