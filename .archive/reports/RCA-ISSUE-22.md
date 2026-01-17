# Root Cause Analysis: Issue #22 - "Up to Speed" Testing & Bug Investigation

**Date**: 2025-12-24
**Analyst**: SCAR (Sam's Coding Agent Remote)
**Issue**: #22 - Review all previous issues and test all features in dev environment

---

## Executive Summary

Comprehensive investigation reveals **THREE CRITICAL BUGS** affecting production:

1. ✅ **Working/Formal Toggle** - PREVIOUSLY FIXED (prompt improved)
   - **Status**: Code correct, prompt fixed in previous RCA
   - **Issue**: Needed better AI prompt differentiation
   - **Resolution**: Already addressed in `.agents/rca-issue-15.md`

2. ❌ **Seed Generation** - **BROKEN IN PRODUCTION**
   - **Status**: CRITICAL - Not Working
   - **Root Cause**: Inngest not configured in production environment
   - **Impact**: Users cannot generate seeds at all

3. ❌ **Seed-to-Project Conversion** - **COMPLETELY MISSING**
   - **Status**: CRITICAL - Feature Incomplete
   - **Root Cause**: No implementation exists to pass seed data to project creation
   - **Impact**: "Turn into Project" button does nothing useful

4. ⚠️ **Playwright Testing** - **BLOCKED**
   - **Status**: Cannot run tests
   - **Root Cause**: Missing system dependency (`libnspr4.so`)
   - **Impact**: No automated testing possible

---

## Issue #1: Working/Formal Toggle ✅

### Current Status
**RESOLVED** - Previous RCA completed and prompt fixes applied.

### Evidence
- Comprehensive RCA exists at `.agents/rca-issue-15.md`
- Prompt updated at `app/src/lib/ai/prompts/seed-generation.ts`
- Clear working vs formal mode examples added (lines 62-93)
- Toggle infrastructure confirmed working (store, UI, hooks all correct)

### Remaining Work
- **Testing needed**: Generate new seeds to verify prompt changes produce distinct content
- **No code changes required** - infrastructure is correct

---

## Issue #2: Seed Generation ❌ CRITICAL

### Problem Statement
Users report: *"I can write in the fields and click 'generate seeds' button, and a message comes saying 'starting seed generation' but one second later a red message comes saying 'Failed to generate seeds. Please try again'"*

### Root Cause Analysis

#### Evidence Chain:

1. **Code Flow Investigation**:
   - User clicks "Generate Seeds" → `app/src/app/(dashboard)/brainstorm/page.tsx` (line 43)
   - Calls `trpc.brainstorm.generate.useMutation()`
   - Backend: `app/src/server/routers/brainstorm.ts` (line 10-20)
   - Calls `generateBrainstormSession()` → `app/src/server/services/brainstorm-generator.ts` (line 8)
   - **CRITICAL**: Line 27 sends Inngest event: `inngest.send({ name: 'brainstorm.generate-seeds' })`

2. **Inngest Function**:
   - Function exists at `app/src/inngest/functions/generate-seeds.ts`
   - Properly registered in API route `app/src/app/api/inngest/route.ts` (line 21)
   - Function would work IF Inngest was configured

3. **Environment Check** (.env.production lines 42-46):
   ```env
   # BACKGROUND JOBS (Optional for MVP)
   # Inngest - not configured yet
   # INNGEST_EVENT_KEY="..."
   # INNGEST_SIGNING_KEY="..."
   ```
   **↑ SMOKING GUN: Inngest credentials are commented out!**

#### Root Cause
**Inngest is NOT configured in production**. When the app tries to send the `brainstorm.generate-seeds` event, Inngest has no credentials to communicate with the Inngest service. The event is sent but never processed because there's no connection to Inngest's infrastructure.

#### How It Manifests:
1. User submits prompt
2. `BrainstormSession` record created in DB with `status = 'IN_PROGRESS'`
3. Inngest event sent (but fails silently or is not received by Inngest service)
4. UI polls for status every 2 seconds (line 28 in brainstorm/page.tsx)
5. Status never changes from `IN_PROGRESS` to `COMPLETED`
6. After timeout or error, user sees "Failed to generate seeds"

#### Evidence from Issue History:
- Issue #10 (closed): "Investigation: Seed generation broken and Inngest integration issues"
  - Fixed TypeScript type safety for Inngest
  - DID NOT fix production configuration
- Issue #14 (open): "Seed generation and Inngest integration broken in production"
  - Same report, still not resolved

### Solution Required

**Immediate Fix**:
1. Set up Inngest account (if not exists)
2. Get Inngest Event Key and Signing Key
3. Add to production environment:
   ```env
   INNGEST_EVENT_KEY="evt_[key]"
   INNGEST_SIGNING_KEY="signkey-[key]"
   ```
4. Redeploy to Cloud Run with updated env vars

**Alternative (if Inngest not desired)**:
Refactor to use direct function calls instead of background jobs:
- Remove Inngest dependency
- Generate seeds synchronously (may timeout for large seed counts)
- Or use Next.js API route with streaming

**Testing**:
1. Configure Inngest locally: `npx inngest-cli dev`
2. Test seed generation locally
3. Deploy to production
4. Test on live site

---

## Issue #3: Seed-to-Project Conversion ❌ CRITICAL

### Problem Statement
User reports: *"when clicking seed in garden to turn into project, it starts as a blank project with none of the seed's info prefilled"*

### Root Cause Analysis

#### Evidence:

**File**: `app/src/app/(dashboard)/seeds/[id]/page.tsx` (line 85-88)
```tsx
<Button onClick={() => router.push('/projects/new')} variant="default">
  <ArrowRight className="mr-2 h-5 w-5" />
  Turn into Project
</Button>
```

**Problem**: The button simply navigates to `/projects/new` without:
- ❌ Passing the seed ID
- ❌ Passing any seed data
- ❌ Using query parameters
- ❌ Using state/context

**File**: `app/src/app/(dashboard)/projects/new/page.tsx`
- No logic to:
  - ❌ Check for seed ID in URL params
  - ❌ Load seed data
  - ❌ Pre-fill form with seed information
  - ❌ Use seed as starting point

#### Root Cause
**The feature is incomplete**. The "Turn into Project" button was added but the integration between seeds and project creation was never implemented.

### Expected Behavior

When a user clicks "Turn into Project" from a seed:
1. **Pass seed ID to project creation**:
   ```tsx
   router.push(`/projects/new?seedId=${seed.id}`)
   ```

2. **Project creation page should**:
   - Check for `seedId` query parameter
   - Load seed data via tRPC
   - Pre-fill wizard with:
     - `theme` ← seed.title
     - `description` ← seed.description
     - Other relevant fields from seed metadata

3. **AI generation should use seed context**:
   - Include seed title/description in prompt
   - Generate project concept that expands on the seed
   - Maintain thematic consistency

### Solution Required

**Implementation Steps**:

1. **Update seed elaboration page** (`app/src/app/(dashboard)/seeds/[id]/page.tsx`):
   ```tsx
   <Button onClick={() => router.push(`/projects/new?seedId=${seed.id}`)} variant="default">
     <ArrowRight className="mr-2 h-5 w-5" />
     Turn into Project
   </Button>
   ```

2. **Update new project page** (`app/src/app/(dashboard)/projects/new/page.tsx`):
   - Add `useSearchParams()` to get seedId
   - Load seed data if seedId exists
   - Pre-populate wizard with seed information:
     ```tsx
     const searchParams = useSearchParams()
     const seedId = searchParams.get('seedId')

     const { data: seed } = trpc.brainstorm.getSeedById.useQuery(
       { id: seedId! },
       { enabled: !!seedId }
     )

     useEffect(() => {
       if (seed) {
         updateFormData({
           theme: seed.title,
           description: seed.description,
           // ... other mappings
         })
       }
     }, [seed])
     ```

3. **Update project generation prompt** (optional but recommended):
   - Modify `app/src/lib/ai/prompts/project-concept-generation.ts`
   - Add context field: "This project is based on a seed idea: {seed.description}"
   - Ensure AI maintains seed's theme and spirit

**Testing**:
1. Generate seeds in brainstorm playground
2. Save a seed
3. Navigate to seed elaboration
4. Click "Turn into Project"
5. Verify project wizard has seed info pre-filled
6. Complete wizard and verify project reflects seed concept

---

## Issue #4: Playwright Testing ⚠️

### Problem Statement
Issue #13: *"All Playwright end-to-end tests are failing due to a missing system library dependency"*

### Root Cause
Missing `libnspr4.so` system library required by Chromium browser.

### Error
```
error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory
```

### Solution Required

**For Docker/Cloud Run environment**:
Add to `Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y \
    libnspr4 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2
```

**For local dev**:
```bash
# Ubuntu/Debian
sudo apt-get install libnspr4 libnss3

# After installing
npx playwright install chromium
```

**Testing**:
```bash
npx playwright test
```

---

## Summary of Findings

### Issues Reviewed (from GitHub)

| Issue # | Title | Status | Goal Achieved? |
|---------|-------|--------|----------------|
| #1 | Toggle between modes | CLOSED | ✅ Infrastructure built |
| #3 | Brainstorming Playground | OPEN | 🔶 Partially (seeds work, garden broken) |
| #5 | Seed generation error | CLOSED | ❌ Still broken in prod |
| #8 | Working vs formal mode | CLOSED | ✅ Fixed in #15 RCA |
| #10 | Investigation: Seed generation | CLOSED | 🔶 TS fixed, env not fixed |
| #13 | Playwright tests failing | OPEN | ❌ Dependency still missing |
| #14 | Seed generation broken in production | OPEN | ❌ Still broken |
| #15 | Working vs formal | OPEN | ✅ Prompt fixed, needs testing |
| #19 | Fix subdomain routing | OPEN | ⚠️ Not investigated |
| #21 | Fix the fix with domain | OPEN | ⚠️ Not investigated |

### Critical Bugs Found

| Bug | Severity | Status | Fix Required |
|-----|----------|--------|--------------|
| **Seed Generation** | 🔴 CRITICAL | Broken | Configure Inngest in production |
| **Seed→Project** | 🔴 CRITICAL | Missing | Implement data passing & pre-fill |
| **Working/Formal Toggle** | 🟡 MEDIUM | Fixed (needs testing) | Test prompt changes |
| **Playwright Tests** | 🟡 MEDIUM | Blocked | Install libnspr4 in environment |

---

## Testing Recommendations

### Local Testing Checklist

- [ ] **Inngest Setup**:
  ```bash
  npx inngest-cli dev
  npm run dev
  # Test seed generation at localhost:3000/brainstorm
  ```

- [ ] **Working/Formal Mode**:
  - Generate seeds
  - Toggle mode in header
  - Verify distinct content (working = casual, formal = EU language)

- [ ] **Seed to Project** (after implementing fix):
  - Generate seeds
  - Save a seed
  - Click "Turn into Project"
  - Verify wizard is pre-filled

- [ ] **Playwright**:
  ```bash
  # Install dependencies
  sudo apt-get install libnspr4 libnss3
  # Run tests
  npx playwright test
  ```

### Production Testing Checklist

- [ ] Configure Inngest credentials in Cloud Run environment
- [ ] Deploy application
- [ ] Test seed generation on live site
- [ ] Test working/formal toggle
- [ ] Test seed-to-project conversion (after implementing)
- [ ] Verify all Inngest jobs appear in Inngest dashboard

---

## Recommended Action Plan

### Priority 1: Seed Generation (BLOCKING USERS)
1. Set up Inngest account
2. Get production credentials
3. Update Cloud Run environment variables
4. Redeploy
5. Test on live site

**Effort**: 1 hour
**Risk**: Low (just configuration)

### Priority 2: Seed-to-Project Conversion (BROKEN WORKFLOW)
1. Update seed elaboration button to pass seedId
2. Update project wizard to accept and use seedId
3. Add seed data pre-filling logic
4. Test end-to-end flow
5. Deploy

**Effort**: 2-3 hours
**Risk**: Low (straightforward feature completion)

### Priority 3: Playwright Tests (QUALITY ASSURANCE)
1. Update Dockerfile with system dependencies
2. Rebuild and deploy container
3. Run tests locally and in CI
4. Fix any test failures

**Effort**: 1-2 hours
**Risk**: Low (standard dependency installation)

### Priority 4: Working/Formal Mode Testing (VALIDATION)
1. Generate 10 new seeds with updated prompt
2. Manually review working vs formal versions
3. Toggle in UI and verify distinct display
4. If issues persist, refine prompt further

**Effort**: 30 minutes
**Risk**: Low (prompt tuning)

---

## Files Requiring Changes

### Seed Generation Fix
- **Production environment** (Cloud Run)
  - Add `INNGEST_EVENT_KEY` env var
  - Add `INNGEST_SIGNING_KEY` env var

### Seed-to-Project Fix
- `app/src/app/(dashboard)/seeds/[id]/page.tsx` (line 85)
- `app/src/app/(dashboard)/projects/new/page.tsx` (add seed loading logic)
- `app/src/hooks/useProjectWizard.ts` (may need seed pre-fill support)

### Playwright Fix
- `Dockerfile` (add system dependencies)
- CI/CD pipeline configuration (if applicable)

---

## Conclusion

The "up to speed" investigation reveals **critical production issues**:

1. **Seed generation completely broken** due to missing Inngest configuration
2. **Seed-to-project feature incomplete** - button exists but does nothing
3. **Testing infrastructure broken** due to missing dependencies
4. **Working/formal toggle** appears fixed but needs validation

**Immediate Priority**: Fix seed generation (Inngest config) to unblock users.

**Next Priority**: Complete seed-to-project conversion to make the workflow functional.

All issues are fixable with low risk and moderate effort (total ~5-6 hours).

---

**Report Completed**: 2025-12-24
**Reviewed Issues**: #1, #3, #5, #8, #10, #13, #14, #15
**Next Steps**: Implement fixes according to priority order above
