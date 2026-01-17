# E2E Test Infrastructure

This directory contains the complete E2E test infrastructure for OpenHorizon, including database seeding, authentication helpers, and test fixtures.

## 📁 Directory Structure

```
tests/
├── helpers/
│   ├── database.ts         # Database connection, seeding, and reset utilities
│   └── auth.ts             # Authentication helpers for Clerk
├── fixtures/
│   ├── index.ts            # Barrel export
│   ├── users.ts            # User and organization fixtures
│   ├── projects.ts         # Project fixtures
│   ├── seeds.ts            # Seed (brainstorm) fixtures
│   └── phases.ts           # Programme and pipeline phase fixtures
├── global-setup.ts         # Runs before all tests (DB seed + auth)
├── global-teardown.ts      # Runs after all tests (cleanup)
├── auth.setup.ts           # Legacy auth setup (kept for compatibility)
└── *.spec.ts               # Test files
```

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.test.example` to `.env.test` and fill in values:

```bash
cp .env.test.example .env.test
```

Required environment variables:
- `TEST_DATABASE_URL` - Separate test database (IMPORTANT: Not production!)
- `BASE_URL` - Application URL (default: http://localhost:3000)
- `CLERK_SECRET_KEY` - Clerk test mode secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk test mode publishable key
- Test user credentials (admin, staff, participant)

### 2. Create Clerk Test Users

**IMPORTANT:** You must manually create test users in Clerk dashboard before running tests.

1. Go to Clerk Dashboard → Users
2. Create three users:
   - `admin@test.openhorizon.cc` (password: `TestPassword123!`)
   - `staff@test.openhorizon.cc` (password: `TestPassword123!`)
   - `participant@test.openhorizon.cc` (password: `TestPassword123!`)
3. Copy their Clerk user IDs to `.env.test`:
   ```
   TEST_ADMIN_USER_ID="user_xxx"
   TEST_STAFF_USER_ID="user_yyy"
   TEST_PARTICIPANT_USER_ID="user_zzz"
   ```

### 3. Create Test Database

```bash
# Create test database
createdb openhorizon_test

# Run migrations
DATABASE_URL="postgresql://localhost/openhorizon_test" npx prisma migrate deploy
```

### 4. Run Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx playwright test tests/week1-features.spec.ts

# Run with UI for debugging
npm run test:ui

# Run in headed mode (see browser)
npx playwright test --headed
```

## 🧪 How It Works

### Global Setup (Runs Once Before All Tests)

1. **Wait for Database** - Ensures DB is ready
2. **Run Migrations** - Applies latest schema
3. **Reset Database** - Clears all test data (TRUNCATE)
4. **Seed Database** - Creates test organizations, users, projects, seeds, phases
5. **Authenticate Users** - Signs in test users and saves auth state

### Test Execution

Tests run **serially** (workers: 1) to avoid database conflicts. Each test:
- Uses pre-seeded data from global setup
- Authenticates using helper functions
- Accesses test organization and its data
- Cleans up after itself (if needed)

### Global Teardown (Runs Once After All Tests)

- Disconnects from database
- Optionally cleans up test data (currently disabled for faster re-runs)

## 📦 Using Fixtures

Fixtures provide realistic test data without boilerplate.

### Example: Create Test Project

```typescript
import { getTestPrismaClient } from './helpers/database'
import { createTestProject } from './fixtures/projects'

test('should display project', async ({ page }) => {
  const prisma = getTestPrismaClient()
  const testOrg = await prisma.organization.findFirst({ where: { slug: 'test-org' } })

  const project = await createTestProject(prisma, testOrg.id, 'DRAFT', {
    title: 'My Test Project'
  })

  await page.goto(`/projects/${project.id}`)
  await expect(page.locator(`text=${project.title}`)).toBeVisible()
})
```

### Example: Use Pre-seeded Data

```typescript
import { getTestPrismaClient } from './helpers/database'

test('should list projects', async ({ page }) => {
  // Data is already seeded by global-setup
  const prisma = getTestPrismaClient()
  const projects = await prisma.project.findMany({
    where: { organization: { slug: 'test-org' } }
  })

  await page.goto('/projects')

  for (const project of projects) {
    await expect(page.locator(`text=${project.title}`)).toBeVisible()
  }
})
```

## 🔐 Authentication

### Using Auth Helpers

```typescript
import { signInAsAdmin, signInAsStaff, signOut } from './helpers/auth'

test('admin can access admin panel', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin')
})

test('staff cannot access admin panel', async ({ page }) => {
  await signInAsStaff(page)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/dashboard/) // Redirected
})
```

### Available Auth Functions

- `signInAsAdmin(page)` - Sign in as admin user
- `signInAsStaff(page)` - Sign in as staff user
- `signInAsParticipant(page)` - Sign in as participant user
- `signOut(page)` - Sign out current user
- `isAuthenticated(page)` - Check if user is authenticated
- `ensureAuthenticated(page, role)` - Sign in if not already authenticated

## 🗄️ Database Helpers

### Available Functions

- `getTestPrismaClient()` - Get Prisma client for test database
- `connectDatabase()` - Connect to database
- `disconnectDatabase()` - Disconnect from database
- `resetDatabase()` - **⚠️ DANGER:** Deletes all data (TRUNCATE CASCADE)
- `cleanTestData()` - Remove only test-specific data (softer cleanup)
- `waitForDatabase(maxAttempts, delayMs)` - Wait for DB to be ready
- `migrateDatabase()` - Run Prisma migrations
- `seedDatabase()` - Seed database with test fixtures

### Safety Mechanisms

The `resetDatabase()` function has safety checks:
- Database URL must contain "test" OR
- `ALLOW_DB_RESET=1` must be set

This prevents accidentally wiping production data.

## 🎭 Test Scenarios

### Predefined Fixtures

Fixtures include realistic scenarios you can use directly:

**Organizations:**
- `ORGANIZATION_SCENARIOS.basicOrg` - BASIC tier organization
- `ORGANIZATION_SCENARIOS.proOrg` - PRO tier organization
- `ORGANIZATION_SCENARIOS.freeOrg` - FREE tier organization

**Projects:**
- `PROJECT_SCENARIOS.draftProject` - Draft status project
- `PROJECT_SCENARIOS.conceptProject` - Concept status project
- `PROJECT_SCENARIOS.planningProject` - Planning status project

**Seeds:**
- `SEED_SCENARIOS.savedSeed` - High-quality saved seed
- `SEED_SCENARIOS.dismissedSeed` - Dismissed seed
- `SEED_SCENARIOS.highPotentialSeed` - Very high approval likelihood

**Programmes:**
- `PROGRAMME_SCENARIOS.draftProgramme` - Draft programme
- `PROGRAMME_SCENARIOS.publishedProgramme` - Published programme

## 🔄 Background Job Testing

For tests involving background jobs (Inngest), use polling:

```typescript
test('food search completes', async ({ page }) => {
  // Trigger search
  await page.getByTestId('search-button').click()

  // Poll for results (max 60 seconds)
  let attempts = 0
  const maxAttempts = 30
  let resultsVisible = false

  while (attempts < maxAttempts && !resultsVisible) {
    try {
      await page.getByTestId('results').waitFor({ state: 'visible', timeout: 2000 })
      resultsVisible = true
    } catch {
      attempts++
      await page.waitForTimeout(2000)
    }
  }

  expect(resultsVisible).toBe(true)
})
```

## 🐛 Debugging

### View Test Database

```bash
# Connect to test database
psql openhorizon_test

# View organizations
SELECT * FROM organizations;

# View projects
SELECT * FROM projects;

# View user memberships
SELECT * FROM user_organization_memberships;
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (saved to `test-results/`)
- Videos (saved to `test-results/`)
- Traces (for Playwright Inspector)

View traces:
```bash
npx playwright show-trace test-results/.../trace.zip
```

### Verbose Logging

Enable debug logging:
```bash
DEBUG=1 npx playwright test
```

## 📝 Writing New Tests

### Basic Template

```typescript
import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './helpers/auth'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('should do something', async ({ page }) => {
    await page.goto('/feature')
    await expect(page.locator('text=Expected Content')).toBeVisible()
  })
})
```

### With Custom Fixtures

```typescript
import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './helpers/auth'
import { getTestPrismaClient } from './helpers/database'
import { createTestProject } from './fixtures/projects'

test.describe('Projects', () => {
  let projectId: string

  test.beforeAll(async () => {
    const prisma = getTestPrismaClient()
    const testOrg = await prisma.organization.findFirst({
      where: { slug: 'test-org' }
    })

    const project = await createTestProject(prisma, testOrg.id, 'DRAFT')
    projectId = project.id
  })

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('should display project', async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    await expect(page.locator('.project-title')).toBeVisible()
  })
})
```

## 🚨 Common Issues

### Issue: Tests fail with "organization not found"

**Solution:** Ensure global setup ran successfully. Check:
```bash
# Verify test org exists
psql openhorizon_test -c "SELECT * FROM organizations WHERE slug = 'test-org';"
```

If missing, run:
```bash
npx playwright test --global-setup=./tests/global-setup.ts
```

### Issue: "Clerk user not found" errors

**Solution:** Create test users in Clerk dashboard and update `.env.test` with their IDs.

### Issue: Database permission errors

**Solution:** Ensure your database user has TRUNCATE privileges:
```sql
GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Tests hang or timeout

**Solution:** Check that background jobs (Inngest) are running or mocked properly. Increase timeout:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(120000) // 2 minutes
  // ...
})
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Testing Guide](https://clerk.com/docs/testing)
- [Inngest Testing](https://www.inngest.com/docs/testing)

## ✅ Acceptance Criteria Met

This infrastructure satisfies all requirements from Issue #129:

- ✅ Test data seed functions for all entities
- ✅ Playwright global setup seeds database
- ✅ Playwright global teardown cleans up
- ✅ Reusable fixtures for common scenarios
- ✅ Authentication helpers work in E2E context
- ✅ Tests can create realistic, varied data
- ✅ Setup/teardown runs without errors
- ✅ Idempotent design (can re-run safely)
