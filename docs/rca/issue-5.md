# Root Cause Analysis: GitHub Issue #5

## Issue Summary

- **GitHub Issue ID**: #5
- **Issue URL**: https://github.com/gpt153/openhorizon.cc/issues/5
- **Title**: seed generation error
- **Reporter**: gpt153
- **Severity**: Critical
- **Status**: OPEN

## Problem Description

The Brainstorming Playground feature is deployed and accessible at app.openhorizon.cc, but seed generation fails when users click the "Generate Seeds" button. The application shows "Starting seed generation..." briefly, then immediately displays a red error message: "Failed to generate seeds. Please try again."

**Expected Behavior:**
1. User enters a prompt and adjusts settings
2. Clicks "Generate Seeds" button
3. Background job is triggered via Inngest
4. Seeds are generated using OpenAI GPT-4
5. User sees loading screen for 15-30 seconds
6. Seeds are displayed when generation completes

**Actual Behavior:**
1. User enters a prompt and adjusts settings
2. Clicks "Generate Seeds" button
3. Brief "Starting seed generation..." message appears
4. Error occurs immediately (< 1 second)
5. Red error message: "Failed to generate seeds. Please try again"
6. No seeds are generated

**Symptoms:**
- Immediate failure (within 1 second, not during AI generation)
- Error occurs before background job execution
- No loading state is reached
- Issue is 100% reproducible in production
- Likely works in development environment

## Reproduction

**Steps to Reproduce:**
1. Navigate to https://app.openhorizon.cc/brainstorm
2. Enter any prompt in the text field (e.g., "something warm and adventurous")
3. Click "Generate Seeds" button
4. Observe immediate failure with red error message

**Reproduction Verified:** Yes (reported by user in production)

## Root Cause

### Affected Components

- **Files**:
  - `/app/src/inngest/client.ts` - Inngest client configuration
  - `/app/src/server/services/brainstorm-generator.ts` - Service that sends Inngest events
  - `/app/src/app/api/inngest/route.ts` - Inngest webhook handler
  - `/app/env.yaml` - Environment configuration (used for Cloud Run deployment)

- **Functions/Classes**:
  - `generateBrainstormSession()` - Function that triggers background job
  - `inngest.send()` - Method that attempts to send event to Inngest
  - `generateSeedsJob` - Inngest function that should execute in background

- **Dependencies**:
  - Inngest Cloud service (not configured)
  - OpenAI API (configured correctly)

### Analysis

The application is configured to use Inngest for background job processing. When a user clicks "Generate Seeds", the following sequence occurs:

1. Frontend calls `trpc.brainstorm.generate.useMutation()`
2. Backend creates a `BrainstormSession` record in the database
3. Backend attempts to send an Inngest event: `inngest.send({ name: 'brainstorm.generate-seeds', ... })`
4. **FAILURE OCCURS HERE**: Inngest client is configured with test keys (`INNGEST_EVENT_KEY="test"`, `INNGEST_SIGNING_KEY="test"`)
5. In production, test keys cannot communicate with Inngest Cloud
6. The `inngest.send()` call fails or times out
7. Error is caught and returned to frontend as "Failed to generate seeds"

**Why This Occurs:**

The production deployment (Cloud Run) uses the `env.yaml` file which contains:
```yaml
INNGEST_EVENT_KEY: "test"
INNGEST_SIGNING_KEY: "test"
```

These are development-only test keys that work with the local Inngest Dev Server (`npx inngest-cli dev`), but they **do not work in production** without either:
- An Inngest Cloud account with production keys, OR
- A self-hosted Inngest Dev Server accessible from production (not recommended)

The code assumes Inngest is properly configured, but in production there is no active Inngest service to receive events.

**Code Location:**

```
app/src/server/services/brainstorm-generator.ts:26-34
```

```typescript
// Trigger Inngest background job
await inngest.send({
  name: 'brainstorm.generate-seeds',
  data: {
    sessionId: session.id,
    tenantId,
    userId,
  },
})
```

This `inngest.send()` call fails because:
1. Inngest client (initialized in `app/src/inngest/client.ts`) has no production endpoint configured
2. Test keys are invalid for production use
3. No Inngest webhook URL has been registered in Inngest Cloud

### Related Issues

- Similar pattern exists for project generation (`project.generate-from-idea`)
- Programme generation (`programme.generate-from-concept`) would have the same issue
- All Inngest-based background jobs are non-functional in production

## Impact Assessment

**Scope:**
- Affects **all users** on production (app.openhorizon.cc)
- 100% failure rate for seed generation feature
- Brainstorming Playground feature is completely non-functional

**Affected Features:**
- ❌ Brainstorm seed generation (complete failure)
- ⚠️ Project generation from ideas (likely same issue, untested)
- ⚠️ Programme generation (likely same issue, untested)
- ✅ Other features not using Inngest (unaffected)

**Severity Justification:**
- **Critical** - Core feature completely broken in production
- User-visible functionality advertised but non-working
- Blocks all AI brainstorming workflows
- No workaround available to end users
- Production deployment is essentially incomplete

**Data/Security Concerns:**
- No data corruption risk
- No security implications
- Database records (`BrainstormSession`) are created but marked as `IN_PROGRESS` forever
- Orphaned session records may accumulate over time

## Proposed Fix

### Fix Strategy

**Option 1: Use Inngest Cloud (Recommended for Production)**
1. Sign up for Inngest Cloud account at https://www.inngest.com
2. Create a production app/environment in Inngest
3. Obtain production event key and signing key
4. Configure webhook URL: `https://app.openhorizon.cc/api/inngest`
5. Update `env.yaml` with production keys
6. Redeploy application to Cloud Run

**Option 2: Remove Inngest Dependency (Quick Fix)**
1. Execute AI generation synchronously in the API route
2. Accept longer response times (15-30 seconds)
3. Remove Inngest client calls
4. Simplify architecture but degrade UX

**Option 3: Hybrid Approach**
1. Check if Inngest keys are "test" at runtime
2. Fall back to synchronous execution in production
3. Use Inngest in development only
4. Allows immediate functionality with plan to add Inngest later

**Recommended: Option 1** - Inngest Cloud is the proper production solution and maintains the intended architecture.

### Files to Modify

1. **env.yaml**
   - Changes: Replace test keys with production Inngest keys
   - Reason: Enables production Inngest connectivity

2. **Inngest Dashboard (External)**
   - Changes: Register webhook URL `https://app.openhorizon.cc/api/inngest`
   - Reason: Allows Inngest to send events to the application

3. **cloudbuild.yaml** (if needed)
   - Changes: Ensure env.yaml is used correctly during build
   - Reason: Verify environment variables are properly injected

### Alternative Approaches

**If Inngest Cloud is not desired:**

Implement synchronous execution as a fallback:

**File: `app/src/server/services/brainstorm-generator.ts`**
- Add environment check: `if (process.env.INNGEST_EVENT_KEY === 'test')`
- If test keys detected, call `generateSeeds()` directly instead of sending event
- Update session status to COMPLETED inline
- Accept 15-30 second API response time

**Pros:**
- Immediate fix, no external dependency
- Works without Inngest account

**Cons:**
- Long API timeouts (may exceed Cloud Run limits)
- Poor user experience (blocked waiting)
- Defeats purpose of background job architecture

### Risks and Considerations

**Inngest Cloud Approach:**
- **Cost**: Inngest has usage-based pricing (check free tier limits)
- **Dependency**: Adds external service dependency
- **Configuration**: Requires proper webhook setup
- **Security**: Keys must be kept secret, use environment variables

**Synchronous Approach:**
- **Timeout Risk**: Cloud Run default timeout is 60s, may need adjustment
- **Scalability**: Blocks request threads during AI generation
- **UX Degradation**: User must wait 15-30 seconds for response

### Testing Requirements

**Test Cases Needed:**

1. **Verify Inngest Connection**
   - Test: Visit `https://app.openhorizon.cc/api/inngest` (should return Inngest metadata)
   - Expected: Returns JSON with registered functions
   - Validates: Webhook endpoint is accessible

2. **Test Seed Generation End-to-End**
   - Test: Generate seeds with valid prompt
   - Expected: Loading screen → Seeds displayed after 15-30 seconds
   - Validates: Complete flow works in production

3. **Verify No Regression on Other Features**
   - Test: Create a project, navigate UI
   - Expected: Non-Inngest features still work
   - Validates: Fix doesn't break existing functionality

4. **Test Error Handling**
   - Test: Generate seeds with OpenAI API key removed (simulate AI failure)
   - Expected: User-friendly error message, session marked as FAILED
   - Validates: Proper error handling in background job

5. **Verify Polling Mechanism**
   - Test: Monitor `getStatus` API calls during generation
   - Expected: Frontend polls every 2 seconds, status updates correctly
   - Validates: Real-time status updates work

**Validation Commands:**

```bash
# Test Inngest webhook endpoint
curl https://app.openhorizon.cc/api/inngest

# Check if Inngest functions are registered
curl https://app.openhorizon.cc/api/inngest | jq '.functions'

# Monitor Cloud Run logs during seed generation
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=openhorizon-app" --limit 50 --format json

# Verify environment variables are set
gcloud run services describe openhorizon-app --region=us-central1 --format="get(spec.template.spec.containers[0].env)" --project=openhorizon-app

# Test database for orphaned sessions
psql $DATABASE_URL -c "SELECT id, generationStatus, createdAt FROM BrainstormSession WHERE generationStatus = 'IN_PROGRESS' ORDER BY createdAt DESC LIMIT 10;"
```

## Implementation Plan

**Phase 1: Setup Inngest Cloud (1-2 hours)**
1. Create Inngest account and production app
2. Obtain production keys
3. Configure webhook in Inngest dashboard

**Phase 2: Update Configuration (15 minutes)**
1. Update `env.yaml` with production keys
2. Verify cloudbuild.yaml uses env.yaml correctly
3. Commit changes to repository

**Phase 3: Deploy (15 minutes)**
1. Trigger Cloud Build deployment
2. Verify environment variables in Cloud Run
3. Test `/api/inngest` endpoint accessibility

**Phase 4: Validation (30 minutes)**
1. Test seed generation end-to-end
2. Monitor logs for any errors
3. Verify status polling works correctly
4. Test multiple concurrent generations
5. Clean up any orphaned session records

**Phase 5: Documentation (15 minutes)**
1. Update DEPLOYMENT.md with Inngest setup steps
2. Add production environment checklist
3. Document troubleshooting steps

**Total Estimated Time: 3-4 hours**

This RCA document should be used by `/implement-fix` command or manual implementation.

## Next Steps

1. ✅ Review this RCA document
2. ✅ Decide on fix approach (Inngest Cloud vs Synchronous fallback) - **Chose Inngest Cloud**
3. ✅ If Inngest Cloud: Create account and obtain production keys - **Keys obtained**
4. ✅ Update `env.yaml` with production configuration - **COMPLETED**
5. ⏭️ Redeploy to Cloud Run
6. ⏭️ Validate fix in production
7. ⏭️ Clean up orphaned `BrainstormSession` records
8. ⏭️ Update documentation for future deployments

## Fix Implementation

**Date**: 2025-12-20

### Changes Made

1. **Updated `env.yaml`** with production Inngest credentials:
   - `INNGEST_EVENT_KEY`: Production event key for "generate seed"
   - `INNGEST_SIGNING_KEY`: Production signing key

### Event Keys Configuration

The application uses three separate event keys for different functions:
- **Generate Seed**: `I8TpIjCA-6J_x9wYoSVZ_2fKaSg9faLlqFBZMQF0e3Mgrw6JGA8CedF9FySf865rOchshVupoBvomcnii8bCCg`
- **Plan Project**: `fEMWbqqNRvpL2jxUUwLrZPXduH6IYGmW9T9B_dfMPdRD3j-m4I7sk1xUJcakC1XVILazYVMpsrumKCsuQNFMPg`
- **Plan Programme**: `9bJLszozgo2XbtLYUUb5IXH3ka5ce9LvUBWq2D6zaNTtiT5Nl4qows6N3h9lF_jonzbZBCbU737eOpOkwCJMug`

Currently configured the "Generate Seed" key as the primary `INNGEST_EVENT_KEY`.

### Remaining Tasks

1. Deploy the updated configuration to Cloud Run
2. Verify webhook endpoint is registered in Inngest dashboard: `https://app.openhorizon.cc/api/inngest`
3. Test seed generation end-to-end
4. Consider if multiple event keys need to be handled (may need code changes)
