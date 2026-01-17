# Implementation Plan: Issue #154 - Test Infrastructure (Database Seeding & Fixtures)

**Epic:** #003 Production Readiness & Testing
**Priority:** CRITICAL - Blocks all other testing
**Assignee:** @scar
**Created:** 2026-01-17

## Problem Statement

E2E test failures during Epic 001 revealed critical infrastructure gaps:
- 9 out of 11 tests failed due to missing test database seeding
- No authentication setup for tests
- No reusable fixtures for test data
- Fixture files have schema mismatches with the actual Prisma schema

## Current State Analysis

### ✅ What Exists
1. **Global setup/teardown files** (`tests/global-setup.ts`, `tests/global-teardown.ts`)
2. **Helper modules** (`tests/helpers/auth.ts`, `tests/helpers/database.ts`)
3. **Fixture files** (`tests/fixtures/users.ts`, `projects.ts`, `seeds.ts`, `phases.ts`)
4. **Playwright configuration** with global setup/teardown configured

### ❌ What's Missing/Broken
1. **Schema mismatches in fixtures:**
   - `BrainstormSession` fixture uses `conversationHistory` field (doesn't exist in schema)
   - `Programme` fixture uses `name`, `startDate`, `endDate` fields (don't exist in schema)
   - `PipelinePhase` fixture uses incorrect field names

2. **Missing seed functions:**
   - No actual seeding implementation in `seedDatabase()`
   - Imports reference fixtures but don't handle errors

3. **Missing authentication test users:**
   - Clerk test users not created in Clerk dashboard
   - Auth state files (`.auth/*.json`) not generated

4. **Missing PrismaClient in fixtures:**
   - Fixtures import types but app may not have `@prisma/client` installed in root

## Implementation Plan

### Phase 1: Fix Schema Mismatches in Fixtures ⚠️ CRITICAL
**Files to modify:**
- `tests/fixtures/seeds.ts`
- `tests/fixtures/phases.ts`

**Changes needed:**

#### 1.1 Fix `BrainstormSession` in `seeds.ts`
**Problem:** Uses `conversationHistory` field which doesn't exist in schema
```typescript
// CURRENT (WRONG):
const session = await prisma.brainstormSession.create({
  data: {
    tenantId,
    userId,
    prompt,
    conversationHistory: [], // ❌ Field doesn't exist
  },
})

// FIX:
const session = await prisma.brainstormSession.create({
  data: {
    tenantId,
    userId,
    prompt,
    // creativityTemp and seedCount have defaults, optional here
  },
})
```

#### 1.2 Fix `Programme` in `phases.ts`
**Problem:** Uses `name`, `startDate`, `endDate` fields which don't exist in schema
**Actual schema fields:** `projectId`, `tenantId`, `version`, `status`, `generatedFromConcept`, `aiModel`

```typescript
// CURRENT (WRONG):
const programme = await prisma.programme.create({
  data: {
    tenantId,
    projectId,
    name,           // ❌ Doesn't exist
    status,
    startDate,      // ❌ Doesn't exist
    endDate,        // ❌ Doesn't exist
    overallDescription: '...', // ❌ Doesn't exist
  },
})

// FIX:
const programme = await prisma.programme.create({
  data: {
    tenantId,
    projectId,
    status,
    generatedFromConcept: {
      name: name || 'Test Programme',
      description: 'Test programme generated for E2E testing',
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
    aiModel: 'gpt-4-turbo-preview', // or use default
  },
})
```

#### 1.3 Fix `PipelinePhase` in `phases.ts`
**Problem:** Uses incorrect field names
**Actual schema fields:** Check schema for `PipelinePhase` model

```typescript
// Need to verify actual schema fields for PipelinePhase
// Current fixture may use budget, participants, notes incorrectly
```

### Phase 2: Implement Database Seeding Functions
**File to modify:** `tests/helpers/database.ts`

**Changes:**

#### 2.1 Fix import paths in `seedDatabase()`
Current imports expect fixtures in `../fixtures/` but actual path is `tests/fixtures/`

```typescript
// CURRENT:
const { createTestOrganization, createTestUserMembership, TEST_USERS } = await import(
  '../fixtures/users'
)
// ... more imports

// FIX - verify path is correct relative to tests/helpers/database.ts:
const { createTestOrganization, createTestUserMembership, TEST_USERS } = await import(
  '../fixtures/users'
)
```

#### 2.2 Add error handling to seeding
```typescript
export async function seedDatabase(): Promise<void> {
  console.log('[DB] Seeding database...')

  try {
    const { createTestOrganization, createTestUserMembership, TEST_USERS } = await import(
      '../fixtures/users'
    )
    const { createTestProject, PROJECT_SCENARIOS } = await import('../fixtures/projects')
    const { createTestSeed, SEED_SCENARIOS } = await import('../fixtures/seeds')
    const { createTestProgramme, PROGRAMME_SCENARIOS } = await import('../fixtures/phases')

    const prisma = getTestPrismaClient()

    // 1. Create test organization
    const testOrg = await createTestOrganization(prisma, {
      name: 'Test Organization',
      slug: 'test-org',
    })
    console.log('[DB]   ✓ Created test organization')

    // 2. Create test user memberships
    for (const [key, user] of Object.entries(TEST_USERS)) {
      await createTestUserMembership(prisma, user.id, testOrg.id, user.role)
      console.log(`[DB]   ✓ Created ${key} user membership`)
    }

    // 3. Create test projects
    for (const [key, scenario] of Object.entries(PROJECT_SCENARIOS)) {
      await createTestProject(prisma, testOrg.id, scenario.status, {
        title: scenario.title,
        projectDna: scenario.projectDna,
        createdByUserId: TEST_USERS.admin.id,
      })
      console.log(`[DB]   ✓ Created ${key}`)
    }

    // 4. Create test seeds
    for (const [key, scenario] of Object.entries(SEED_SCENARIOS)) {
      await createTestSeed(prisma, testOrg.id, {
        title: scenario.title,
        description: scenario.description,
        createdByUserId: TEST_USERS.admin.id,
      })
      console.log(`[DB]   ✓ Created ${key}`)
    }

    // 5. Create test programmes with phases (if needed)
    const testProject = await prisma.project.findFirst({
      where: { tenantId: testOrg.id, status: 'DRAFT' },
    })

    if (testProject) {
      // Only create if PROGRAMME_SCENARIOS is not empty
      const programmeScenarios = Object.entries(PROGRAMME_SCENARIOS)
      if (programmeScenarios.length > 0) {
        for (const [key, scenario] of programmeScenarios) {
          await createTestProgramme(prisma, testOrg.id, testProject.id, scenario)
          console.log(`[DB]   ✓ Created ${key}`)
        }
      }
    }

    console.log('[DB] ✓ Database seeding complete')
  } catch (error) {
    console.error('[DB] ✗ Database seeding failed:', error)
    throw error
  }
}
```

### Phase 3: Authentication Setup for E2E Tests

#### 3.1 Update environment variables
**File:** `.env.test.local` (create if doesn't exist)

```env
# Test Database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/openhorizon_test"

# Test Users (Clerk IDs - must be created in Clerk dashboard)
TEST_ADMIN_USER_ID="user_xxxxxxxxxxxxxxxxxxxxxx"
TEST_ADMIN_EMAIL="admin@test.openhorizon.cc"
TEST_ADMIN_PASSWORD="TestPassword123!"

TEST_STAFF_USER_ID="user_yyyyyyyyyyyyyyyyyyyyyy"
TEST_STAFF_EMAIL="staff@test.openhorizon.cc"
TEST_STAFF_PASSWORD="TestPassword123!"

TEST_PARTICIPANT_USER_ID="user_zzzzzzzzzzzzzzzzzzzzzz"
TEST_PARTICIPANT_EMAIL="participant@test.openhorizon.cc"
TEST_PARTICIPANT_PASSWORD="TestPassword123!"

# App URL
BASE_URL="http://localhost:3000"
```

#### 3.2 Create Clerk test users
**Manual step - document in README:**
1. Go to Clerk Dashboard → Users
2. Create 3 test users:
   - admin@test.openhorizon.cc (password: TestPassword123!)
   - staff@test.openhorizon.cc (password: TestPassword123!)
   - participant@test.openhorizon.cc (password: TestPassword123!)
3. Copy their Clerk user IDs
4. Add IDs to `.env.test.local`

#### 3.3 Verify auth helpers work
**File:** `tests/helpers/auth.ts` - Already implemented! ✅

Just need to test it works with real Clerk users.

### Phase 4: Add Missing Helper Functions

#### 4.1 Add PrismaClient installation check
**File:** `tests/helpers/database.ts`

Ensure `@prisma/client` is available:
```typescript
// At the top of database.ts, add a check:
try {
  const { PrismaClient } = await import('@prisma/client')
} catch (error) {
  throw new Error(
    '@prisma/client not found. Run: cd app && npm install && npx prisma generate'
  )
}
```

#### 4.2 Add realistic pipeline project fixtures
**File:** `tests/fixtures/phases.ts`

Already exists, but needs schema fixes (see Phase 1.3)

### Phase 5: Documentation

#### 5.1 Create test infrastructure README
**File:** `tests/README.md`

Document:
- How to set up test database
- How to create Clerk test users
- How to run tests
- How fixtures work
- Troubleshooting common issues

#### 5.2 Update main README
Add link to test documentation

## File Modification Summary

### Files to Modify
1. ✏️ `tests/fixtures/seeds.ts` - Remove `conversationHistory` from BrainstormSession
2. ✏️ `tests/fixtures/phases.ts` - Fix Programme and PipelinePhase schema mismatches
3. ✏️ `tests/helpers/database.ts` - Enhance error handling, verify imports
4. ✏️ `.env.test.local` - Create with test user credentials (manual)
5. 📄 `tests/README.md` - Create comprehensive testing documentation

### Files That Are Already Correct ✅
- `tests/fixtures/users.ts` - Looks good
- `tests/fixtures/projects.ts` - Looks good
- `tests/fixtures/index.ts` - Barrel export, looks good
- `tests/helpers/auth.ts` - Well implemented
- `tests/global-setup.ts` - Good structure
- `tests/global-teardown.ts` - Good structure
- `playwright.config.ts` - Properly configured

## Acceptance Criteria Checklist

- [ ] **Database seeding works**
  - [ ] Organizations are created
  - [ ] User memberships are created
  - [ ] Test projects are created
  - [ ] Test seeds are created
  - [ ] Test programmes/phases are created (if applicable)

- [ ] **Authentication works in E2E context**
  - [ ] Clerk test users exist
  - [ ] Global setup authenticates all users
  - [ ] Auth state files are generated (`.auth/*.json`)
  - [ ] Tests can use pre-authenticated sessions

- [ ] **Fixtures are schema-compliant**
  - [ ] No TypeScript errors in fixture files
  - [ ] All fixtures match actual Prisma schema
  - [ ] Fixtures can be imported and used successfully

- [ ] **Documentation is complete**
  - [ ] Test setup instructions exist
  - [ ] Fixture usage examples exist
  - [ ] Troubleshooting guide exists

- [ ] **Tests pass**
  - [ ] Global setup completes without errors
  - [ ] Database is seeded successfully
  - [ ] At least one E2E test passes using fixtures

## Risk Assessment

### High Risk
- **Schema mismatches** - Could cause runtime errors in all tests
  - Mitigation: Fix in Phase 1 before proceeding

### Medium Risk
- **Clerk test users not created** - Tests will fail authentication
  - Mitigation: Document clearly, provide step-by-step guide

### Low Risk
- **Test database URL not configured** - Easy to fix
  - Mitigation: Provide clear error messages

## Testing Strategy

### Unit Test Fixtures
```bash
# Test that fixtures can be imported and create data
cd app
npx ts-node -e "
  import { PrismaClient } from '@prisma/client';
  import { createTestOrganization } from '../tests/fixtures/users';
  const prisma = new PrismaClient();
  createTestOrganization(prisma).then(console.log);
"
```

### Test Global Setup
```bash
# Run global setup in isolation
npx playwright test --global-setup tests/global-setup.ts
```

### Test Full E2E Flow
```bash
# Run simplest E2E test
npx playwright test tests/e2e/seed-creation.spec.ts --headed
```

## Timeline Estimate

- **Phase 1 (Schema fixes):** 30-45 minutes ⚡
- **Phase 2 (Seeding implementation):** 15-30 minutes
- **Phase 3 (Auth setup):** 20-30 minutes (includes manual Clerk user creation)
- **Phase 4 (Helper functions):** 15 minutes
- **Phase 5 (Documentation):** 30-45 minutes
- **Testing & Validation:** 30 minutes

**Total: 2.5 - 3.5 hours**

## Dependencies

- PostgreSQL test database must be running
- Clerk dashboard access for creating test users
- `@prisma/client` must be generated (`npx prisma generate`)

## Success Criteria

✅ **This issue is complete when:**
1. All fixture files match the Prisma schema
2. `seedDatabase()` runs successfully and creates test data
3. Test users can authenticate in E2E tests
4. At least one E2E test passes end-to-end
5. Documentation is clear and comprehensive
6. All acceptance criteria are met

---

**Ready to implement!** 🚀
