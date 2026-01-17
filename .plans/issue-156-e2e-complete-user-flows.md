# Implementation Plan: Issue #156 - E2E Tests for Complete User Flows

**Epic:** #003 Production Readiness & Testing
**Priority:** High
**Depends on:** #154 (E2E Test Infrastructure)

## 📋 Overview

This plan outlines the implementation of comprehensive end-to-end tests for all critical user flows in OpenHorizon. The tests will validate the complete journey from seed creation through project elaboration, programme building, budget planning, document export, and multi-tenant isolation.

## 🎯 Objectives

1. Implement E2E tests covering all critical user journeys
2. Ensure tests are deterministic and non-flaky
3. Validate background job processing (vendor searches)
4. Test multi-tenant data isolation
5. Create comprehensive test coverage for production readiness

## 📊 Current State Analysis

### Existing Infrastructure ✅
- Playwright configuration set up (`playwright.config.ts`)
- Test infrastructure from Issue #154 in place:
  - Global setup/teardown
  - Database seeding helpers
  - Authentication helpers
  - Test fixtures
- Test directory structure exists (`tests/e2e/`)
- 7 E2E test spec files already created:
  1. `seed-creation.spec.ts`
  2. `seed-elaboration.spec.ts`
  3. `project-generation.spec.ts`
  4. `programme-builder.spec.ts`
  5. `budget-planning.spec.ts`
  6. `document-export.spec.ts`
  7. `multi-tenant.spec.ts`

### Current Test Coverage Status

Based on analysis, the existing test files appear to be comprehensive but need validation:
- **~20+ test cases** across 7 spec files
- Tests follow Playwright best practices
- Use proper authentication helpers
- Include edge case testing
- Have background job polling mechanisms

### Gaps to Address

1. **Test Execution Validation**: Tests have not been run to verify they work
2. **Dependencies**: Need to ensure Playwright dependencies are installed
3. **Environment Setup**: Verify `.env.test` configuration
4. **Database Setup**: Ensure test database exists and is accessible
5. **Clerk Test Users**: Need to verify test users are created in Clerk
6. **Background Jobs**: Inngest must be running for vendor search tests
7. **Determinism**: Need to validate tests don't have flakiness

## 🏗️ Implementation Plan

### Phase 1: Environment & Dependency Setup

**Goal:** Ensure all prerequisites are in place for test execution

#### Task 1.1: Install Playwright Dependencies
```bash
cd /worktrees/openhorizon.cc/issue-156/app
npm install
npx playwright install chromium
```

**Verification:**
- Playwright browser binaries installed
- `@playwright/test` package available

#### Task 1.2: Verify Test Database Configuration
**File:** `/worktrees/openhorizon.cc/issue-156/.env.test`

Required environment variables:
```env
TEST_DATABASE_URL=postgresql://localhost/openhorizon_test
BASE_URL=http://localhost:3000
CLERK_SECRET_KEY=<test_mode_key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<test_mode_key>
TEST_ADMIN_USER_ID=user_xxx
TEST_STAFF_USER_ID=user_yyy
TEST_PARTICIPANT_USER_ID=user_zzz
```

**Actions:**
- Check if `.env.test` exists
- Verify all required variables are set
- Create test database if needed

#### Task 1.3: Validate Test User Setup
**Prerequisites:**
- Clerk test users created manually in dashboard
- User IDs copied to `.env.test`

**Verification:**
```bash
# Check if auth helper can authenticate
# Run a simple test to verify Clerk integration
```

### Phase 2: Test Infrastructure Validation

**Goal:** Verify the test infrastructure works correctly

#### Task 2.1: Validate Global Setup/Teardown
**Files:**
- `tests/global-setup.ts`
- `tests/global-teardown.ts`

**Actions:**
1. Review global setup logic
2. Ensure database seeding works
3. Verify authentication state creation
4. Test cleanup/teardown process

**Validation:**
```bash
npx playwright test --global-setup=./tests/global-setup.ts
```

#### Task 2.2: Verify Database Helpers
**File:** `tests/helpers/database.ts`

**Check:**
- `getTestPrismaClient()` works
- `resetDatabase()` safety checks
- `seedDatabase()` creates all fixtures
- Connection/disconnection handling

#### Task 2.3: Verify Authentication Helpers
**File:** `tests/helpers/auth.ts`

**Check:**
- `signInAsAdmin()` works
- `signInAsStaff()` works
- `signInAsParticipant()` works
- `signOut()` works

### Phase 3: Individual Test Suite Execution

**Goal:** Run and validate each test suite independently

#### Task 3.1: Seed Creation Tests
**File:** `tests/e2e/seed-creation.spec.ts`

**Test Coverage:**
- Generate seeds from brainstorming prompt ✓
- Save seed to garden ✓
- Dismiss unwanted seed ✓
- Validate empty prompt ✓
- Display all seed fields correctly ✓
- Handle slow AI generation gracefully ✓
- Navigation to seed garden ✓
- Edge cases: long prompts, special characters ✓

**Execution:**
```bash
npx playwright test tests/e2e/seed-creation.spec.ts --headed
```

**Expected Outcome:**
- All tests pass
- No flakiness observed
- Screenshots/videos captured on failure

#### Task 3.2: Seed Elaboration Tests
**File:** `tests/e2e/seed-elaboration.spec.ts`

**Test Coverage:**
- Start elaboration session
- Answer AI questions
- Use quick replies
- Track progress toward completion
- Metadata preview updates
- Message editing

**Execution:**
```bash
npx playwright test tests/e2e/seed-elaboration.spec.ts --headed
```

**Validation:**
- Conversational flow works
- Progress tracking accurate
- Metadata updates correctly

#### Task 3.3: Project Generation Tests
**File:** `tests/e2e/project-generation.spec.ts`

**Test Coverage:**
- Convert elaborated seed to project
- Verify project DNA structure
- Verify project status
- Handle incomplete seed errors
- Data mapping verification

**Execution:**
```bash
npx playwright test tests/e2e/project-generation.spec.ts --headed
```

**Validation:**
- Seed → Project conversion works
- Project data structure correct
- Error handling for incomplete seeds

#### Task 3.4: Programme Builder Tests
**File:** `tests/e2e/programme-builder.spec.ts`

**Test Coverage:**
- Create programme structure
- Add/edit/delete activities
- Reorder activities (drag-drop)
- Form validation
- Data persistence

**Execution:**
```bash
npx playwright test tests/e2e/programme-builder.spec.ts --headed
```

**Validation:**
- CRUD operations work
- Drag-drop functionality (if implemented)
- Validation prevents invalid data

#### Task 3.5: Budget Planning Tests
**File:** `tests/e2e/budget-planning.spec.ts`

**Test Coverage:**
- Create budget categories
- Erasmus+ unit cost calculations
- Trigger food vendor search (background job)
- Trigger accommodation vendor search
- Poll for job completion (max 30s)
- Error handling and retry

**Execution:**
```bash
# Ensure Inngest dev server is running
npx inngest-cli dev &

npx playwright test tests/e2e/budget-planning.spec.ts --headed
```

**Validation:**
- Budget calculations accurate
- Background jobs complete
- Vendor search results appear
- Polling mechanism works (no timeouts)

**⚠️ Critical:** This suite requires Inngest to be running for background job tests.

#### Task 3.6: Document Export Tests
**File:** `tests/e2e/document-export.spec.ts`

**Test Coverage:**
- Export project as PDF
- Export project as DOCX
- Export application forms
- Verify file download
- Loading states
- Error handling

**Execution:**
```bash
npx playwright test tests/e2e/document-export.spec.ts --headed
```

**Validation:**
- Files download successfully
- File types correct
- Loading states shown
- Errors handled gracefully

#### Task 3.7: Multi-Tenant Isolation Tests
**File:** `tests/e2e/multi-tenant.spec.ts`

**Test Coverage:**
- User can only see own projects
- User can only see own seeds
- Direct URL access protection
- Session-based access control
- Security (SQL injection, path traversal prevention)

**Execution:**
```bash
npx playwright test tests/e2e/multi-tenant.spec.ts --headed
```

**Validation:**
- Data isolation enforced
- Unauthorized access blocked
- No data leakage between users
- Security vulnerabilities prevented

### Phase 4: Full Test Suite Execution

**Goal:** Run all tests together and ensure no conflicts

#### Task 4.1: Full Suite Run (Serial)
**Configuration:** `workers: 1` (already set for database isolation)

```bash
npx playwright test tests/e2e/
```

**Expected Outcome:**
- All tests pass in sequence
- No database conflicts
- No test interference
- Total execution time < 15 minutes

#### Task 4.2: Generate Test Report
```bash
npx playwright test tests/e2e/ --reporter=html
npx playwright show-report
```

**Expected Output:**
- HTML test report
- Screenshots for failures
- Video recordings for failures
- Execution time metrics

### Phase 5: Test Reliability & Determinism

**Goal:** Ensure tests are stable and non-flaky

#### Task 5.1: Flakiness Detection
**Actions:**
1. Run full suite 5 times consecutively
2. Identify any intermittent failures
3. Analyze timing issues
4. Review wait strategies

**Acceptance:**
- 5/5 runs pass completely
- No intermittent failures
- Consistent execution times

#### Task 5.2: Fix Flaky Tests
**Common Issues:**
- Insufficient wait times
- Race conditions
- Network timing
- Background job delays

**Solutions:**
- Use `waitFor()` instead of `waitForTimeout()`
- Implement retry logic for network requests
- Increase polling timeouts for background jobs
- Add explicit wait conditions

#### Task 5.3: Test Data Isolation
**Verify:**
- Tests can run in any order
- Each test cleans up after itself
- Global teardown resets database
- No test dependencies on execution order

### Phase 6: CI/CD Integration Preparation

**Goal:** Prepare tests for CI pipeline

#### Task 6.1: Create CI Test Script
**File:** `package.json`

Add script:
```json
{
  "scripts": {
    "test:ci": "playwright test --reporter=html,json --output=test-results/",
    "test:e2e:ci": "playwright test tests/e2e/ --reporter=html,json"
  }
}
```

#### Task 6.2: Environment Variable Documentation
**File:** `tests/README.md`

Document:
- Required env vars for CI
- Database setup instructions
- Clerk test mode configuration
- Inngest setup for background jobs

#### Task 6.3: Docker Test Environment
**Optional:** Create Docker Compose for isolated test environment

```yaml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: openhorizon_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"

  inngest:
    image: inngest/inngest:latest
    ports:
      - "8288:8288"
```

### Phase 7: Documentation & Handoff

**Goal:** Document test suite for team use

#### Task 7.1: Update Test README
**File:** `tests/e2e/README.md`

Add sections:
- ✅ Test execution results
- ✅ Known issues and limitations
- ✅ Troubleshooting guide
- ✅ CI/CD integration instructions

#### Task 7.2: Create Test Execution Guide
**New File:** `tests/RUNNING_TESTS.md`

Include:
- Quick start guide
- Environment setup
- Running specific test suites
- Debugging failed tests
- CI/CD configuration

#### Task 7.3: Test Coverage Report
**New File:** `tests/TEST_COVERAGE.md`

Document:
- ✅ Seed → Elaboration → Project flow (happy path)
- ✅ Programme builder creation and editing
- ✅ Budget calculator accuracy (Erasmus+ unit costs)
- ✅ Vendor search background jobs (food, accommodation)
- ✅ Document export (PDF, DOCX generation)
- ✅ Multi-tenant isolation (user-based data separation)
- Test statistics (pass rate, coverage percentage)
- Known gaps in coverage

## 🔍 Acceptance Criteria Validation

### ✅ All Critical User Flows Validated End-to-End

| Flow | Test Suite | Status |
|------|-----------|--------|
| Seed → Elaboration → Project | `seed-creation.spec.ts`, `seed-elaboration.spec.ts`, `project-generation.spec.ts` | ✅ Tests written |
| Programme Builder | `programme-builder.spec.ts` | ✅ Tests written |
| Budget Calculator | `budget-planning.spec.ts` | ✅ Tests written |
| Vendor Search (Background Jobs) | `budget-planning.spec.ts` | ✅ Tests written |
| Document Export | `document-export.spec.ts` | ✅ Tests written |
| Multi-Tenant Isolation | `multi-tenant.spec.ts` | ✅ Tests written |

### ✅ Tests Are Deterministic (No Flaky Tests)

**Strategies Implemented:**
- Serial execution (`workers: 1`) for database isolation
- Proper wait strategies (`waitFor()` instead of timeouts)
- Polling for background jobs (max 30s)
- Database reset between runs
- Explicit authentication before each test
- Screenshots/videos for debugging failures

**Validation:**
- Run tests 5 times consecutively
- All runs pass without intermittent failures
- Execution time consistent

## 🛠️ Technical Implementation Details

### Test Architecture

```
tests/
├── e2e/                           # E2E test suites
│   ├── seed-creation.spec.ts      # Brainstorming flow
│   ├── seed-elaboration.spec.ts   # Conversational elaboration
│   ├── project-generation.spec.ts # Seed → Project conversion
│   ├── programme-builder.spec.ts  # Multi-day programme management
│   ├── budget-planning.spec.ts    # Budget & vendor search
│   ├── document-export.spec.ts    # PDF/DOCX generation
│   └── multi-tenant.spec.ts       # Data isolation & security
├── helpers/
│   ├── database.ts                # Database utilities
│   └── auth.ts                    # Authentication helpers
├── fixtures/                      # Test data fixtures
│   ├── users.ts
│   ├── projects.ts
│   ├── seeds.ts
│   └── phases.ts
├── global-setup.ts                # Pre-test setup
├── global-teardown.ts             # Post-test cleanup
└── README.md                      # Documentation
```

### Key Design Decisions

1. **Serial Execution**: Tests run one at a time to avoid database conflicts
2. **Global Setup**: Database seeding happens once before all tests
3. **Shared Authentication**: Auth state created in global setup
4. **Polling for Background Jobs**: Vendor search tests poll for results (max 30s)
5. **Flexible Selectors**: Tests use multiple selector fallbacks for robustness
6. **Graceful Skipping**: Tests skip if features not yet implemented
7. **Screenshot/Video Capture**: On failure for debugging

### Environment Requirements

**Development:**
- Node.js 20+
- PostgreSQL 15+ (test database)
- Clerk account (test mode)
- Inngest dev server (for background job tests)

**CI/CD:**
- Docker for isolated test environment
- Environment variables for secrets
- Artifact storage for test reports

### Dependencies

**Already Installed:**
- `@playwright/test` (v1.57.0)
- `playwright` (v1.57.0)
- Prisma client
- Next.js test environment

**Additional (If Needed):**
- Inngest CLI for local development
- Docker Compose for CI environment

## 📝 Test Execution Checklist

### Pre-Execution
- [ ] Install dependencies (`npm install` in `app/`)
- [ ] Install Playwright browsers (`npx playwright install chromium`)
- [ ] Create test database (`createdb openhorizon_test`)
- [ ] Run migrations (`DATABASE_URL=postgresql://localhost/openhorizon_test npx prisma migrate deploy`)
- [ ] Set up `.env.test` with all required variables
- [ ] Create Clerk test users manually
- [ ] Start Inngest dev server (for background job tests)
- [ ] Start Next.js dev server (`npm run dev` in `app/`)

### Execution
- [ ] Run global setup (`npx playwright test --global-setup=./tests/global-setup.ts`)
- [ ] Run seed creation tests
- [ ] Run seed elaboration tests
- [ ] Run project generation tests
- [ ] Run programme builder tests
- [ ] Run budget planning tests (ensure Inngest is running)
- [ ] Run document export tests
- [ ] Run multi-tenant isolation tests
- [ ] Run full suite 5 times to check for flakiness
- [ ] Generate HTML report

### Post-Execution
- [ ] Review test results
- [ ] Analyze failures (screenshots/videos)
- [ ] Document known issues
- [ ] Update test coverage report
- [ ] Commit any test improvements
- [ ] Prepare for CI integration

## 🚨 Potential Issues & Mitigations

### Issue 1: Clerk Test Users Not Created
**Impact:** Authentication tests will fail
**Mitigation:** Manual step in Clerk dashboard, document in README
**Detection:** Auth helper tests fail immediately

### Issue 2: Inngest Not Running
**Impact:** Background job tests (vendor search) will timeout
**Mitigation:**
- Clear documentation to start Inngest
- Tests have graceful timeout handling
- Skip tests if Inngest not available

**Detection:** Budget planning tests timeout after 30s

### Issue 3: Database Conflicts
**Impact:** Tests interfere with each other
**Mitigation:**
- Serial execution (`workers: 1`)
- Database reset in global setup
- Each test uses unique data

**Detection:** Random test failures when run in parallel

### Issue 4: Flaky Timing Issues
**Impact:** Intermittent test failures
**Mitigation:**
- Proper `waitFor()` usage
- Polling mechanisms for async operations
- Generous timeouts for AI/network calls

**Detection:** Tests pass/fail inconsistently

### Issue 5: Missing Test Data
**Impact:** Tests fail due to missing fixtures
**Mitigation:**
- Global setup seeds all required data
- Tests create additional data as needed
- Verify fixtures in global setup

**Detection:** Tests fail with "not found" errors

## 📊 Success Metrics

### Quantitative
- ✅ All 7 test suites pass
- ✅ ~20+ test cases pass
- ✅ 0% flakiness rate (5 consecutive runs pass)
- ✅ Total execution time < 15 minutes
- ✅ Test coverage: 100% of critical user flows

### Qualitative
- ✅ Tests are readable and maintainable
- ✅ Documentation is comprehensive
- ✅ CI/CD integration path is clear
- ✅ Team can run tests locally without issues
- ✅ Failures are easy to debug (screenshots/videos)

## 🎯 Definition of Done

- [ ] All test dependencies installed
- [ ] Test environment configured (`.env.test`, database, Clerk)
- [ ] All 7 test suites execute successfully
- [ ] Tests run 5 times consecutively without failures
- [ ] HTML test report generated
- [ ] Test coverage report documents all flows
- [ ] README updated with execution results
- [ ] Known issues documented
- [ ] CI/CD integration instructions provided
- [ ] Pull request created with summary
- [ ] Tests validated in CI environment (if applicable)

## 📅 Estimated Timeline

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| 1. Environment Setup | 1-2 hours | Database, Clerk, Inngest |
| 2. Infrastructure Validation | 1 hour | Phase 1 |
| 3. Individual Test Suite Execution | 3-4 hours | Phase 2 |
| 4. Full Suite Execution | 1 hour | Phase 3 |
| 5. Reliability & Determinism | 2-3 hours | Phase 4 |
| 6. CI/CD Preparation | 1-2 hours | Phase 5 |
| 7. Documentation | 1-2 hours | Phase 6 |
| **Total** | **10-15 hours** | |

## 🔗 Related Issues & Dependencies

- **Depends on:** #154 (E2E Test Infrastructure) - ✅ Complete
- **Part of:** Epic #003 (Production Readiness & Testing)
- **Related:** #129 (Test Data & Fixtures)
- **Blocks:** Production deployment

## 📚 References

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Epic 003: Production Readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
- [Issue #156](https://github.com/gpt153/openhorizon.cc/issues/156)
- Existing test infrastructure in `tests/` directory

---

**Plan Created:** 2026-01-17
**Status:** Ready for Execution
**Assignee:** SCAR AI Agent
**Priority:** High
