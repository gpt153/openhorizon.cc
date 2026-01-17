# Issue #129: Test Infrastructure Implementation Plan - Summary

## 📋 Plan Status: READY FOR EXECUTION

A comprehensive 776-line implementation plan has been created at:
`.plans/issue-129-test-infrastructure-plan.md`

---

## 🎯 What This Solves

**Problem:** 9 out of 11 E2E tests are failing due to missing test infrastructure:
- No test database seeding
- No authentication setup for tests
- No fixtures for test data creation

**Solution:** Complete test infrastructure with database seeding, Playwright global setup/teardown, authentication helpers, and reusable fixtures.

---

## 📐 Architecture Overview

### 7 Implementation Phases

1. **Database Infrastructure** - Separate test database with Prisma client
2. **Seed Data Functions** - Fixtures for users, orgs, projects, seeds, phases
3. **Playwright Global Setup** - Seed DB and authenticate before tests
4. **Authentication Helpers** - Clerk integration for E2E testing
5. **Global Teardown** - Cleanup after test runs
6. **Playwright Configuration** - Wire everything together
7. **Reusable Fixture Patterns** - Composite scenarios for easy test writing

### File Structure (10 New Files, 2 Modified)

```
tests/
├── global-setup.ts                    # NEW - Seed DB before tests
├── global-teardown.ts                 # NEW - Clean up after tests
├── fixtures/
│   ├── index.ts                       # NEW - Barrel export
│   ├── users.ts                       # NEW - User/org fixtures
│   ├── organizations.ts               # NEW - Organization fixtures
│   ├── projects.ts                    # NEW - Project fixtures
│   ├── seeds.ts                       # NEW - Seed fixtures
│   └── phases.ts                      # NEW - Programme/phase fixtures
├── helpers/
│   ├── auth.ts                        # NEW - Auth helpers
│   └── database.ts                    # NEW - DB helpers
└── auth.setup.ts                      # MODIFY - Integrate with fixtures

playwright.config.ts                   # MODIFY - Add global setup/teardown
.env.test                              # NEW - Test environment config
```

---

## 🔑 Key Technical Decisions

### 1. Test Database Strategy
- **Decision:** Separate `TEST_DATABASE_URL` environment variable
- **Why:** Prevents pollution of dev/prod data, enables safe resets
- **Trade-off:** Requires maintaining two databases locally

### 2. Authentication Approach
- **Decision:** Use actual Clerk authentication with dedicated test users
- **Why:** Tests real auth flow, validates Clerk integration
- **Trade-off:** Requires one-time Clerk test user setup

### 3. Data Seeding Timing
- **Decision:** Seed once in global setup, reset between runs
- **Why:** Fast execution, consistent data, idempotent
- **Trade-off:** Tests must run serially (workers: 1)

### 4. Fixture Data Realism
- **Decision:** Create realistic, varied test data (not minimal stubs)
- **Why:** Tests reflect real scenarios, catches edge cases
- **Example:** Full project with DNA, phases, sessions vs. just `{title: 'Test'}`

### 5. Idempotency
- **Decision:** All seed functions use upsert, global setup can be re-run
- **Why:** Simplifies development, prevents "dirty database" failures

---

## 📊 Implementation Effort

| Category | Tasks | Time |
|----------|-------|------|
| Database & Environment | Setup test DB, helpers | 1.5h |
| Fixtures | Users, orgs, projects, seeds, phases | 3.75h |
| Authentication | Clerk integration, helpers | 1.5h |
| Global Setup/Teardown | Orchestration, cleanup | 1h |
| Configuration | Playwright config, env vars | 0.5h |
| Testing & Validation | Run tests, debug, verify | 1.5h |
| Documentation | README updates | 0.5h |
| **TOTAL** | | **~10 hours** |

---

## ✅ Acceptance Criteria Coverage

| Criterion | Implementation |
|-----------|----------------|
| ✅ Test data seed functions for all entities | `tests/fixtures/*.ts` - users, orgs, projects, seeds, phases |
| ✅ Playwright global setup seeds DB | `tests/global-setup.ts` - orchestrates seeding |
| ✅ Playwright global teardown cleans up | `tests/global-teardown.ts` - cleanup logic |
| ✅ Reusable fixtures for common scenarios | `tests/fixtures/index.ts` - composite functions |
| ✅ Auth helpers work in E2E context | `tests/helpers/auth.ts` - Clerk integration |
| ✅ Tests can create realistic data | All fixtures use realistic data patterns |
| ✅ Setup/teardown runs without errors | Error handling + idempotent design |

---

## 🚀 Critical Path

1. **Database Helpers** (`tests/helpers/database.ts`)
   - Test Prisma client
   - Reset/connect/disconnect functions

2. **Fixture Functions** (`tests/fixtures/*.ts`)
   - Start with users/orgs (foundation)
   - Then projects, seeds, phases (depend on orgs)

3. **Global Setup** (`tests/global-setup.ts`)
   - Orchestrate seeding
   - Handle authentication

4. **Authentication** (`tests/helpers/auth.ts`)
   - Clerk integration
   - One-time test user creation

5. **Configuration** (`playwright.config.ts`)
   - Wire global setup/teardown
   - Set workers: 1

6. **Validation** - Run tests, verify all pass

---

## 🔬 Testing Strategy

### Validation Steps
1. Run global setup manually → verify data in test DB
2. Run single test → verify it uses seeded data
3. Run all tests → verify all 11 pass
4. Re-run tests → verify idempotency
5. Check cleanup → verify teardown works

### SQL Verification Queries
```sql
-- Verify test data exists
SELECT COUNT(*) FROM organizations WHERE slug = 'test-org';
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM seeds;
SELECT COUNT(*) FROM programmes;
SELECT COUNT(*) FROM pipeline_phases;
```

---

## ⚠️ Important Notes

### One-Time Manual Setup Required
Before first test run, must create Clerk test users:
1. Go to Clerk dashboard
2. Create test users (admin, staff, participant)
3. Copy their Clerk user IDs
4. Add to `tests/fixtures/users.ts`

### Environment Variables Needed
Create `.env.test`:
```bash
TEST_DATABASE_URL="postgresql://..."
BASE_URL="http://localhost:3000"
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
TEST_ADMIN_PASSWORD="..."
```

### Test Execution
```bash
# Run all tests
npm run test

# Run with UI for debugging
npm run test:ui

# Reset test DB manually (if needed)
npx tsx tests/helpers/reset-test-db.ts
```

---

## 📚 Plan Document Contents

The full plan (`.plans/issue-129-test-infrastructure-plan.md`) includes:

- ✅ Current state analysis (existing infrastructure, gaps)
- ✅ 7-phase implementation strategy with detailed steps
- ✅ Complete code examples for all files
- ✅ Technical decision justifications with trade-offs
- ✅ File structure and architecture
- ✅ Testing & validation strategy
- ✅ Idempotency patterns
- ✅ Error handling approaches
- ✅ Learning resources
- ✅ Next steps after implementation

---

## 🎯 Why This Plan Works

1. **Comprehensive:** Covers all acceptance criteria + edge cases
2. **Realistic:** Acknowledges Clerk complexity, provides solutions
3. **Incremental:** Can build piece-by-piece, test as you go
4. **Maintainable:** Idempotent, well-documented, follows best practices
5. **Battle-tested:** Based on Playwright + Prisma + Clerk docs
6. **Debuggable:** Includes logging, validation queries, manual test steps

---

## 🚦 Ready to Execute

This plan is **production-ready** and can be executed immediately. It:
- Unblocks all Epic 003 testing work
- Provides foundation for future E2E tests
- Follows industry best practices
- Includes realistic time estimates
- Has clear success criteria

**Next Step:** Begin implementation with Phase 1 (Database Infrastructure)

---

**Plan Created:** 2025-01-17
**Estimated Completion:** 1-2 days (10 hours of work)
**Priority:** CRITICAL - BLOCKING
