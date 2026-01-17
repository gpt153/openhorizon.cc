# E2E Test Infrastructure Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
  - [1. Database Setup](#1-database-setup)
  - [2. Clerk Test Users](#2-clerk-test-users)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Prisma Client Generation](#4-prisma-client-generation)
- [Running Tests](#running-tests)
- [Test Infrastructure Components](#test-infrastructure-components)
- [Fixtures Reference](#fixtures-reference)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

This directory contains the E2E (End-to-End) test infrastructure for Open Horizon, built with [Playwright](https://playwright.dev/).

**Key Features:**
- ✅ Automated database seeding before tests
- ✅ Authentication state management with Clerk
- ✅ Reusable test fixtures for users, projects, seeds, and phases
- ✅ Global setup/teardown for test isolation
- ✅ Comprehensive test data scenarios

---

## Quick Start

```bash
# 1. Copy environment template
cp .env.test.local.example .env.test.local

# 2. Edit .env.test.local with your database URL and Clerk user IDs

# 3. Generate Prisma client
cd app && npx prisma generate && cd ..

# 4. Run tests
npx playwright test
```

---

## Setup Instructions

### 1. Database Setup

#### Create Test Database

```bash
# Create a PostgreSQL test database
createdb openhorizon_test

# Or using psql:
psql -U postgres -c "CREATE DATABASE openhorizon_test;"
```

#### Configure Database URL

Add to `.env.test.local`:
```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/openhorizon_test"
```

**⚠️ Important:**
- Use a **separate database** for tests
- Never point tests at your development or production database
- The test database will be **reset** before each test run

### 2. Clerk Test Users

The test infrastructure requires **3 test users** to be created in your Clerk dashboard.

#### Step-by-Step:

1. **Go to Clerk Dashboard** → Users → Create User

2. **Create these 3 users:**

   | Role | Email | Password |
   |------|-------|----------|
   | Admin | `admin@test.openhorizon.cc` | `TestPassword123!` |
   | Staff | `staff@test.openhorizon.cc` | `TestPassword123!` |
   | Participant | `participant@test.openhorizon.cc` | `TestPassword123!` |

3. **Copy User IDs:**
   - After creating each user, copy their Clerk User ID (format: `user_xxxxxxxxxxxxxxxxxxxxx`)

4. **Add IDs to `.env.test.local`:**
   ```env
   TEST_ADMIN_USER_ID="user_xxxxxxxxxxxxxxxxxxxxx"
   TEST_STAFF_USER_ID="user_yyyyyyyyyyyyyyyyyyyyyyy"
   TEST_PARTICIPANT_USER_ID="user_zzzzzzzzzzzzzzzzzzzzz"
   ```

### 3. Environment Configuration

Copy the example file and fill in your values:

```bash
cp .env.test.local.example .env.test.local
```

See `.env.test.local.example` for all available options.

### 4. Prisma Client Generation

Ensure Prisma Client is generated:

```bash
cd app
npm install
npx prisma generate
```

---

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/seed-creation.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug a test
npx playwright test tests/e2e/seed-creation.spec.ts --debug

# Show test report
npx playwright show-report
```

---

## Test Infrastructure Components

### Directory Structure

```
tests/
├── helpers/
│   ├── database.ts         # Database utilities
│   └── auth.ts             # Authentication utilities
├── fixtures/
│   ├── users.ts            # User & organization fixtures
│   ├── projects.ts         # Project fixtures
│   ├── seeds.ts            # Seed fixtures
│   ├── phases.ts           # Programme & phase fixtures
│   └── index.ts            # Barrel export
├── e2e/                    # E2E test specs
├── global-setup.ts         # Runs once before all tests
├── global-teardown.ts      # Runs once after all tests
└── README.md               # This file
```

### Global Setup (`global-setup.ts`)

Runs **once** before all tests:
1. ✅ Waits for database
2. ✅ Connects to database
3. ✅ Runs migrations
4. ✅ Resets & seeds database
5. ✅ Authenticates test users
6. ✅ Saves auth state files

### Helpers

#### `database.ts`
- `getTestPrismaClient()` - Get Prisma client
- `resetDatabase()` - Clear all data
- `seedDatabase()` - Populate test data
- `migrateDatabase()` - Run migrations

#### `auth.ts`
- `signInAsAdmin(page)` - Sign in as admin
- `signInAsStaff(page)` - Sign in as staff
- `signInAsParticipant(page)` - Sign in as participant
- `saveAuthState(page, path)` - Save auth state

---

## Fixtures Reference

### Users & Organizations (`users.ts`)

```typescript
import { createTestOrganization, TEST_USERS } from '../fixtures/users'

const org = await createTestOrganization(prisma, {
  name: 'Test Org',
  slug: 'test-org',
})

// Access predefined users
const adminId = TEST_USERS.admin.id
```

### Projects (`projects.ts`)

```typescript
import { createTestProject, PROJECT_SCENARIOS } from '../fixtures/projects'

const project = await createTestProject(prisma, orgId, 'DRAFT', {
  title: 'My Test Project',
})
```

### Seeds (`seeds.ts`)

```typescript
import { createTestSeed } from '../fixtures/seeds'

const seed = await createTestSeed(prisma, orgId, {
  title: 'Test Seed',
  description: 'A test project idea',
})
```

### Programmes & Phases (`phases.ts`)

```typescript
import { createTestProgramme } from '../fixtures/phases'

const programme = await createTestProgramme(prisma, orgId, projectId, {
  name: 'Test Programme',
  status: 'DRAFT',
})
```

---

## Writing Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test'

test('my feature works', async ({ page }) => {
  await page.goto('/my-page')
  await page.click('button:has-text("Submit")')
  await expect(page.locator('.success')).toBeVisible()
})
```

### Using Pre-Authenticated State

```typescript
test.use({ storageState: '.auth/admin-user.json' })

test('admin dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  // Already authenticated!
})
```

### Using Fixtures

```typescript
import { getTestPrismaClient } from './helpers/database'
import { createTestSeed } from './fixtures/seeds'

test('displays seeds', async ({ page }) => {
  const prisma = getTestPrismaClient()
  const org = await prisma.organization.findFirst({ where: { slug: 'test-org' } })

  await createTestSeed(prisma, org.id, {
    title: 'Test Seed',
    isSaved: true,
  })

  await page.goto('/seeds')
  await expect(page.locator('text=Test Seed')).toBeVisible()
})
```

---

## Troubleshooting

### "Database URL not configured"

```bash
cp .env.test.local.example .env.test.local
# Edit .env.test.local with your database URL
```

### "@prisma/client not found"

```bash
cd app && npm install && npx prisma generate
```

### "Safety check: Database URL must contain 'test'"

Make sure your database URL contains "test":
```env
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/openhorizon_test"
```

### Authentication Fails

1. Verify test users exist in Clerk Dashboard
2. Copy correct User IDs (not emails!)
3. Update `.env.test.local`

---

## Best Practices

### Test Isolation

✅ Use unique data per test
```typescript
const title = `Test ${Date.now()}`
```

❌ Don't rely on shared state

### Selectors

✅ Use semantic selectors
```typescript
await page.click('button:has-text("Submit")')
```

❌ Don't use fragile CSS
```typescript
await page.click('.btn.mt-4.px-6') // Breaks easily
```

### Waiting

✅ Use built-in waiting
```typescript
await expect(page.locator('.success')).toBeVisible({ timeout: 5000 })
```

❌ Don't use arbitrary timeouts
```typescript
await page.waitForTimeout(3000) // Slow and unreliable
```

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Clerk Testing Guide](https://clerk.com/docs/testing/overview)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Last Updated:** 2026-01-17
**Maintained by:** Open Horizon Team
