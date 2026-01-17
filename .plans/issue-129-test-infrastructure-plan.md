# Test Infrastructure Implementation Plan
## Issue #129: Database Seeding & Fixtures for E2E Testing

**Epic Reference:** https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md

**Priority:** CRITICAL - BLOCKING (All Epic 003 testing depends on this)

---

## 📊 Current State Analysis

### Existing Test Infrastructure
- **Playwright Config:** Basic setup exists at `/playwright.config.ts`
  - Single browser (Chromium)
  - Base URL: `https://openhorizon.cc`
  - No global setup/teardown configured
  - No fixtures configured

- **Authentication:** Partial setup at `/tests/auth.setup.ts`
  - Attempts to use Clerk authentication
  - Uses hardcoded test credentials
  - No integration with test database seeding
  - Storage state saved to `.auth/user.json`

- **Existing Tests:** 3 test files
  - `tests/week1-features.spec.ts` - Deployment verification
  - `tests/project-features.spec.ts` - Feature availability checks
  - `tests/agent-panels-e2e.spec.ts` - Agent panel tests
  - **All require authentication and test data**

- **Database:**
  - Prisma schema at `/app/prisma/schema.prisma`
  - Complex multi-tenant schema with Organizations, Projects, Seeds, Programmes, Phases
  - No test seeding infrastructure
  - Singleton Prisma client at `/app/src/lib/prisma.ts`

- **Authentication:**
  - Clerk-based authentication via `@clerk/nextjs`
  - User context created in `/app/src/server/context.ts`
  - Requires `userId` from Clerk for organization membership lookup

### Current Gaps (Causing Test Failures)
1. ❌ **No test database seeding** - Tests can't find projects/phases
2. ❌ **No authentication setup** - Tests can't access protected routes
3. ❌ **No fixtures** - Each test must manually create all data
4. ❌ **No global setup** - Database not initialized before tests
5. ❌ **No global teardown** - Test data not cleaned up
6. ❌ **No test database separation** - Risk of polluting production data

---

## 🎯 Implementation Strategy

### Phase 1: Database Infrastructure
**Goal:** Separate test database with seeding capability

#### 1.1 Environment Configuration
- Create `.env.test` file with test database URL
- Add `TEST_DATABASE_URL` environment variable
- Configure Playwright to use test environment
- Ensure test database is isolated from development/production

#### 1.2 Test Prisma Client
- Create `tests/helpers/database.ts` with test-specific Prisma client
- Use `TEST_DATABASE_URL` instead of `DATABASE_URL`
- Add database reset utility (`resetDatabase()`)
- Add database connection management (`connectDatabase()`, `disconnectDatabase()`)

#### 1.3 Database Schema Migration
- Ensure test database has latest schema
- Add migration script for test database
- Consider using Prisma's `migrate reset` for clean state

### Phase 2: Seed Data Functions
**Goal:** Reusable functions to create realistic test data

#### 2.1 Organization & User Seeds (`tests/fixtures/users.ts`)
```typescript
// Create test organization
export async function createTestOrganization(prisma, data?)

// Create test user membership
export async function createTestUserMembership(prisma, userId, orgId, role)

// Predefined test accounts
export const TEST_USERS = {
  admin: { id: 'clerk_test_admin', role: 'ADMIN' },
  staff: { id: 'clerk_test_staff', role: 'STAFF' },
  participant: { id: 'clerk_test_participant', role: 'PARTICIPANT' }
}
```

#### 2.2 Project Seeds (`tests/fixtures/projects.ts`)
```typescript
// Create project at various stages
export async function createProject(prisma, tenantId, status, overrides?)

// Predefined project scenarios
export const PROJECT_SCENARIOS = {
  draftProject: { status: 'DRAFT', ... },
  conceptProject: { status: 'CONCEPT', ... },
  completedProject: { status: 'COMPLETED', ... }
}
```

#### 2.3 Brainstorm Seeds (`tests/fixtures/seeds.ts`)
```typescript
// Create brainstorm session
export async function createBrainstormSession(prisma, tenantId, userId)

// Create seed
export async function createSeed(prisma, sessionId, data)

// Predefined seed variations
export const SEED_VARIATIONS = {
  simple: { elaborationCount: 0, ... },
  elaborated: { elaborationCount: 3, ... },
  savedSeed: { isSaved: true, ... }
}
```

#### 2.4 Programme & Phase Seeds (`tests/fixtures/phases.ts`)
```typescript
// Create programme with days
export async function createProgramme(prisma, projectId, durationDays)

// Create programme day
export async function createProgrammeDay(prisma, programmeId, dayNumber, sessions)

// Create programme session
export async function createProgrammeSession(prisma, dayId, data)

// Create pipeline phase (for agent panels)
export async function createPipelinePhase(prisma, projectId, type, status)

// Predefined programme scenarios
export const PROGRAMME_SCENARIOS = {
  weekLongExchange: { days: 7, sessionsPerDay: 4 },
  workshopWeekend: { days: 2, sessionsPerDay: 6 }
}
```

### Phase 3: Playwright Global Setup
**Goal:** Seed database and authenticate before tests

#### 3.1 Global Setup File (`tests/global-setup.ts`)
```typescript
import { chromium, FullConfig } from '@playwright/test'
import { resetDatabase, seedTestDatabase } from './helpers/database'
import { authenticateTestUser } from './helpers/auth'

export default async function globalSetup(config: FullConfig) {
  // 1. Reset test database to clean state
  await resetDatabase()

  // 2. Seed database with test data
  const testData = await seedTestDatabase()

  // 3. Authenticate test user and save storage state
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await authenticateTestUser(page, testData.testUser)
  await page.context().storageState({ path: '.auth/user.json' })
  await browser.close()

  // 4. Store test data IDs in global config for tests to access
  process.env.TEST_ORG_ID = testData.organizationId
  process.env.TEST_USER_ID = testData.userId
  process.env.TEST_PROJECT_ID = testData.projectId
}
```

#### 3.2 Database Seeding Logic (`tests/helpers/database.ts`)
```typescript
export async function seedTestDatabase() {
  const prisma = getTestPrismaClient()

  // Create test organization
  const org = await createTestOrganization(prisma)

  // Create test users
  const adminUser = await createTestUserMembership(
    prisma,
    TEST_USERS.admin.id,
    org.id,
    'ADMIN'
  )

  // Create test projects (various stages)
  const draftProject = await createProject(prisma, org.id, 'DRAFT')
  const conceptProject = await createProject(prisma, org.id, 'CONCEPT')

  // Create test seeds
  const brainstormSession = await createBrainstormSession(
    prisma,
    org.id,
    TEST_USERS.admin.id
  )

  const seeds = await Promise.all([
    createSeed(prisma, brainstormSession.id, SEED_VARIATIONS.simple),
    createSeed(prisma, brainstormSession.id, SEED_VARIATIONS.elaborated)
  ])

  // Create test programmes
  const programme = await createProgramme(prisma, conceptProject.id, 7)

  // Create pipeline phases (for agent panel tests)
  const foodPhase = await createPipelinePhase(
    prisma,
    conceptProject.id,
    'FOOD',
    'IN_PROGRESS'
  )

  const accommodationPhase = await createPipelinePhase(
    prisma,
    conceptProject.id,
    'ACCOMMODATION',
    'NOT_STARTED'
  )

  await prisma.$disconnect()

  return {
    organizationId: org.id,
    userId: TEST_USERS.admin.id,
    projectId: conceptProject.id,
    programmeId: programme.id,
    foodPhaseId: foodPhase.id,
    accommodationPhaseId: accommodationPhase.id
  }
}
```

### Phase 4: Authentication Helpers
**Goal:** Authenticate test users in E2E context

#### 4.1 Authentication Helper (`tests/helpers/auth.ts`)
**Challenge:** Clerk authentication in E2E tests

**Options:**
1. **Clerk Test Mode** - Use Clerk's test mode if available
2. **Mock Authentication** - Mock Clerk's auth responses
3. **Test User Creation** - Create actual Clerk test users
4. **Backend Auth Helper** - Generate valid session tokens

**Recommended Approach: Backend Auth Helper**
```typescript
// Use Clerk's backend API to create test session
export async function authenticateTestUser(page, testUser) {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

  // Option A: Use Clerk's backend SDK to create test session
  // and inject it into the browser

  // Option B: Navigate to login page and use test credentials
  await page.goto(`${process.env.BASE_URL}/sign-in`)
  await page.fill('input[name="identifier"]', testUser.email)
  await page.fill('input[name="password"]', testUser.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/projects')
}

// Get auth token for API tests
export async function getAuthToken(userId) {
  // Generate valid Clerk session token for API testing
}

// Create test user in Clerk
export async function createTestUserInClerk(email, password) {
  // Use Clerk backend API to create test user
  // Only run once during initial setup
}
```

#### 4.2 Clerk Integration Strategy
**Decision Point:** How to handle Clerk in tests?

**Analysis:**
- Current `auth.setup.ts` uses hardcoded credentials
- Requires actual Clerk authentication
- Need to coordinate Clerk userId with database seeding

**Recommended Solution:**
1. Create dedicated Clerk test users (one-time setup)
2. Use their Clerk user IDs in database seeding
3. Authenticate using actual Clerk login flow in global setup
4. Save authenticated state for all tests

```typescript
// tests/fixtures/users.ts
export const TEST_USERS = {
  admin: {
    clerkId: 'user_2...', // Actual Clerk test user ID
    email: 'test-admin@openhorizon.test',
    password: process.env.TEST_ADMIN_PASSWORD
  }
}
```

### Phase 5: Global Teardown
**Goal:** Clean up test data and close connections

#### 5.1 Global Teardown File (`tests/global-teardown.ts`)
```typescript
export default async function globalTeardown(config: FullConfig) {
  // 1. Close all database connections
  await disconnectDatabase()

  // 2. Optional: Clean up test data (or reset for next run)
  // For speed, may skip and rely on global setup reset

  // 3. Clean up authentication state files
  // May keep for debugging
}
```

### Phase 6: Playwright Configuration Updates
**Goal:** Wire everything together

#### 6.1 Updated `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),

  // Use authentication state in all tests
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: '.auth/user.json',
  },

  // Test environment
  fullyParallel: false, // Run serially to avoid DB conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for DB safety
  reporter: 'html',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

#### 6.2 Environment Variable Management
Add to `.env.test`:
```bash
# Test Database
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/openhorizon_test"

# Test Application URL
BASE_URL="http://localhost:3000"

# Clerk Test Configuration
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Test User Credentials
TEST_ADMIN_PASSWORD="test_password_123"
```

### Phase 7: Reusable Fixture Patterns
**Goal:** Make tests easy to write

#### 7.1 Fixture Helper Utilities
```typescript
// tests/fixtures/index.ts
export async function createCompleteTestScenario(prisma) {
  // Create org + users + projects + seeds + programmes all at once
  // For comprehensive integration tests
}

export async function createMinimalTestData(prisma) {
  // Just org + one user
  // For simple tests
}

export async function createProjectPipelineScenario(prisma) {
  // Pipeline project with all phases
  // For agent panel tests
}
```

---

## 📁 File Structure

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
├── auth.setup.ts                      # MODIFY - Integrate with fixtures
├── week1-features.spec.ts             # EXISTS - Will now pass
├── project-features.spec.ts           # EXISTS - Will now pass
└── agent-panels-e2e.spec.ts           # EXISTS - Will now pass

playwright.config.ts                   # MODIFY - Add global setup/teardown
.env.test                              # NEW - Test environment config
```

---

## 🔧 Implementation Steps

### Step 1: Environment Setup
1. Create `.env.test` with test database URL
2. Add `.env.test` to `.gitignore` (should already be covered)
3. Document required environment variables

### Step 2: Database Helpers
1. Create `tests/helpers/database.ts`
2. Implement test Prisma client
3. Implement `resetDatabase()` function
4. Implement `connectDatabase()` and `disconnectDatabase()`

### Step 3: Fixture Functions
1. Create `tests/fixtures/users.ts` with org/user seeds
2. Create `tests/fixtures/projects.ts` with project seeds
3. Create `tests/fixtures/seeds.ts` with brainstorm seeds
4. Create `tests/fixtures/phases.ts` with programme/phase seeds
5. Create `tests/fixtures/index.ts` with composite scenarios

### Step 4: Authentication
1. Create `tests/helpers/auth.ts`
2. Implement Clerk authentication strategy
3. Create test users in Clerk (one-time manual step)
4. Document test user credentials

### Step 5: Global Setup/Teardown
1. Create `tests/global-setup.ts`
2. Implement database seeding orchestration
3. Implement authentication flow
4. Create `tests/global-teardown.ts`
5. Implement cleanup logic

### Step 6: Playwright Config
1. Update `playwright.config.ts`
2. Add global setup/teardown references
3. Configure storage state
4. Set workers to 1 (DB safety)
5. Set fullyParallel to false

### Step 7: Update Existing Tests
1. Modify `tests/auth.setup.ts` to use new helpers
2. Update test files to reference seeded data via env vars
3. Remove any hardcoded data creation from individual tests

### Step 8: Testing & Validation
1. Run `npx playwright test` locally
2. Verify all 11 tests pass
3. Verify test data is created correctly
4. Verify cleanup works
5. Document any issues

---

## 🚨 Technical Decisions & Considerations

### 1. Test Database Strategy
**Decision:** Use separate `TEST_DATABASE_URL` environment variable

**Rationale:**
- Prevents accidental pollution of development/production data
- Allows parallel development and testing
- Enables safe `resetDatabase()` operations

**Trade-offs:**
- Requires maintaining two databases locally
- Requires separate migrations
- More setup complexity

**Implementation:**
```typescript
// tests/helpers/database.ts
const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
```

### 2. Authentication Approach
**Decision:** Use actual Clerk authentication with dedicated test users

**Rationale:**
- Tests real authentication flow (most realistic)
- No mocking complexity
- Validates Clerk integration

**Trade-offs:**
- Requires Clerk test account setup
- Slower than mocked auth
- Requires network connectivity

**Alternative Considered:** Mock Clerk responses
- Pros: Faster, no network dependency
- Cons: Doesn't test real auth, complex to maintain

### 3. Data Seeding Timing
**Decision:** Seed once in global setup, reset between test runs

**Rationale:**
- Fast test execution (no per-test seeding)
- Consistent test data
- Idempotent (safe to re-run)

**Trade-offs:**
- Tests can't modify data without affecting others
- Must run serially (workers: 1)

**Alternative Considered:** Per-test seeding
- Pros: Test isolation, parallel execution
- Cons: Slow (seeding overhead), complex cleanup

### 4. Fixture Data Realism
**Decision:** Create realistic, varied test data (not minimal stubs)

**Rationale:**
- Tests reflect real-world scenarios
- Catches edge cases
- Better documentation through examples

**Trade-offs:**
- More complex fixture functions
- Larger database size

**Implementation Guideline:**
```typescript
// BAD: Minimal stub
const project = { title: 'Test' }

// GOOD: Realistic data
const project = {
  title: 'Youth Exchange in Barcelona',
  erasmusAction: 'KA1',
  durationDays: 7,
  participantCount: 25,
  projectDna: { /* realistic DNA */ }
}
```

### 5. Test Parallelization
**Decision:** Disable parallel execution (`workers: 1`, `fullyParallel: false`)

**Rationale:**
- Shared database state requires serial execution
- Prevents race conditions
- Simpler to reason about

**Trade-offs:**
- Slower test execution
- Doesn't scale well with many tests

**Future Optimization:** Database-per-worker
- Each worker gets isolated database
- Enables parallelization
- Requires more complex setup

### 6. Clerk Test User Management
**Decision:** Pre-create Clerk test users, use their IDs in fixtures

**Rationale:**
- Clerk user IDs must exist before database seeding
- Creating users programmatically is complex
- One-time manual setup is acceptable

**Implementation:**
1. Manually create test users in Clerk dashboard
2. Copy their Clerk user IDs
3. Use those IDs in `TEST_USERS` constant
4. Seed database memberships with those IDs

**One-Time Setup:**
```bash
# 1. Go to Clerk dashboard
# 2. Create test users:
#    - test-admin@openhorizon.test (role: ADMIN)
#    - test-staff@openhorizon.test (role: STAFF)
# 3. Copy user IDs to tests/fixtures/users.ts
```

### 7. Global Setup Idempotency
**Decision:** Make global setup idempotent (safe to run multiple times)

**Rationale:**
- Simplifies development (can re-run without manual cleanup)
- Prevents "dirty database" failures
- Matches production deployment patterns

**Implementation:**
```typescript
export async function resetDatabase() {
  // Option A: Prisma migrate reset (destructive but clean)
  // execSync('npx prisma migrate reset --force --skip-seed')

  // Option B: Manual cleanup (faster, more control)
  await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE organizations CASCADE`
  // ... etc
}
```

---

## ✅ Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|----------------|
| Test data seed functions created for all entities | `tests/fixtures/*.ts` files |
| Playwright global setup seeds database before tests | `tests/global-setup.ts` |
| Playwright global teardown cleans up after tests | `tests/global-teardown.ts` |
| Reusable fixtures available for common scenarios | `tests/fixtures/index.ts` composite functions |
| Authentication helpers work in E2E context | `tests/helpers/auth.ts` |
| Tests can create realistic data and authenticate | All fixtures use realistic data, auth via global setup |
| All setup/teardown runs without errors | Validated through test execution |

---

## 🔬 Testing Strategy

### Manual Testing Checklist
- [ ] Global setup runs without errors
- [ ] Database is seeded with expected data
- [ ] Authentication state is saved correctly
- [ ] Test files can access seeded data
- [ ] Tests pass with seeded data
- [ ] Global teardown runs without errors
- [ ] Re-running tests works (idempotency)

### Validation Queries
```sql
-- Verify test data exists
SELECT COUNT(*) FROM organizations WHERE slug = 'test-org';
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM seeds;
SELECT COUNT(*) FROM programmes;
SELECT COUNT(*) FROM pipeline_phases;
```

### Test Execution
```bash
# Run all tests with seeding
npm run test

# Run specific test file
npx playwright test tests/week1-features.spec.ts

# Run with UI mode for debugging
npm run test:ui

# Reset database manually if needed
npx tsx tests/helpers/reset-test-db.ts
```

---

## 📊 Estimated Effort

| Task | Time Estimate |
|------|---------------|
| Environment setup | 30 min |
| Database helpers | 1 hour |
| Fixture functions (users, orgs) | 1 hour |
| Fixture functions (projects) | 1 hour |
| Fixture functions (seeds) | 45 min |
| Fixture functions (phases) | 1 hour |
| Authentication helpers | 1.5 hours |
| Global setup/teardown | 1 hour |
| Playwright config updates | 30 min |
| Update existing tests | 45 min |
| Testing & debugging | 1.5 hours |
| Documentation | 30 min |
| **TOTAL** | **~10 hours** |

**Note:** Original estimate was 6 hours. Updated to 10 hours to account for:
- Clerk authentication complexity
- Test user setup
- Debugging time
- Comprehensive fixture coverage

---

## 🎓 Learning Resources

### Playwright Global Setup
- https://playwright.dev/docs/test-global-setup-teardown

### Prisma Testing Best Practices
- https://www.prisma.io/docs/guides/testing/integration-testing

### Clerk Test Users
- https://clerk.com/docs/testing/overview

---

## 📝 Implementation Notes

### Idempotency Patterns
All seed functions should be idempotent:
```typescript
// Use upsert instead of create
await prisma.organization.upsert({
  where: { slug: 'test-org' },
  update: {},
  create: { name: 'Test Org', slug: 'test-org' }
})
```

### Error Handling
Global setup should fail fast with clear errors:
```typescript
try {
  await seedTestDatabase()
} catch (error) {
  console.error('❌ Test database seeding failed:')
  console.error(error)
  process.exit(1)
}
```

### Debugging Support
Add verbose logging for troubleshooting:
```typescript
const DEBUG = process.env.DEBUG === 'true'

if (DEBUG) {
  console.log('Seeding organization...')
  console.log('Seeding projects...')
  // ... etc
}
```

---

## 🚀 Next Steps After Implementation

1. **Expand test coverage** - Add more E2E tests using the seeded data
2. **Performance optimization** - Consider database-per-worker for parallelization
3. **CI/CD integration** - Ensure tests run in GitHub Actions
4. **Visual regression testing** - Add screenshot comparison tests
5. **API testing** - Use fixtures for API endpoint tests

---

## 📌 Summary

This plan provides a comprehensive test infrastructure that:
- ✅ Seeds realistic test data before all tests
- ✅ Handles authentication with Clerk
- ✅ Provides reusable fixtures for common scenarios
- ✅ Ensures idempotent, safe test execution
- ✅ Separates test database from development/production
- ✅ Unblocks all Epic 003 testing work

**Critical Path:** Database helpers → Fixtures → Global setup → Auth → Tests pass

**Estimated Timeline:** 10 hours (can be completed in 1-2 days)

**Risk Mitigation:** Start with simple fixtures, expand incrementally. Prioritize getting tests passing, then optimize.
