# Issue #131: E2E Tests - Complete User Flows - Implementation Plan Summary

## 📋 Plan Status: READY FOR EXECUTION

A comprehensive 400+ line implementation plan has been created at:
`.plans/issue-131-e2e-complete-user-flows.md`

---

## 🎯 What This Implements

**Problem:** Need comprehensive E2E test coverage for all critical user journeys to ensure production readiness (Epic 003).

**Solution:** 7 test suites covering complete user flows from brainstorming to project export, leveraging test infrastructure from Issue #129.

---

## 📐 Architecture Overview

### 7 Test Suites to Create

1. **seed-creation.spec.ts** - Brainstorming UI
   - Generate seeds from AI prompts
   - Save seeds to garden
   - Dismiss unwanted seeds
   - Form validation

2. **seed-elaboration.spec.ts** - Conversational AI elaboration
   - Start elaboration session
   - Answer AI questions
   - Use quick replies
   - Complete elaboration (100%)
   - Edit previous messages

3. **project-generation.spec.ts** - Seed → Project conversion
   - Convert complete seed to project
   - Verify DNA structure
   - Verify project status
   - Handle incomplete seed errors

4. **programme-builder.spec.ts** - Multi-day programme creation
   - Create programme structure
   - Add/edit/delete activities
   - Reorder activities (drag-drop)
   - Validation logic

5. **budget-planning.spec.ts** - Budget calculator + vendor search
   - Create budget categories
   - Verify Erasmus+ unit cost calculations
   - Trigger food vendor search (background job)
   - Trigger accommodation vendor search
   - Handle job failures and retry
   - Poll for job completion (max 30s)

6. **document-export.spec.ts** - PDF/DOCX generation
   - Export project as PDF
   - Export project as DOCX
   - Export application form as PDF
   - Export application form as DOCX
   - Verify file generation (not content quality)

7. **multi-tenant.spec.ts** - Data isolation
   - ⚠️ **NOTE:** Current schema has NO multi-tenant fields
   - **Alternative:** Test user-level isolation instead
   - Verify users can't access other users' projects/seeds
   - Test authorization on direct URLs

### File Structure (7 New Files)

```
tests/e2e/
├── seed-creation.spec.ts              # NEW - Test brainstorming UI
├── seed-elaboration.spec.ts           # NEW - Test conversational AI
├── project-generation.spec.ts         # NEW - Test seed → project
├── programme-builder.spec.ts          # NEW - Test multi-day programmes
├── budget-planning.spec.ts            # NEW - Test budget + vendor search
├── document-export.spec.ts            # NEW - Test PDF/DOCX generation
└── multi-tenant.spec.ts               # NEW - Test data isolation
```

---

## 🔑 Key Technical Decisions

### 1. Leverage Issue #129 Infrastructure
- **Decision:** Use fixtures, auth helpers, global setup from merged Issue #129
- **Why:** No need to rebuild test infrastructure, focus on user flows
- **Fixtures available:**
  - `createTestUser()`, `createTestOrganization()`
  - `createSeed()`, `createProject()`, `createProgramme()`
  - `createPipelinePhase()`, `createApplicationForm()`

### 2. Background Job Polling Strategy
- **Decision:** Poll every 2 seconds, max 30 seconds timeout
- **Why:** Vendor search jobs take 15-20s, need buffer for slow jobs
- **Implementation:** Custom `waitForVendorSearchResults()` helper function

### 3. Multi-Tenant Test Adaptation
- **Decision:** Test user-level isolation instead of org-level
- **Why:** Prisma schema has no `organization_id` field currently
- **Alternative:** Mark as TODO if multi-tenancy is added later

### 4. Document Export Validation
- **Decision:** Verify file generation, NOT content quality
- **Why:** PDF/DOCX content testing is brittle and expensive
- **Validate:** File size > 0, correct MIME type, successful download

### 5. Test Execution Order
- **Decision:** Tests run in parallel (per Playwright default)
- **Exception:** Export tests may run serially if they cause resource contention
- **Why:** Faster execution, idempotent fixtures prevent conflicts

---

## 📊 Implementation Effort

| Phase | Tasks | Time |
|-------|-------|------|
| Setup & Verification | Verify #129, create file structure | 30min |
| Seed Creation Tests | Brainstorming UI, save/dismiss | 45min |
| Seed Elaboration Tests | Conversational AI, chat flow | 1h |
| Project Generation Tests | Seed → Project conversion | 30min |
| Programme Builder Tests | CRUD operations, drag-drop | 1h |
| Budget & Vendor Search | Calculator + background jobs | 1h 15min |
| Document Export Tests | PDF/DOCX generation | 30min |
| Multi-Tenant Tests | User-level isolation | 30min |
| Integration & Cleanup | Full suite run, docs | 15min |
| **TOTAL** | | **~6 hours** |

---

## ✅ Acceptance Criteria Coverage

| Criterion | Implementation |
|-----------|----------------|
| ✅ Full seed → elaboration → project flow | `seed-creation` + `seed-elaboration` + `project-generation` |
| ✅ Programme builder (create, edit, save) | `programme-builder.spec.ts` |
| ✅ Budget calculator (accurate calculations) | `budget-planning.spec.ts` (Tests 1-5) |
| ✅ Vendor search background jobs | `budget-planning.spec.ts` (Tests 6-8) |
| ✅ Document export (PDF, DOCX) | `document-export.spec.ts` |
| ✅ Multi-tenant isolation | `multi-tenant.spec.ts` (user-level) |
| ✅ Tests deterministic and reliable | Idempotent fixtures, explicit waits, retry logic |

---

## 🚨 Critical Risks & Mitigation

### Risk 1: Background Job Flakiness
**Mitigation:**
- 30s timeout with 2s polling
- Exponential backoff for retries
- Error handling for failed jobs

### Risk 2: Multi-Tenant Schema Missing
**Status:** ✅ RESOLVED
- Schema has no org fields
- Will test user-level isolation instead

### Risk 3: AI Generation Non-Determinism
**Mitigation:**
- Assert structure, not content
- Test metadata extraction accuracy
- Don't compare exact AI responses

### Risk 4: Playwright PDF Export Slow
**Mitigation:**
- 30s timeout for exports
- Run serially if needed
- Monitor performance

### Risk 5: Fixture Dependencies Complex
**Mitigation:**
- Use composite fixtures: `createCompleteProject()`
- Document fixture usage in comments
- Leverage #129 infrastructure

---

## 🔬 Testing Strategy

### Execution Commands
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

### Debugging Tools
- Playwright Inspector: `PWDEBUG=1 npm test`
- Screenshots on failure (auto-configured)
- Verbose console logging

### Performance Targets
- Seed generation: < 30s
- Elaboration response: < 10s
- Project conversion: < 15s
- Programme CRUD: < 2s
- Vendor search job: < 30s
- PDF/DOCX export: < 20s

---

## 📖 Code Examples Included

The plan includes complete code examples for:

1. **Background job polling:**
   ```typescript
   async function waitForVendorSearchResults(page, selector, maxWaitMs)
   ```

2. **Multi-user context (for isolation tests):**
   ```typescript
   const test = base.extend<{ userAContext, userBContext }>({ ... })
   ```

3. **Fixture usage pattern:**
   ```typescript
   const seed = await createSeed(prisma, { completeness: 100, ... })
   ```

4. **Document export verification:**
   ```typescript
   const download = await page.waitForEvent('download')
   expect(download.suggestedFilename()).toMatch(/\.pdf$/)
   ```

---

## 🎯 Success Metrics

After implementation:
- ✅ 7 test suites created (~30+ test cases)
- ✅ 100% pass rate on first run
- ✅ < 5 minutes total execution time
- ✅ 0 flaky tests (verified over 3 runs)
- ✅ All tests documented (inline + README)

---

## 🚀 Next Steps

1. **Begin Implementation**
   - Start with Phase 1: Setup & Verification
   - Create test file structure
   - Verify #129 fixtures work

2. **Execute Phases 2-8**
   - Follow implementation plan step-by-step
   - Run tests after each phase
   - Fix issues incrementally

3. **Final Validation**
   - Run full suite 3 times
   - Verify no flaky tests
   - Update documentation

4. **Create PR**
   - Branch: `issue-131-e2e-complete-user-flows`
   - Include test execution screenshot
   - Link to Epic 003

---

## 📚 Plan Document Contents

The full plan (`.plans/issue-131-e2e-complete-user-flows.md`) includes:

- ✅ Detailed test specifications for all 7 suites
- ✅ 30+ test cases with step-by-step instructions
- ✅ Background job polling implementation
- ✅ Multi-user context setup for isolation tests
- ✅ Fixture usage patterns and examples
- ✅ Error handling and retry logic
- ✅ Performance targets and debugging strategies
- ✅ Risk analysis and mitigation
- ✅ Complete code examples
- ✅ Documentation update requirements
- ✅ Success metrics and validation checklist

---

## 🎯 Why This Plan Works

1. **Comprehensive:** Covers all 6 acceptance criteria + multi-tenant isolation
2. **Realistic:** Acknowledges schema limitations, adapts accordingly
3. **Incremental:** 9 phases, each independently testable
4. **Leverages #129:** Reuses fixtures, auth, global setup
5. **Battle-tested:** Based on Playwright best practices
6. **Debuggable:** Includes polling logic, error handling, logging

---

## 🚦 Ready to Execute

This plan is **production-ready** and can be executed immediately. It:
- Validates all critical user journeys for Epic 003
- Ensures production readiness (>80% E2E coverage goal)
- Follows industry best practices
- Has clear time estimates (6 hours)
- Has detailed success criteria

**Next Step:** Begin Phase 1 (Setup & Verification)

---

**Plan Created:** 2026-01-17
**Estimated Completion:** 6 hours (~1 working day)
**Priority:** HIGH - Production Readiness Blocker
**Dependencies:** Issue #129 (✅ MERGED)
