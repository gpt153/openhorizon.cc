# Disaster Recovery Runbook

**Purpose:** Operational procedures for recovering from production failures during critical periods (February 2026 application deadlines)

**Last Updated:** 2026-01-17

**Target Audience:** On-call engineers, operations team, technical leadership

---

## 📞 Emergency Contact Information

**Primary On-Call:** [TBD - Insert contact]
**Secondary On-Call:** [TBD - Insert contact]
**Technical Leadership:** [TBD - Insert contact]

**Emergency Response Protocol:**
1. Assess severity and impact
2. Notify stakeholders if user-facing
3. Follow relevant recovery procedure
4. Document actions in postmortem template
5. Implement preventive measures

**Severity Levels:**
- **P0 (Critical):** Complete service outage, all users affected → Response time: Immediate
- **P1 (High):** Major functionality broken, many users affected → Response time: 1 hour
- **P2 (Medium):** Partial functionality degraded, some users affected → Response time: 4 hours
- **P3 (Low):** Minor issues, workarounds available → Response time: Next business day

---

## 🔍 Monitoring & Diagnostics

### Service URLs

**Production Services:**
- Landing Page: https://openhorizon.cc
- Application: https://app.openhorizon.cc
- Pipeline Backend: https://openhorizon-pipeline-l626gw63na-ew.a.run.app
- Pipeline Frontend: https://openhorizon-pipeline-frontend-l626gw63na-ew.a.run.app

### Access Monitoring Dashboards

**Google Cloud Console**
- Project: `open-horizon-prod`
- Console: https://console.cloud.google.com/
- Region: `europe-west1`

**Cloud Run Services:**
```
https://console.cloud.google.com/run?project=open-horizon-prod
```

**Cloud Run Logs:**
```bash
# Landing page logs
gcloud run services logs read openhorizon-landing \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=100

# Application logs
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=100

# Pipeline backend logs
gcloud run services logs read openhorizon-pipeline \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=100

# Pipeline frontend logs
gcloud run services logs read openhorizon-pipeline-frontend \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=100
```

**Cloud Monitoring (Metrics & Alerts):**
```
https://console.cloud.google.com/monitoring?project=open-horizon-prod
```

Key Metrics to Watch:
- Request count (requests/second)
- Error rate (5xx responses)
- Request latency (p50, p95, p99)
- Container CPU utilization
- Container memory utilization
- Container instance count

**Supabase Dashboard:**
```
https://app.supabase.com/project/jnwlzawkfqcxdtkhwokd
```

Access Required:
- Supabase account with project access
- Database credentials from `.env.production`

Key Sections:
- **Database:** Connection pooling, active queries, slow queries
- **Auth:** Active users, authentication attempts
- **Logs:** Database queries, errors, performance
- **Backups:** Automated daily backups (7-day retention)

**Sentry (Error Tracking):**
```
[TBD - Sentry not currently configured]
```

To Set Up:
```bash
npm install @sentry/nextjs
# Configure in next.config.ts
# Add SENTRY_DSN to environment variables
```

**Inngest (Background Jobs):**
```
[TBD - Inngest dashboard URL]
```

Access: Via Inngest account configured in environment variables

Key Sections:
- **Functions:** List of all background jobs
- **Runs:** Recent job executions
- **Events:** Job triggers and event history
- **Errors:** Failed jobs and error details

### Health Check Endpoints

**Quick Health Check:**
```bash
# Landing page
curl -I https://openhorizon.cc

# Application
curl -I https://app.openhorizon.cc

# Pipeline backend
curl https://openhorizon-pipeline-l626gw63na-ew.a.run.app/health

# Expected response: HTTP 200 OK with body: {"status":"ok"}
```

**Detailed Service Status:**
```bash
# Check all Cloud Run services
gcloud run services list \
  --region=europe-west1 \
  --project=open-horizon-prod

# Expected: All services show STATUS: Ready
```

---

## 🚨 Common Failure Scenarios

### Scenario 1: Database Connection Failures

**Severity:** P0 (Critical)

**Detection:**
- Errors in Cloud Run logs: "Connection refused", "ECONNREFUSED", "Connection timeout"
- Sentry alerts: Database connection errors (if configured)
- API endpoints returning 500 errors
- Users unable to load any pages requiring database access

**Symptoms:**
```
Error: P1001: Can't reach database server
Error: Connection pool timeout
Error: SSL connection error
```

**Diagnosis Steps:**

1. **Check Supabase Status:**
```bash
# Visit Supabase status page
# https://status.supabase.com

# Check if project is responsive
curl -I https://jnwlzawkfqcxdtkhwokd.supabase.co/rest/v1/
```

2. **Verify Connection String:**
```bash
# Check environment variables
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --format="value(spec.template.spec.containers[0].env)"

# Verify DATABASE_URL is correct
```

3. **Check Connection Pool:**
```sql
-- Connect to database via psql
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';

-- Check max connections
SHOW max_connections;
```

4. **Review Recent Changes:**
```bash
# Check recent deployments
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1 \
  --limit=5
```

**Recovery Steps:**

**If Supabase is down:**
```
1. Wait for Supabase service restoration
2. Monitor status page: https://status.supabase.com
3. Once restored, verify connection with health check
4. No action needed - Cloud Run will auto-retry
```

**If connection string is incorrect:**
```bash
# Update environment variable
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --update-env-vars DATABASE_URL="<correct-url>"

# Verify deployment
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(status.url)"
```

**If max connections exceeded:**
```sql
-- Identify long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Kill problematic connections (use carefully!)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = <problematic_pid>;
```

```bash
# Scale up database tier in Supabase dashboard
# Or optimize connection pooling in Prisma:
# Edit app/src/lib/prisma.ts - increase pool size
```

**If migration issue:**
```bash
# Rollback to previous service revision
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=<previous-revision>=100

# Or rollback database migration
cd app
npx prisma migrate resolve --rolled-back <migration-name>
```

**Verification:**
```bash
# Test database connection
curl https://app.openhorizon.cc/api/health

# Check error rate in logs
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=50 | grep -i "error\|exception"

# Should see no database errors
```

**Prevention:**
- Use connection pooling (Prisma default: 10 connections)
- Monitor connection count: alert if >80% of max
- Test migrations on staging first
- Set up automated health checks
- Configure Prisma connection timeout: `connect_timeout=10`

---

### Scenario 2: Cloud Run Service Unavailable

**Severity:** P0 (Critical)

**Detection:**
- HTTP 503 Service Unavailable errors
- "Error: Server Error" messages to users
- All endpoints returning errors
- Cloud Run service status shows "Failed" or "Unknown"

**Symptoms:**
```
503 Service Unavailable
Error: Service temporarily unavailable
Cloud Run: Service failed to start
```

**Diagnosis Steps:**

1. **Check Service Status:**
```bash
# Check service health
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --format="value(status.conditions)"

# Look for: type: Ready, status: False
```

2. **Check Recent Deployments:**
```bash
# List recent revisions
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1 \
  --limit=10

# Check revision status
gcloud run revisions describe <revision-name> \
  --region=europe-west1 \
  --format="value(status.conditions)"
```

3. **Check Container Logs:**
```bash
# View startup logs
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=100

# Look for:
# - Port binding errors
# - Dependency failures
# - Configuration errors
# - Container crashes
```

4. **Check Resource Limits:**
```bash
# Check memory/CPU usage
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].resources)"
```

**Recovery Steps:**

**If recent deployment caused failure:**
```bash
# Rollback to previous working revision
# First, identify last working revision
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1

# Rollback to that revision
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=<working-revision>=100

# Example:
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=openhorizon-app-00042-abc=100
```

**If container is crashing:**
```bash
# Check for common issues in logs:
# - Missing environment variables
# - Database connection failures
# - Port binding issues

# Redeploy with fixes
cd app
gcloud builds submit --config=../cloudbuild-app.yaml

# Or update environment variables
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --update-env-vars KEY=VALUE
```

**If resource limits exceeded:**
```bash
# Increase memory limit (default: 512Mi)
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --memory=1Gi

# Increase CPU (default: 1)
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --cpu=2

# Increase timeout (default: 300s)
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --timeout=600
```

**If all else fails - force redeploy:**
```bash
# Force new deployment from current main branch
cd app
gcloud builds submit --config=../cloudbuild-app.yaml \
  --project=open-horizon-prod
```

**Verification:**
```bash
# Test service endpoint
curl -I https://app.openhorizon.cc

# Should return: HTTP 200 OK or 302 redirect

# Check service status
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(status.url,status.conditions)"

# Monitor logs for errors
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=50 --tail
```

**Prevention:**
- Always test deployments on staging first
- Use gradual rollouts (traffic splitting)
- Set up automated health checks
- Configure CPU and memory alerts
- Document rollback procedures
- Keep last 5 known-good revisions

---

### Scenario 3: API Timeout / Slow Responses

**Severity:** P1 (High)

**Detection:**
- API endpoints taking >10 seconds to respond
- Users reporting "loading forever"
- Timeout errors in logs
- Increased p95/p99 latency in monitoring

**Symptoms:**
```
Error: Request timeout after 30000ms
504 Gateway Timeout
Slow page loads (>10 seconds)
```

**Diagnosis Steps:**

1. **Check Response Times:**
```bash
# Test key endpoints
time curl https://app.openhorizon.cc/api/health
time curl https://app.openhorizon.cc/api/projects

# Should respond in <1 second
```

2. **Check Database Performance:**
```sql
-- Connect to database
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

-- Identify slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check active queries
SELECT pid, now() - query_start AS duration, state, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

3. **Check Cloud Run Metrics:**
```bash
# View metrics in Cloud Console
# https://console.cloud.google.com/run/detail/europe-west1/openhorizon-app/metrics

# Or use gcloud
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --project=open-horizon-prod
```

4. **Check External API Dependencies:**
```bash
# Test OpenAI API
curl -I https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Clerk API
curl -I https://api.clerk.dev/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
```

**Recovery Steps:**

**If database queries are slow:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY idx_seeds_created_at ON seeds(created_at DESC);

-- Analyze tables
ANALYZE projects;
ANALYZE seeds;

-- Vacuum if needed
VACUUM ANALYZE;
```

**If Cloud Run is underprovisioned:**
```bash
# Increase max instances
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --max-instances=10 \
  --min-instances=1

# Increase CPU/memory
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --cpu=2 \
  --memory=2Gi
```

**If external API is slow:**
```bash
# Check API status pages
# OpenAI: https://status.openai.com
# Clerk: https://status.clerk.com

# Implement timeout handling in code
# (requires code change and deployment)
```

**If code optimization needed:**
```bash
# Review recent changes for N+1 queries
# Add Prisma query logging:
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --update-env-vars LOG_LEVEL=debug

# Review logs for query patterns
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=200 | grep "prisma:query"
```

**Verification:**
```bash
# Test response times
time curl https://app.openhorizon.cc/api/projects

# Monitor latency
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=50 | grep "latency"
```

**Prevention:**
- Add database indexes on frequently queried columns
- Implement response caching for static data
- Set API timeout limits (30s max)
- Monitor p95/p99 latency metrics
- Use database connection pooling
- Implement request queuing for AI endpoints

---

### Scenario 4: Inngest Background Jobs Stuck/Failing

**Severity:** P2 (Medium) - unless affecting user-visible features

**Detection:**
- Jobs not completing after 1+ hour
- Queue depth increasing
- Error messages in Inngest dashboard
- Users reporting features not working (e.g., project generation)

**Symptoms:**
```
Inngest function timeout
Job stuck in "Running" state
Queue depth: 100+ pending jobs
Error: Function execution failed
```

**Diagnosis Steps:**

1. **Access Inngest Dashboard:**
```bash
# Navigate to Inngest dashboard
# URL: [Insert Inngest dashboard URL]

# Check:
# - Recent function runs
# - Error rates
# - Queue depth
# - Failed jobs
```

2. **Check Inngest Configuration:**
```bash
# Verify Inngest environment variables
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].env)" | grep INNGEST
```

3. **Check Job Logs:**
```bash
# Search logs for Inngest errors
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=200 | grep -i "inngest"
```

4. **Test Inngest Endpoint:**
```bash
# Verify Inngest webhook endpoint
curl -I https://app.openhorizon.cc/api/inngest
```

**Recovery Steps:**

**If jobs are stuck:**
```
Via Inngest Dashboard:
1. Navigate to "Functions" → Select stuck function
2. Click "Runs" → Find stuck job
3. Click "Cancel" on stuck job
4. Click "Retry" to restart failed jobs
```

**If job failures are due to code errors:**
```bash
# Review error in Inngest dashboard
# Fix code issue
# Deploy fix
cd app
gcloud builds submit --config=../cloudbuild-app.yaml

# Retry failed jobs via Inngest dashboard
```

**If Inngest configuration is wrong:**
```bash
# Update Inngest environment variables
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --update-env-vars \
    INNGEST_EVENT_KEY="<correct-key>",\
    INNGEST_SIGNING_KEY="<correct-key>"
```

**If jobs are timing out:**
```
Via Code (requires deployment):
1. Edit inngest function timeout configuration
2. Increase timeout from default (5 minutes) to higher value
3. Deploy updated code
```

**Manual job trigger (for testing):**
```bash
# Trigger job manually via API
curl -X POST https://app.openhorizon.cc/api/inngest/trigger \
  -H "Content-Type: application/json" \
  -d '{"event":"seed/generate","data":{"seedId":"..."}}'
```

**Verification:**
```
1. Check Inngest dashboard - jobs completing successfully
2. Monitor queue depth - should decrease
3. Test user-facing feature - should work
4. Check error rate - should be <1%
```

**Prevention:**
- Set appropriate job timeouts (based on expected duration)
- Implement job retry logic with exponential backoff
- Add job monitoring and alerts
- Log all job inputs and outputs for debugging
- Implement idempotency (jobs can be safely retried)
- Add job heartbeat/progress tracking

---

### Scenario 5: Clerk Authentication Service Down

**Severity:** P0 (Critical) - users cannot sign in

**Detection:**
- Sign-in/sign-up pages not loading
- "Service unavailable" errors on auth pages
- Clerk status page shows incidents
- All authentication requests failing

**Symptoms:**
```
Error: Unable to contact Clerk API
Auth pages showing error message
Users stuck at login screen
```

**Diagnosis Steps:**

1. **Check Clerk Status:**
```bash
# Visit Clerk status page
# https://status.clerk.com
```

2. **Test Clerk API:**
```bash
# Test Clerk API directly
curl -I https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
```

3. **Verify Clerk Configuration:**
```bash
# Check environment variables
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].env)" | grep CLERK

# Verify:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
```

4. **Check Domain Configuration:**
```
Visit Clerk Dashboard:
https://dashboard.clerk.com

Check:
- Allowed domains include "app.openhorizon.cc"
- API keys are active (not revoked)
- Rate limits not exceeded
```

**Recovery Steps:**

**If Clerk service is down (external issue):**
```
1. Monitor Clerk status page for updates
2. Communicate to users (via social media, status page)
3. Wait for Clerk service restoration
4. No action needed on our side
5. Verify auth works after restoration
```

**If Clerk configuration is incorrect:**
```bash
# Update Clerk environment variables
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --update-env-vars \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<correct-key>",\
    CLERK_SECRET_KEY="<correct-key>"
```

**If domain not allowed:**
```
Via Clerk Dashboard:
1. Navigate to "Domains"
2. Add "app.openhorizon.cc" to allowed domains
3. Save changes
4. Wait 1-2 minutes for propagation
```

**If rate limit exceeded:**
```
Via Clerk Dashboard:
1. Check current usage in "Usage" section
2. Upgrade plan if needed
3. Or wait for rate limit reset (typically hourly)
```

**Temporary workaround (if extended outage):**
```
NOT RECOMMENDED - only in extreme emergency:
1. Implement temporary bypass (read-only mode)
2. Requires code changes
3. Deploy bypass version
4. Communicate limitations to users
5. Revert when Clerk is restored
```

**Verification:**
```bash
# Test sign-in page
curl -I https://app.openhorizon.cc/sign-in

# Should return: HTTP 200 OK

# Test authentication flow manually in browser
# 1. Visit https://app.openhorizon.cc
# 2. Click "Sign In"
# 3. Enter credentials
# 4. Should successfully authenticate
```

**Prevention:**
- Monitor Clerk status page proactively
- Set up Clerk webhook alerts
- Consider implementing authentication fallback (complex)
- Document manual user creation procedure (emergency)
- Keep Clerk API keys rotated and secure

---

### Scenario 6: Out of Memory / Container Crashes

**Severity:** P1 (High)

**Detection:**
- Cloud Run instances crashing frequently
- "Out of memory" errors in logs
- Service restarts frequently
- HTTP 503 errors during high load

**Symptoms:**
```
Error: JavaScript heap out of memory
Container terminated: OOMKilled
Cloud Run: Instance crashed
```

**Diagnosis Steps:**

1. **Check Container Memory:**
```bash
# View memory configuration
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].resources.limits.memory)"
```

2. **Check Memory Usage Metrics:**
```bash
# View memory metrics in Cloud Console
# https://console.cloud.google.com/run/detail/europe-west1/openhorizon-app/metrics

# Look for:
# - Memory utilization near 100%
# - Frequent container restarts
# - OOMKilled events
```

3. **Review Recent Logs:**
```bash
# Search for memory errors
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=200 | grep -i "memory\|oom\|heap"
```

4. **Identify Memory Leak:**
```bash
# Check for patterns before crashes:
# - Large data processing
# - Unclosed database connections
# - Large file uploads
# - Memory-intensive AI operations
```

**Recovery Steps:**

**Immediate fix - increase memory:**
```bash
# Increase memory limit
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --memory=2Gi

# Or even higher if needed
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --memory=4Gi
```

**If specific endpoint causes issue:**
```bash
# Increase Node.js heap size (requires code change)
# In package.json or Dockerfile:
NODE_OPTIONS="--max-old-space-size=4096"

# Then redeploy
cd app
gcloud builds submit --config=../cloudbuild-app.yaml
```

**If memory leak in code:**
```bash
# Identify leak source from logs
# Common causes:
# - Unclosed database connections → Fix Prisma client usage
# - Large AI responses → Implement streaming/chunking
# - File upload handling → Use streaming uploads
# - Caching without limits → Implement cache eviction

# Deploy fix once identified
cd app
gcloud builds submit --config=../cloudbuild-app.yaml
```

**Emergency restart:**
```bash
# Force new deployment (restarts all instances)
gcloud run services update openhorizon-app \
  --region=europe-west1 \
  --update-env-vars RESTART_TIMESTAMP=$(date +%s)
```

**Verification:**
```bash
# Monitor memory usage
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=50 --tail

# Check for stability (no crashes for 30 minutes)

# Test memory-intensive operations
# - Generate project from seed
# - Run AI agents
# - Upload files
```

**Prevention:**
- Set memory limits based on actual usage (+50% buffer)
- Implement proper connection pooling
- Use streaming for large responses
- Add memory usage monitoring/alerts
- Profile memory usage in staging
- Implement request size limits
- Use pagination for large data sets

---

## 🔄 Backup & Restore Procedures

### Automated Backups (Supabase)

**Backup Schedule:**
- **Frequency:** Daily at 03:00 UTC
- **Retention:** 7 days (rolling)
- **Location:** Supabase managed backups
- **Scope:** Full database (all schemas)

**Access Backups:**
```
1. Navigate to Supabase Dashboard
   https://app.supabase.com/project/jnwlzawkfqcxdtkhwokd

2. Click "Database" → "Backups" in left sidebar

3. View list of available backups with:
   - Backup timestamp
   - Backup size
   - Status (completed/failed)
```

### How to Restore Backup

**⚠️ WARNING:** Restoring a backup will OVERWRITE current database. Always test on staging first.

#### Step 1: Identify Correct Backup

**List available backups:**
```
Via Supabase Dashboard:
1. Navigate to Database → Backups
2. Review backup list sorted by date
3. Identify backup timestamp closest to desired restore point
4. Note backup ID/timestamp
```

**Considerations:**
- **Time of incident:** Choose backup from BEFORE the incident
- **Data loss window:** Understand data created between backup and now will be lost
- **Backup completeness:** Verify backup shows "Completed" status
- **Backup size:** Verify size is reasonable (not empty or corrupted)

#### Step 2: Verify Backup Integrity

**Check backup details:**
```
Via Supabase Dashboard:
1. Click backup to view details
2. Verify:
   - Status: Completed
   - Size: >0 MB (typically 10-100MB for this project)
   - Timestamp: Correct date/time
   - Tables: All schemas included
```

**Optional - Download backup for inspection:**
```bash
# Supabase allows backup download via dashboard
# Download to local machine
# Inspect with: pg_restore --list backup.dump
```

#### Step 3: Test Restore on Staging (CRITICAL)

**⚠️ NEVER restore directly to production without testing!**

```
If staging database exists:
1. Restore backup to staging database
2. Test critical functionality:
   - User authentication
   - Project creation
   - Seed generation
   - AI agents
3. Verify data integrity
4. Only proceed to production if staging test passes
```

#### Step 4: Restore Backup to Production

**Via Supabase Dashboard (Recommended):**
```
1. Navigate to Database → Backups
2. Click backup to restore
3. Click "Restore" button
4. CONFIRM: You understand this will overwrite current data
5. Wait for restore completion (5-30 minutes)
6. Verify restore status shows "Completed"
```

**Via psql (Manual Method - Advanced):**
```bash
# Download backup from Supabase
# (Download link in backup details)

# Connect to database
export DATABASE_URL="postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# WARNING: This drops all existing data!
# Drop database
psql $DATABASE_URL -c "DROP SCHEMA pipeline CASCADE;"

# Restore from backup
pg_restore -d $DATABASE_URL --clean --if-exists backup.dump

# Apply any pending migrations
cd app
npx prisma migrate deploy
```

#### Step 5: Verify Restoration

**Database verification:**
```bash
# Connect to database
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Check table counts
SELECT
  'User' AS table_name, COUNT(*) AS count FROM pipeline."User"
UNION ALL
SELECT 'Organisation', COUNT(*) FROM pipeline."Organisation"
UNION ALL
SELECT 'Project', COUNT(*) FROM pipeline."Project"
UNION ALL
SELECT 'Seed', COUNT(*) FROM pipeline."Seed";

# Verify recent data
SELECT id, email, "createdAt" FROM pipeline."User" ORDER BY "createdAt" DESC LIMIT 10;
```

**Application verification:**
```bash
# Test health check
curl https://app.openhorizon.cc/api/health

# Test authentication
# 1. Sign in with test account
# 2. Verify dashboard loads
# 3. Verify projects visible

# Test critical features
# 1. Create new seed
# 2. Generate project
# 3. View existing projects
```

**Smoke tests:**
```
Manual testing checklist:
□ Users can sign in
□ Dashboard loads correctly
□ Projects are visible
□ Seeds are visible
□ Create new seed works
□ AI agents respond
□ Project generation works
□ No console errors
□ No 500 errors in logs
```

#### Step 6: Rollback Failed Restore

**If restore fails or causes issues:**

```bash
# Option 1: Restore previous backup (one day older)
# Via Supabase Dashboard → Backups → Select older backup → Restore

# Option 2: Restore from Cloud Run backup (if available)
# Check if Cloud Run had a database snapshot:
gcloud sql backups list --instance=<instance-name> --project=open-horizon-prod

# Option 3: Rollback Cloud Run service to before restore
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=<previous-working-revision>=100
```

### Manual Backup (Before Major Changes)

**Create manual backup before risky operations:**

```bash
# Using pg_dump
export DATABASE_URL="postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Create backup file
pg_dump $DATABASE_URL \
  --schema=pipeline \
  --format=custom \
  --file=backup-$(date +%Y%m%d-%H%M%S).dump

# Verify backup created
ls -lh backup-*.dump

# Store backup safely
# - Upload to Google Cloud Storage
# - Or store locally in secure location
```

**Restore manual backup:**
```bash
# Restore from file
pg_restore -d $DATABASE_URL --clean --if-exists backup-YYYYMMDD-HHMMSS.dump
```

### Point-in-Time Recovery (PITR)

**Supabase Pro plan supports PITR:**
- Restore to any point in last 7 days
- Granularity: Per-second
- Useful for recovering from accidental deletions

**To use PITR (if Pro plan active):**
```
Via Supabase Dashboard:
1. Navigate to Database → Backups
2. Click "Point in time recovery"
3. Select exact timestamp
4. Restore to that point
```

---

## 🚀 Deployment & Rollback

### Standard Deployment

**Automated deployment via Cloud Build:**
```bash
# Push to main branch triggers automatic deployment
git push origin main

# Monitor deployment
gcloud builds list --limit=5 --project=open-horizon-prod
```

**Manual deployment:**
```bash
# Deploy application
cd app
gcloud builds submit --config=../cloudbuild-app.yaml \
  --project=open-horizon-prod

# Deploy landing page
cd landing
gcloud builds submit --config=../cloudbuild-landing.yaml \
  --project=open-horizon-prod

# Deploy pipeline backend
cd project-pipeline
gcloud builds submit --config=../cloudbuild-pipeline.yaml \
  --project=open-horizon-prod
```

### Rollback to Previous Version

**Quick rollback (traffic split):**
```bash
# List recent revisions
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=10

# Identify last working revision (e.g., openhorizon-app-00042-xyz)

# Rollback traffic to that revision
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=openhorizon-app-00042-xyz=100 \
  --project=open-horizon-prod
```

**Gradual rollout (canary deployment):**
```bash
# Split traffic between old and new versions
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=openhorizon-app-00043-new=10,openhorizon-app-00042-old=90

# Monitor metrics for errors

# If stable, increase to 50/50
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=openhorizon-app-00043-new=50,openhorizon-app-00042-old=50

# If stable, route 100% to new
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=openhorizon-app-00043-new=100
```

### Verify Deployment Success

**Health checks:**
```bash
# Application health
curl https://app.openhorizon.cc/api/health

# Pipeline backend health
curl https://openhorizon-pipeline-l626gw63na-ew.a.run.app/health

# Landing page
curl -I https://openhorizon.cc
```

**Smoke tests:**
```bash
# Test critical endpoints
curl https://app.openhorizon.cc/sign-in
curl https://app.openhorizon.cc/api/projects
curl https://openhorizon-pipeline-l626gw63na-ew.a.run.app/seeds
```

**Monitor logs after deployment:**
```bash
# Watch logs for errors
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=100 --tail

# Should see:
# - No 5xx errors
# - Successful requests
# - Normal latency
```

### Post-Deployment Validation

**Automated Smoke Tests** run automatically after every production deployment via GitHub Actions. These tests verify:

1. **Service Reachability** - Homepage loads (HTTP 200, <2s)
2. **Authentication** - Clerk integration working
3. **Authorization** - Protected routes require auth
4. **Database** - PostgreSQL connection healthy
5. **Background Jobs** - Inngest webhook responds

**Manual Smoke Test Execution:**

If you need to manually validate a deployment:

```bash
npm run smoke-test:prod
```

**Expected Output (Success):**
```
🔍 Running smoke tests against: https://app.openhorizon.cc

✅ Homepage Load (427ms)
✅ Authentication Endpoints (64ms)
✅ Protected Route Authorization (58ms)
✅ Database Health Check (205ms)
✅ Inngest Webhook (80ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL CHECKS PASSED (0.83s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Interpreting Results:**

✅ **All Checks Pass:**
```
✅ ALL CHECKS PASSED (1.34s)
```
→ Deployment is healthy, no action needed

❌ **Some Checks Fail:**
```
❌ 2 of 5 checks FAILED
```
→ Review error messages, check logs, consider rollback

**Troubleshooting Guide:**

| Failed Check | Possible Cause | Resolution |
|-------------|---------------|------------|
| Homepage Load | Cloud Run not responding | Check Cloud Run console, verify deployment |
| Authentication Endpoints | Clerk integration issue | Verify `CLERK_SECRET_KEY` env var |
| Protected Route Authorization | Auth middleware broken | Check middleware in app |
| Database Health Check | PostgreSQL connection down | Verify `DATABASE_URL`, check Cloud SQL |
| Inngest Webhook | Inngest config issue | Verify `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |

**Manual Rollback Procedure:**

If smoke tests fail and you need to rollback:

```bash
# List recent revisions
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1 \
  --limit=5

# Rollback to previous revision
gcloud run services update-traffic openhorizon-app \
  --region=europe-west1 \
  --to-revisions=<PREVIOUS_REVISION>=100

# Verify rollback with smoke tests
npm run smoke-test:prod
```

### Post-Deployment Monitoring

**Monitor for 30 minutes after deployment:**
```bash
# Check error rate
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --limit=200 | grep -i "error" | wc -l

# Should be minimal (<5 errors)

# Check response times
# Via Cloud Console metrics dashboard
```

---

## 📝 Postmortem Template

**Use this template after every incident:**

### Incident Summary

**Date:** [YYYY-MM-DD]
**Duration:** [Start time - End time] (total: XX hours)
**Severity:** [P0/P1/P2/P3]
**Responders:** [Names of people involved]

### What Happened

**Timeline:**
```
HH:MM - [First detection / user report]
HH:MM - [Initial diagnosis started]
HH:MM - [Root cause identified]
HH:MM - [Fix applied]
HH:MM - [Service restored]
HH:MM - [Incident closed]
```

**Impact:**
- **Users affected:** [Number or "All users"]
- **Features impacted:** [List of features]
- **Data loss:** [Yes/No - describe if yes]
- **Duration:** [Total downtime]

### Root Cause

**What caused the incident:**
[Detailed description of root cause]

**Why it wasn't detected earlier:**
[Gaps in monitoring, alerts, testing]

### Resolution

**What fixed the issue:**
[Steps taken to resolve]

**Who was involved:**
[Team members, their roles]

### What Went Well

- ✅ [Things that helped resolve quickly]
- ✅ [Effective procedures followed]
- ✅ [Good decisions made]

### What Could Be Improved

- ⚠️ [Things that slowed resolution]
- ⚠️ [Gaps in procedures]
- ⚠️ [Better approaches identified]

### Action Items

**Prevent recurrence:**
- [ ] [Action item 1] - Owner: [Name] - Due: [Date]
- [ ] [Action item 2] - Owner: [Name] - Due: [Date]

**Improve detection:**
- [ ] [Monitoring improvement] - Owner: [Name] - Due: [Date]
- [ ] [Alert improvement] - Owner: [Name] - Due: [Date]

**Improve response:**
- [ ] [Runbook update] - Owner: [Name] - Due: [Date]
- [ ] [Training needed] - Owner: [Name] - Due: [Date]

### Lessons Learned

[Key takeaways from this incident]

---

## 🔐 Access & Credentials

### Google Cloud Access

**Required Roles:**
- Cloud Run Admin (for service management)
- Cloud Build Admin (for deployments)
- Logs Viewer (for log access)
- Monitoring Viewer (for metrics)

**Login:**
```bash
gcloud auth login
gcloud config set project open-horizon-prod
```

### Supabase Access

**Dashboard:** https://app.supabase.com/project/jnwlzawkfqcxdtkhwokd

**Database Connection:**
```bash
# Production (pooler)
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

# Direct connection (for admin tasks)
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

**Credentials Location:**
- Stored in `.env.production` file (repo root)
- Also in Google Cloud Run environment variables

### API Keys

**OpenAI API:**
- Dashboard: https://platform.openai.com/api-keys
- Stored in: Cloud Run environment variables

**Clerk API:**
- Dashboard: https://dashboard.clerk.com
- Publishable key: In environment variables (public)
- Secret key: In environment variables (private)

**⚠️ Security Note:**
- Never commit API keys to git
- Rotate keys if exposed
- Use Google Cloud Secret Manager for production

---

## 📞 Escalation Procedures

### When to Escalate

**Escalate immediately if:**
- Complete service outage >1 hour
- Data breach or security incident
- Cannot resolve with documented procedures
- Multiple systems failing simultaneously
- External dependency down with no ETA

### Escalation Path

**Level 1: On-Call Engineer**
- Try documented recovery procedures
- Maximum resolution time: 2 hours

**Level 2: Technical Lead**
- Escalate if Level 1 cannot resolve
- Decision authority for major changes
- Maximum resolution time: 4 hours

**Level 3: CTO / Technical Leadership**
- Escalate for business-critical decisions
- Authority for emergency expenditures
- Communication with stakeholders

### External Support

**Google Cloud Support:**
- Support console: https://console.cloud.google.com/support
- Available: 24/7 for production issues
- Phone: [TBD - Add Google Cloud support number]

**Supabase Support:**
- Email: support@supabase.com
- Dashboard: In-app support chat
- Community: https://github.com/supabase/supabase/discussions

**Clerk Support:**
- Email: support@clerk.com
- Dashboard: In-app support chat
- Emergency: For Pro plans

---

## 🎯 Quick Reference Commands

### Essential Commands

**Check service status:**
```bash
gcloud run services list --region=europe-west1 --project=open-horizon-prod
```

**View recent logs:**
```bash
gcloud run services logs read openhorizon-app --region=europe-west1 --limit=50
```

**Rollback deployment:**
```bash
gcloud run services update-traffic openhorizon-app --region=europe-west1 --to-revisions=<revision-name>=100
```

**Update environment variable:**
```bash
gcloud run services update openhorizon-app --region=europe-west1 --update-env-vars KEY=VALUE
```

**Restart service:**
```bash
gcloud run services update openhorizon-app --region=europe-west1 --update-env-vars RESTART=$(date +%s)
```

**Connect to database:**
```bash
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

---

## 📚 Additional Resources

**Documentation:**
- Architecture: `/ARCHITECTURE.md`
- Deployment: `/DEPLOY_INSTRUCTIONS.md`
- README: `/README.md`

**Monitoring Dashboards:**
- Cloud Run: https://console.cloud.google.com/run?project=open-horizon-prod
- Supabase: https://app.supabase.com/project/jnwlzawkfqcxdtkhwokd

**Status Pages:**
- Google Cloud: https://status.cloud.google.com
- Supabase: https://status.supabase.com
- Clerk: https://status.clerk.com
- OpenAI: https://status.openai.com

**Support Channels:**
- Internal: [TBD - Slack channel, email list]
- External: See escalation procedures above

---

**Last Updated:** 2026-01-17
**Next Review:** 2026-02-17 (monthly review recommended)
**Maintained By:** DevOps / Operations Team

**Version History:**
- v1.0 (2026-01-17) - Initial runbook created for Epic 003 Production Readiness
