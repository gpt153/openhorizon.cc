# E2E Tests - Complete User Flows Implementation Plan
## Issue #131: Comprehensive E2E Coverage for Production Readiness

**Epic Reference:** https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md

**Priority:** HIGH - Core validation for production readiness

**Depends On:** Issue #129 (Test Infrastructure) - ✅ MERGED

---

## 📋 Executive Summary

### Objective
Create comprehensive end-to-end test coverage for all critical user journeys in OpenHorizon, validating the complete application flow from user perspective.

### Scope
7 test suites covering:
1. Seed creation (brainstorming UI)
2. Seed elaboration (conversational AI)
3. Project generation (seed → project conversion)
4. Programme builder (multi-day activities)
5. Budget calculator (Erasmus+ unit costs)
6. Vendor search background jobs (food, accommodation)
7. Document export (PDF, DOCX)
8. Multi-tenant isolation (org-based data separation)

### Success Criteria
- ✅ All critical user flows validated end-to-end
- ✅ Tests are deterministic and reliable
- ✅ Background jobs tested with proper polling
- ✅ Multi-tenant isolation verified
- ✅ Document exports verify file generation
- ✅ Tests leverage fixtures from #129

### Estimated Time
**6 hours** (as per issue description)

---

## 🏗️ Architecture Overview

### Test Infrastructure Foundation (from #129)
The merged Issue #129 provides:
- ✅ Test database with Prisma client
- ✅ Global setup/teardown for seeding
- ✅ Authentication helpers (Clerk integration)
- ✅ Reusable fixtures (users, orgs, projects, seeds, phases)
- ✅ Idempotent seed functions

### Current Test Structure
```
/worktrees/openhorizon.cc/issue-131/tests/
├── auth.setup.ts              # Clerk authentication (from #129)
├── global-setup.ts            # DB seeding (from #129)
├── global-teardown.ts         # Cleanup (from #129)
├── fixtures/                  # Test data (from #129)
│   ├── index.ts
│   ├── users.ts
│   ├── organizations.ts
│   ├── projects.ts
│   ├── seeds.ts
│   └── phases.ts
├── helpers/                   # Utilities (from #129)
│   ├── auth.ts
│   └── database.ts
└── [EXISTING TESTS]
    ├── agent-panels-e2e.spec.ts
    ├── project-features.spec.ts
    └── week1-features.spec.ts
```

### New Test Files to Create
```
tests/e2e/
├── seed-creation.spec.ts              # NEW - Test 1: Brainstorming UI
├── seed-elaboration.spec.ts           # NEW - Test 2: Conversational elaboration
├── project-generation.spec.ts         # NEW - Test 3: Seed → project conversion
├── programme-builder.spec.ts          # NEW - Test 4: Multi-day programme
├── budget-planning.spec.ts            # NEW - Test 5: Budget calculator + vendor search
├── document-export.spec.ts            # NEW - Test 6: PDF/DOCX generation
└── multi-tenant.spec.ts               # NEW - Test 7: Org data isolation
```

---

## 📐 Detailed Test Specifications

### Test 1: Seed Creation (seed-creation.spec.ts)

**User Flow:** User brainstorms project ideas via AI-powered seed generation

**Test Cases:**
1. **Generate seeds from brainstorming prompt**
   - Navigate to `/seeds/generate`
   - Fill prompt: "Youth exchange about climate change in Barcelona"
   - Set creativity temp: 0.9, seed count: 10
   - Click "Generate Seeds"
   - Wait for AI generation (max 30s)
   - Verify 10 seeds displayed with:
     - Title (working & formal)
     - Description (working & formal)
     - Approval likelihood (0.0-1.0)
     - Estimated duration, participants
     - Suggested tags

2. **Save seed to garden**
   - Click "Save to Garden" on seed card
   - Verify toast: "Seed saved to garden!"
   - Navigate to `/seeds`
   - Verify seed appears in Seed Garden

3. **Dismiss unwanted seed**
   - Click "Dismiss" on seed card
   - Verify seed removed from UI
   - Verify toast: "Seed dismissed"

4. **Empty prompt validation**
   - Submit empty prompt
   - Verify form validation error
   - Verify no API call made

**Fixtures Needed:**
- Authenticated user (from auth.setup.ts)
- No pre-seeded data (fresh start)

**Key Assertions:**
- Seed generation API response structure
- UI displays all seed fields correctly
- Seeds persist to database
- Frontend state management (dismissed seeds hidden)

---

### Test 2: Seed Elaboration (seed-elaboration.spec.ts)

**User Flow:** User refines a seed through conversational AI dialogue

**Test Cases:**
1. **Start elaboration session**
   - Create seed fixture (using `createSeed` from fixtures)
   - Navigate to `/seeds/{seedId}`
   - Click "Start Elaboration"
   - Verify ConversationalElaboration component loads
   - Verify AI sends first question
   - Verify progress indicator shows 0% completion

2. **Answer elaboration questions**
   - Type answer: "30 participants from Spain, Germany, France"
   - Click "Send"
   - Wait for AI response (max 10s)
   - Verify AI message appears in chat
   - Verify metadata preview updates (participant count, countries)
   - Verify progress indicator increases

3. **Use quick replies**
   - Verify quick reply buttons appear
   - Click quick reply: "16-25 years old"
   - Verify message sent automatically
   - Verify AI responds

4. **Complete elaboration**
   - Continue answering until completeness = 100%
   - Verify "Elaboration Complete" indicator
   - Verify "Convert to Project" button enabled
   - Verify seed metadata complete:
     - Participant count, countries, age range
     - Duration, start/end dates
     - Budget estimates
     - Destination (country, city)
     - Activities list
     - Erasmus+ priorities

5. **Edit previous message**
   - Click "Edit" on user message
   - Change answer
   - Verify AI re-processes from that point
   - Verify metadata updates

**Fixtures Needed:**
- Test organization + user
- Saved seed (using `createSeed`)

**Key Assertions:**
- Chat message persistence
- Metadata updates in real-time
- Progress calculation accuracy
- Session state management
- Quick reply generation

---

### Test 3: Project Generation (project-generation.spec.ts)

**User Flow:** User converts elaborated seed into structured project

**Test Cases:**
1. **Convert seed to project (complete elaboration)**
   - Create fully elaborated seed fixture
   - Navigate to `/seeds/{seedId}`
   - Click "Convert to Project"
   - Wait for project creation (max 15s)
   - Verify redirect to `/projects/{projectId}`
   - Verify project created with:
     - Title (from seed.titleFormal)
     - Description (from seed.descriptionFormal)
     - DNA (extracted from seed metadata)
     - Participant count, countries
     - Duration, dates
     - Budget allocation

2. **Verify project DNA structure**
   - Check project.dna contains:
     - Participant information
     - Learning objectives
     - Erasmus+ priorities
     - Destination
     - Activities overview

3. **Verify project status**
   - Check project.status = 'CONCEPT'
   - Check project visibility in dashboard

4. **Attempt conversion with incomplete elaboration**
   - Create seed with completeness < 80%
   - Try to convert
   - Verify error: "Seed must be at least 80% complete"
   - Verify no project created

**Fixtures Needed:**
- Test organization + user
- Elaborated seed (completeness = 100%)

**Key Assertions:**
- Seed → Project data mapping
- DNA structure validity
- Project creation in database
- Error handling for incomplete seeds

---

### Test 4: Programme Builder (programme-builder.spec.ts)

**User Flow:** User creates multi-day learning programme with activities

**Test Cases:**
1. **Create new programme**
   - Create project fixture
   - Navigate to `/projects/{projectId}/programme`
   - Click "Create Programme"
   - Set duration: 7 days
   - Click "Generate Structure"
   - Verify 7 programme days created
   - Verify each day has placeholder sessions

2. **Add activity to day**
   - Click day 1
   - Click "Add Activity"
   - Fill form:
     - Title: "Icebreaker Games"
     - Duration: "2 hours"
     - Type: "Energizer"
     - Learning outcomes: ["Team building", "Communication"]
   - Click "Save"
   - Verify activity appears in day 1
   - Verify activity saved to database

3. **Edit existing activity**
   - Click activity card
   - Click "Edit"
   - Change title to "Cultural Icebreakers"
   - Add learning outcome: "Cultural awareness"
   - Click "Save"
   - Verify changes persist
   - Verify database updated

4. **Reorder activities within day**
   - Drag activity from position 1 to position 3
   - Verify visual reorder
   - Refresh page
   - Verify order persisted

5. **Delete activity**
   - Click activity card
   - Click "Delete"
   - Confirm deletion
   - Verify activity removed
   - Verify database deletion

6. **Programme validation**
   - Try to save programme with empty day
   - Verify validation warning
   - Try to save with overlapping time slots
   - Verify time conflict error

**Fixtures Needed:**
- Test organization + user
- Project with 7-day programme structure

**Key Assertions:**
- Programme CRUD operations
- Activity ordering
- Validation logic
- Database persistence
- UI state synchronization

---

### Test 5: Budget Planning (budget-planning.spec.ts)

**User Flow:** User creates budget, searches vendors, verifies Erasmus+ calculations

**Test Cases:**
1. **Create budget categories**
   - Navigate to `/projects/{projectId}/budget`
   - Click "Add Category"
   - Select "Food"
   - Set unit cost: €8 per meal
   - Set quantity: 30 participants × 21 meals = 630 meals
   - Click "Save"
   - Verify category created
   - Verify total: €5,040

2. **Verify Erasmus+ unit cost calculations**
   - Add category "Accommodation"
   - Select country: "Spain" (Barcelona)
   - Select participant age: "18-30"
   - Verify auto-populated unit cost from Erasmus+ tables
   - Set duration: 7 nights × 30 participants = 210 nights
   - Verify total matches Erasmus+ limits

3. **Add travel category**
   - Add category "Travel"
   - Select "Distance Band: 500-1999 km"
   - Verify unit cost: €275 per participant
   - Set participants: 30
   - Verify total: €8,250

4. **Verify budget totals**
   - Check overall budget summary
   - Verify sum of all categories
   - Verify budget allocation percentage
   - Verify remaining budget

5. **Edit budget category**
   - Change food quantity to 25 participants
   - Verify total recalculates
   - Verify overall budget updates

6. **Trigger vendor search background job (Food)**
   - Navigate to food phase `/phases/{phaseId}`
   - Fill search form:
     - Location: "Barcelona, Spain"
     - Participants: 30
     - Dietary requirements: "Vegetarian options"
   - Click "Search Food Options"
   - Verify loading indicator: "Searching... (usually 15-20s)"
   - Poll for job completion (max 30s)
   - Verify results displayed:
     - Restaurant name, address
     - Price estimate
     - Capacity
     - Rating
   - Verify results saved to database

7. **Trigger vendor search background job (Accommodation)**
   - Navigate to accommodation phase
   - Fill search form:
     - Location: "Barcelona, Spain"
     - Participants: 30
     - Check-in: 2026-06-01, Check-out: 2026-06-08
   - Click "Search Accommodation Options"
   - Verify loading indicator
   - Poll for job completion (max 30s)
   - Verify results displayed:
     - Hotel/hostel name, address
     - Price per night
     - Total price
     - Amenities
     - Distance from center
   - Verify results saved

8. **Handle search job failure**
   - Mock API failure (network error)
   - Trigger food search
   - Verify error alert: "Search failed"
   - Verify retry button appears
   - Click retry
   - Verify new job submitted

**Fixtures Needed:**
- Test organization + user
- Project with budget structure
- Pipeline phases (FOOD, ACCOMMODATION)

**Key Assertions:**
- Budget calculation accuracy
- Erasmus+ unit cost compliance
- Background job polling mechanism
- Job completion detection
- Error handling and retry
- Result persistence

**Technical Notes:**
- Use Inngest job polling with 2-second intervals
- Max polling timeout: 30 seconds
- Mock slow/failed jobs for edge case testing

---

### Test 6: Document Export (document-export.spec.ts)

**User Flow:** User exports project to PDF and DOCX formats

**Test Cases:**
1. **Export project as PDF**
   - Create complete project fixture (with DNA, programme, budget)
   - Navigate to `/projects/{projectId}`
   - Click "Export" → "Download PDF"
   - Wait for PDF generation (max 20s)
   - Verify file download initiated
   - Verify Content-Type: application/pdf
   - Verify file size > 0
   - Verify filename format: `project-{id}-{timestamp}.pdf`

2. **Export project as DOCX**
   - Click "Export" → "Download Word Document"
   - Wait for DOCX generation (max 20s)
   - Verify file download
   - Verify Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Verify file size > 0
   - Verify filename format: `project-{id}-{timestamp}.docx`

3. **Export application form as PDF**
   - Create application form fixture (KA1 Youth Exchange)
   - Navigate to `/application-forms/{formId}`
   - Click "Export as PDF"
   - Verify PDF contains:
     - Form title
     - Form type (KA1)
     - All form sections
     - AI-generated narratives
   - Verify rendering quality (no broken layouts)

4. **Export application form as DOCX**
   - Click "Export as Word Document"
   - Verify DOCX structure:
     - Title page
     - Table of contents
     - Formatted sections
     - Tables for budget breakdown

5. **Handle export errors**
   - Mock PDF generation failure
   - Attempt export
   - Verify error toast: "Failed to generate PDF"
   - Verify no file download
   - Verify user can retry

6. **Concurrent export handling**
   - Trigger PDF export
   - Immediately trigger DOCX export
   - Verify both complete successfully
   - Verify no race conditions

**Fixtures Needed:**
- Test organization + user
- Complete project (DNA, programme, budget, phases)
- Application form (KA1 with generated narratives)

**Key Assertions:**
- File generation completes
- Correct MIME types
- File size validation (not empty, not corrupted)
- Error handling
- Concurrent request handling

**Technical Notes:**
- DO NOT test PDF/DOCX content quality (too brittle)
- Focus on successful generation and download
- Use Playwright's download handling API
- Verify backend uses Playwright for PDF generation

---

### Test 7: Multi-Tenant Isolation (multi-tenant.spec.ts)

**User Flow:** Verify organizations cannot access each other's data

**⚠️ IMPORTANT NOTE:**
The current Prisma schema (`project-pipeline/backend/prisma/schema.prisma`) **does NOT have multi-tenant fields** (no `organization_id` or similar). This test may need to be adjusted or marked as **PENDING** until multi-tenancy is implemented.

**Alternative Approach:** If schema doesn't support orgs, test **user-level isolation** instead (users can only see their own projects).

**Test Cases (if multi-tenancy exists):**

1. **Setup: Two organizations**
   - Create Org A (user_a)
   - Create Org B (user_b)
   - Seed Org A with projects, seeds
   - Seed Org B with projects, seeds

2. **Projects are isolated**
   - Authenticate as user_a
   - Navigate to `/projects`
   - Verify only Org A projects visible
   - Attempt to navigate to Org B project URL directly
   - Verify 404 or 403 error

3. **Seeds are isolated**
   - Navigate to `/seeds`
   - Verify only Org A seeds visible
   - Attempt direct URL to Org B seed
   - Verify 404/403

4. **Background jobs are isolated**
   - Trigger food search as user_a
   - Switch to user_b
   - Verify user_b cannot see user_a's search results
   - Attempt to poll user_a's job ID as user_b
   - Verify permission denied

5. **API endpoint isolation**
   - Make API request for Org B project as user_a
   - Verify 403 Forbidden response
   - Check database query logs (if accessible)
   - Verify WHERE clause includes org filter

6. **Switch organizations (if supported)**
   - If user belongs to multiple orgs, test org switching
   - Switch from Org A to Org B
   - Verify projects update
   - Verify seeds update

**Test Cases (if only user-level isolation):**

1. **User A cannot access User B's projects**
   - Create user_a with projects
   - Create user_b with projects
   - Authenticate as user_a
   - Attempt to access user_b's project
   - Verify 403/404

**Fixtures Needed:**
- Two organizations (if multi-tenancy exists)
- Two users in different orgs
- Projects, seeds for each org

**Key Assertions:**
- Database queries filter by org/user
- API endpoints enforce authorization
- Direct URL access blocked
- No data leakage in responses

**Technical Notes:**
- Requires multiple authenticated browser contexts
- Use Playwright's `context.addCookies()` for user switching
- May need to create separate test users in Clerk
- Check schema first before implementing

---

## 🔧 Implementation Strategy

### Phase 1: Setup & Verification (30 min)
1. ✅ Verify Issue #129 infrastructure is working
   - Run `npm test` to confirm fixtures work
   - Check `tests/fixtures/` exports
   - Verify auth.setup.ts creates user.json
   - Check test database connection

2. ✅ Create test file structure
   - Create `tests/e2e/` directory
   - Create 7 empty spec files
   - Add JSDoc comments with test plan outline

### Phase 2: Seed Creation Tests (45 min)
1. Implement seed-creation.spec.ts
   - Test 1: Generate seeds from prompt
   - Test 2: Save seed to garden
   - Test 3: Dismiss seed
   - Test 4: Validation

2. Run and debug
   - Fix any fixture issues
   - Handle timing issues (AI generation)
   - Screenshot failures

### Phase 3: Seed Elaboration Tests (1 hour)
1. Implement seed-elaboration.spec.ts
   - Test 1: Start session
   - Test 2: Answer questions
   - Test 3: Quick replies
   - Test 4: Complete elaboration
   - Test 5: Edit messages

2. Run and debug
   - Handle chat state complexity
   - Verify metadata updates
   - Test progress calculation

### Phase 4: Project Generation Tests (30 min)
1. Implement project-generation.spec.ts
   - Test 1: Convert complete seed
   - Test 2: Verify DNA structure
   - Test 3: Verify project status
   - Test 4: Incomplete seed error

2. Run and debug

### Phase 5: Programme Builder Tests (1 hour)
1. Implement programme-builder.spec.ts
   - Test 1: Create programme
   - Test 2: Add activity
   - Test 3: Edit activity
   - Test 4: Reorder activities
   - Test 5: Delete activity
   - Test 6: Validation

2. Run and debug
   - Handle drag-and-drop complexity
   - Verify database persistence

### Phase 6: Budget & Vendor Search Tests (1 hour 15 min)
1. Implement budget-planning.spec.ts
   - Tests 1-5: Budget calculator
   - Tests 6-7: Background job searches
   - Test 8: Error handling

2. Run and debug
   - Background job polling logic
   - Inngest integration
   - Timeout handling

### Phase 7: Document Export Tests (30 min)
1. Implement document-export.spec.ts
   - Tests 1-2: Project export (PDF, DOCX)
   - Tests 3-4: Form export
   - Tests 5-6: Error handling

2. Run and debug
   - File download verification
   - Content-Type checks

### Phase 8: Multi-Tenant Tests (30 min)
1. ⚠️ Check schema for multi-tenancy first
   - If exists: implement multi-tenant.spec.ts
   - If not: implement user-isolation.spec.ts or mark as TODO

2. Run and debug
   - Multiple user contexts
   - Authorization checks

### Phase 9: Integration & Cleanup (15 min)
1. Run full test suite
   - `npm test tests/e2e/`
   - Fix any cross-test pollution
   - Verify idempotency

2. Update documentation
   - Add tests to README
   - Document fixture usage
   - Add troubleshooting guide

---

## 📊 Test Data Requirements

### Fixtures to Create (using #129 infrastructure)

```typescript
// Seed Creation Tests
await createTestUser(prisma, { role: 'COORDINATOR' })
await createTestOrganization(prisma, { name: 'Test Org' })

// Seed Elaboration Tests
await createSeed(prisma, {
  title: 'Youth Exchange Barcelona',
  completeness: 0,
  metadata: {}
})

// Project Generation Tests
await createSeed(prisma, {
  completeness: 100,
  metadata: {
    participantCount: 30,
    participantCountries: ['ES', 'DE', 'FR'],
    duration: 7,
    destination: { country: 'ES', city: 'Barcelona' }
  }
})

// Programme Builder Tests
await createProject(prisma, {
  status: 'CONCEPT',
  dna: { /* complete DNA */ }
})
await createProgramme(prisma, projectId, { duration: 7 })

// Budget Planning Tests
await createProject(prisma, { /* with budget structure */ })
await createPipelinePhase(prisma, projectId, 'FOOD')
await createPipelinePhase(prisma, projectId, 'ACCOMMODATION')

// Document Export Tests
await createProject(prisma, {
  status: 'COMPLETED',
  dna: { /* complete */ },
  programme: { /* 7 days */ },
  budget: { /* all categories */ }
})
await createApplicationForm(prisma, {
  formType: 'KA1',
  generatedNarratives: { /* AI text */ }
})

// Multi-Tenant Tests
await createTestOrganization(prisma, { name: 'Org A' })
await createTestOrganization(prisma, { name: 'Org B' })
await createProject(prisma, { orgId: 'org-a' })
await createProject(prisma, { orgId: 'org-b' })
```

---

## 🧪 Testing Strategy

### Test Execution
```bash
# Run all E2E tests
npm test tests/e2e/

# Run single suite
npm test tests/e2e/seed-creation.spec.ts

# Run with UI (debugging)
npx playwright test --ui

# Run with trace
npx playwright test --trace on
```

### Debugging Approach
1. **Use Playwright Inspector:**
   ```bash
   PWDEBUG=1 npm test tests/e2e/seed-creation.spec.ts
   ```

2. **Screenshots on failure:**
   - Already configured in playwright.config.ts
   - Check `test-results/` directory

3. **Verbose logging:**
   ```typescript
   test('example', async ({ page }) => {
     console.log('🔍 Navigating to /seeds/generate')
     await page.goto('/seeds/generate')
     await page.screenshot({ path: 'debug-step1.png' })
   })
   ```

### Handling Flakiness
1. **Wait for network idle:**
   ```typescript
   await page.waitForLoadState('networkidle')
   ```

2. **Explicit waits:**
   ```typescript
   await page.waitForSelector('[data-testid="seed-card"]', { timeout: 30000 })
   ```

3. **Retry on timeout (background jobs):**
   ```typescript
   async function pollForResults(page, maxRetries = 15) {
     for (let i = 0; i < maxRetries; i++) {
       const results = await page.locator('[data-testid="food-results"]')
       if (await results.isVisible()) return true
       await page.waitForTimeout(2000)
     }
     throw new Error('Results not found after 30s')
   }
   ```

### Performance Targets
- **Seed generation:** < 30s
- **Elaboration response:** < 10s
- **Project conversion:** < 15s
- **Programme CRUD:** < 2s
- **Vendor search job:** < 30s
- **PDF export:** < 20s
- **DOCX export:** < 20s

---

## ✅ Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|----------------|
| ✅ Full seed → elaboration → project flow test | `seed-creation.spec.ts` + `seed-elaboration.spec.ts` + `project-generation.spec.ts` |
| ✅ Programme builder test (create, edit, save) | `programme-builder.spec.ts` (Tests 1-5) |
| ✅ Budget calculator test (calculations accurate) | `budget-planning.spec.ts` (Tests 1-5) |
| ✅ Vendor search background jobs test | `budget-planning.spec.ts` (Tests 6-8) |
| ✅ Document export test (PDF and DOCX) | `document-export.spec.ts` (Tests 1-4) |
| ✅ Multi-tenant isolation test | `multi-tenant.spec.ts` (all tests) OR user-isolation if no multi-tenancy |
| ✅ All critical user flows validated E2E | All 7 test suites combined |
| ✅ Tests are deterministic and reliable | Idempotent fixtures, explicit waits, retry logic |

---

## 🚨 Critical Risks & Mitigation

### Risk 1: Background Job Flakiness
**Risk:** Vendor search jobs may timeout or fail unpredictably

**Mitigation:**
- Increase poll timeout to 30s
- Implement exponential backoff
- Mock slow jobs in CI environment
- Add retry logic for failed jobs

### Risk 2: Multi-Tenant Schema Missing
**Risk:** Prisma schema has no org fields, test can't be implemented

**Mitigation:**
- Check schema first (DONE - no org fields found)
- Option A: Test user-level isolation instead
- Option B: Mark test as TODO/SKIP with comment
- Option C: Add minimal multi-tenancy to backend (out of scope)

**Decision:** Implement user-level isolation test instead

### Risk 3: AI Generation Non-Determinism
**Risk:** Seed brainstorming and elaboration produce different results each run

**Mitigation:**
- Don't assert exact AI responses
- Assert structure (fields present, types correct)
- Test metadata extraction, not content quality
- Use snapshots for UI structure, not AI text

### Risk 4: Playwright PDF Generation Slow
**Risk:** PDF exports take too long, causing timeouts

**Mitigation:**
- Increase timeout to 30s for export tests
- Run export tests serially (not parallel)
- Monitor export performance
- Consider mocking in CI (generate real files locally only)

### Risk 5: Fixture Dependencies Complex
**Risk:** Creating complete project fixture requires many nested calls

**Mitigation:**
- Use composite fixture functions from #129
- Example: `createCompleteProject()` = project + programme + budget + phases
- Document fixture dependencies clearly
- Add fixture helper comments

---

## 📚 Code Examples

### Example 1: Polling for Background Job Completion

```typescript
async function waitForVendorSearchResults(
  page: Page,
  resultSelector: string,
  maxWaitMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now()
  const pollInterval = 2000 // 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const resultsLocator = page.locator(resultSelector)

    if (await resultsLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true
    }

    await page.waitForTimeout(pollInterval)
    console.log(`⏳ Polling for results... (${Math.floor((Date.now() - startTime) / 1000)}s)`)
  }

  return false
}

// Usage in test
test('Food search background job completes', async ({ page }) => {
  await page.goto(`/phases/${phaseId}`)

  // Fill search form
  await page.fill('[data-testid="location-input"]', 'Barcelona')
  await page.fill('[data-testid="participants-input"]', '30')

  // Submit search
  await page.click('[data-testid="search-food-button"]')

  // Wait for loading indicator
  await expect(page.locator('[data-testid="search-loading"]')).toBeVisible()

  // Poll for results
  const resultsAppeared = await waitForVendorSearchResults(
    page,
    '[data-testid="food-results"]',
    30000
  )

  expect(resultsAppeared).toBe(true)

  // Verify result structure
  const results = page.locator('[data-testid="food-option"]')
  expect(await results.count()).toBeGreaterThan(0)
})
```

### Example 2: Multi-User Context (for multi-tenant tests)

```typescript
import { test as base, expect } from '@playwright/test'
import { chromium, BrowserContext } from 'playwright'

// Extend base test to support multiple users
const test = base.extend<{
  userAContext: BrowserContext
  userBContext: BrowserContext
}>({
  userAContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: '.auth/user-a.json' // Separate auth state
    })
    await use(context)
    await context.close()
  },

  userBContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: '.auth/user-b.json'
    })
    await use(context)
    await context.close()
  }
})

test('Projects are isolated by user', async ({ userAContext, userBContext }) => {
  // Create pages for both users
  const pageA = await userAContext.newPage()
  const pageB = await userBContext.newPage()

  // User A sees their project
  await pageA.goto('/projects')
  await expect(pageA.locator('text=User A Project')).toBeVisible()
  await expect(pageA.locator('text=User B Project')).not.toBeVisible()

  // User B sees their project
  await pageB.goto('/projects')
  await expect(pageB.locator('text=User B Project')).toBeVisible()
  await expect(pageB.locator('text=User A Project')).not.toBeVisible()

  // User A attempts direct URL to User B's project
  await pageA.goto('/projects/user-b-project-id')
  await expect(pageA.locator('text=404')).toBeVisible() // or 403
})
```

### Example 3: Fixture Usage Pattern

```typescript
import { test, expect } from '@playwright/test'
import { createCompleteProject, createSeed } from '../fixtures'
import { getDatabaseClient } from '../helpers/database'

test.describe('Project Generation', () => {
  let prisma: any
  let testUserId: string
  let testOrgId: string

  test.beforeAll(async () => {
    prisma = getDatabaseClient()
    // Fixtures already created in global-setup.ts
    // Just retrieve IDs
    const user = await prisma.user.findFirst({ where: { email: 'test@example.com' } })
    testUserId = user.id
    testOrgId = user.organizationId // if multi-tenancy exists
  })

  test('Convert complete seed to project', async ({ page }) => {
    // Create seed fixture
    const seed = await createSeed(prisma, {
      userId: testUserId,
      completeness: 100,
      metadata: {
        participantCount: 30,
        participantCountries: ['ES', 'DE', 'FR'],
        duration: 7,
        destination: { country: 'ES', city: 'Barcelona' }
      }
    })

    // Navigate to seed
    await page.goto(`/seeds/${seed.id}`)

    // Convert to project
    await page.click('[data-testid="convert-to-project-button"]')

    // Wait for redirect
    await page.waitForURL(/\/projects\/.*/)

    // Extract project ID from URL
    const projectId = page.url().split('/').pop()

    // Verify project in database
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    expect(project).toBeTruthy()
    expect(project.name).toBe(seed.titleFormal)
    expect(project.dna.participantCount).toBe(30)
  })
})
```

### Example 4: Document Export Verification

```typescript
test('Export project as PDF', async ({ page }) => {
  // Create complete project
  const project = await createCompleteProject(prisma, {
    userId: testUserId,
    withProgramme: true,
    withBudget: true
  })

  await page.goto(`/projects/${project.id}`)

  // Start download wait
  const downloadPromise = page.waitForEvent('download')

  // Click export button
  await page.click('[data-testid="export-pdf-button"]')

  // Wait for download (max 20s)
  const download = await downloadPromise

  // Verify download properties
  expect(download.suggestedFilename()).toMatch(/project-.*\.pdf/)

  // Save file to temp location
  const path = await download.path()
  expect(path).toBeTruthy()

  // Verify file size (not empty)
  const fs = require('fs')
  const stats = fs.statSync(path)
  expect(stats.size).toBeGreaterThan(1000) // At least 1KB

  console.log(`✅ PDF exported: ${stats.size} bytes`)
})
```

---

## 🔄 Idempotency & Cleanup

### Test Isolation Strategy
- **Global setup:** Seeds database once before all tests
- **Per-test cleanup:** No cleanup needed (fixtures are idempotent)
- **Global teardown:** Resets database after all tests

### Why This Works
- Fixtures use unique IDs (cuid)
- Tests don't modify shared fixtures
- Each test creates its own data
- Database reset happens once at end

### Exception: Stateful Tests
Some tests modify state (e.g., edit activity, delete seed):
- These tests create their own fixtures
- Use `test.beforeEach` to reset state if needed

Example:
```typescript
test.describe('Programme Builder - Edit Activity', () => {
  let programmeId: string

  test.beforeEach(async () => {
    // Create fresh programme for each test
    const programme = await createProgramme(prisma, {
      days: 7,
      activities: [
        { title: 'Original Activity', duration: '2h' }
      ]
    })
    programmeId = programme.id
  })

  test('Edit activity title', async ({ page }) => {
    // Edit doesn't affect other tests
  })
})
```

---

## 📖 Documentation Updates

After implementation, update:

1. **README.md** - Add E2E test section:
   ```markdown
   ## E2E Tests

   Comprehensive end-to-end tests for all user flows.

   ### Running Tests
   ```bash
   npm test                    # All tests
   npm test tests/e2e/         # E2E tests only
   npx playwright test --ui    # Interactive mode
   ```

   ### Test Suites
   - `seed-creation.spec.ts` - Brainstorming UI
   - `seed-elaboration.spec.ts` - Conversational AI
   - `project-generation.spec.ts` - Seed → Project conversion
   - `programme-builder.spec.ts` - Multi-day activities
   - `budget-planning.spec.ts` - Budget calculator + vendor search
   - `document-export.spec.ts` - PDF/DOCX generation
   - `multi-tenant.spec.ts` - Data isolation
   ```

2. **tests/README.md** - Add fixture usage guide

3. **CONTRIBUTING.md** - Add testing guidelines

---

## 🎯 Success Metrics

After implementation, verify:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Test coverage | 7 test suites created | Count files in `tests/e2e/` |
| Pass rate | 100% on first run | `npm test` exit code |
| Total test count | ~30+ test cases | Playwright test count |
| Execution time | < 5 minutes total | Playwright test report |
| Flakiness | 0 flaky tests | Run 3 times, verify consistent pass |
| Documentation | All tests documented | Check inline comments + README |

---

## 🚀 Next Steps After Implementation

1. **Create GitHub PR**
   - Branch: `issue-131-e2e-complete-user-flows`
   - Link to issue #131
   - Include test execution screenshot
   - Request review

2. **Update Epic 003 Tracking**
   - Mark Issue #131 as complete
   - Update production readiness checklist
   - Calculate new E2E coverage percentage

3. **Future Test Enhancements**
   - Add visual regression testing (Percy, Chromatic)
   - Add performance tests (Lighthouse CI)
   - Add accessibility tests (axe-playwright)
   - Add smoke tests for production deployment

4. **CI/CD Integration**
   - Add E2E tests to GitHub Actions workflow
   - Configure parallel test execution
   - Set up test result reporting (Playwright HTML report)
   - Add test failure notifications

---

## 📝 Final Checklist

Before marking this issue complete:

- [ ] All 7 test files created
- [ ] All test cases implemented
- [ ] Tests pass locally (3 consecutive runs)
- [ ] No flaky tests detected
- [ ] Fixtures from #129 properly used
- [ ] Background job polling works reliably
- [ ] Document exports verified
- [ ] Multi-tenant/user isolation tested
- [ ] Screenshots captured on failures
- [ ] Code reviewed and formatted
- [ ] Documentation updated (README, inline comments)
- [ ] PR created and merged

---

**Estimated Total Time:** 6 hours

**Plan Created:** 2026-01-17
**Status:** READY FOR EXECUTION

---

## 🔗 References

- Epic: https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md
- Issue #129: Test Infrastructure (MERGED)
- Playwright Docs: https://playwright.dev/docs/intro
- Prisma Fixtures: https://www.prisma.io/docs/guides/testing/e2e-testing
