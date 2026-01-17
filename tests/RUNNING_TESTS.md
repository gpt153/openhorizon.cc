# Running E2E Tests - Complete Guide

This guide provides step-by-step instructions for running the complete E2E test suite for OpenHorizon.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [Debugging Failed Tests](#debugging-failed-tests)
- [CI/CD Configuration](#cicd-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 20 or higher
- **PostgreSQL** 15 or higher
- **npm** (comes with Node.js)
- **Clerk Account** (test mode)
- **Inngest CLI** (for background job tests)

### Check Prerequisites

```bash
# Check Node.js version
node --version  # Should be v20.x or higher

# Check PostgreSQL
psql --version  # Should be 15.x or higher

# Check npm
npm --version
```

## Quick Start

### 1. Install Dependencies

```bash
# From the root of the repository
cd app
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 2. Set Up Test Database

```bash
# Create test database
createdb openhorizon_test

# Run migrations
DATABASE_URL="postgresql://localhost/openhorizon_test" npx prisma migrate deploy
```

### 3. Configure Environment

```bash
# Copy example file
cp ../.env.test.example ../.env.test

# Edit .env.test and fill in required values
# See "Environment Setup" section below for details
```

### 4. Run Tests

```bash
# Run all E2E tests
npm test

# Or run specific test suite
npx playwright test tests/e2e/seed-creation.spec.ts
```

## Environment Setup

### Required Environment Variables

Create a `.env.test` file in the repository root with the following variables:

#### Database Configuration

```env
# Test database (MUST be different from production!)
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/openhorizon_test"

# Application URL for tests
BASE_URL="http://localhost:3000"
```

#### Clerk Authentication

```env
# Clerk test mode keys
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

#### Test User Credentials

**IMPORTANT:** These users must be created manually in Clerk Dashboard (test mode):

```env
# Admin user
TEST_ADMIN_USER_ID="user_xxx"
TEST_ADMIN_EMAIL="admin@test.openhorizon.cc"
TEST_ADMIN_PASSWORD="TestPassword123!"

# Staff user
TEST_STAFF_USER_ID="user_yyy"
TEST_STAFF_EMAIL="staff@test.openhorizon.cc"
TEST_STAFF_PASSWORD="TestPassword123!"

# Participant user
TEST_PARTICIPANT_USER_ID="user_zzz"
TEST_PARTICIPANT_EMAIL="participant@test.openhorizon.cc"
TEST_PARTICIPANT_PASSWORD="TestPassword123!"
```

### Creating Clerk Test Users

1. **Go to Clerk Dashboard** → Switch to Test Mode
2. **Navigate to Users** → Click "Create User"
3. **Create three users:**
   - Email: `admin@test.openhorizon.cc`, Password: `TestPassword123!`
   - Email: `staff@test.openhorizon.cc`, Password: `TestPassword123!`
   - Email: `participant@test.openhorizon.cc`, Password: `TestPassword123!`
4. **Copy User IDs** from Clerk and paste into `.env.test`

### Starting Required Services

#### Start Development Server

```bash
# Terminal 1: Start Next.js dev server
cd app
npm run dev

# Server will start on http://localhost:3000
```

#### Start Inngest Dev Server (for background job tests)

```bash
# Terminal 2: Start Inngest
npx inngest-cli dev

# Inngest will start on http://localhost:8288
```

**Note:** Budget planning tests require Inngest to be running. Other tests will work without it.

## Running Tests

### Run All Tests

```bash
cd app

# Run all E2E tests (serial execution)
npm test

# Or explicitly
npx playwright test tests/e2e/
```

### Run Specific Test Suite

```bash
# Seed creation tests
npx playwright test tests/e2e/seed-creation.spec.ts

# Seed elaboration tests
npx playwright test tests/e2e/seed-elaboration.spec.ts

# Project generation tests
npx playwright test tests/e2e/project-generation.spec.ts

# Programme builder tests
npx playwright test tests/e2e/programme-builder.spec.ts

# Budget planning tests (requires Inngest running!)
npx playwright test tests/e2e/budget-planning.spec.ts

# Document export tests
npx playwright test tests/e2e/document-export.spec.ts

# Multi-tenant isolation tests
npx playwright test tests/e2e/multi-tenant.spec.ts
```

### Run with UI Mode (Recommended for Development)

```bash
# Interactive UI for debugging
npx playwright test --ui
```

### Run in Headed Mode (See Browser)

```bash
# Watch tests run in browser
npx playwright test --headed

# Specific test in headed mode
npx playwright test tests/e2e/seed-creation.spec.ts --headed
```

### Run with Specific Reporter

```bash
# Generate HTML report
npx playwright test --reporter=html

# View HTML report
npx playwright show-report

# JSON reporter
npx playwright test --reporter=json

# Multiple reporters
npx playwright test --reporter=html,json
```

## Debugging Failed Tests

### View Test Results

After running tests, results are saved to:
- **HTML Report:** `playwright-report/`
- **Screenshots:** `test-results/` (only on failures)
- **Videos:** `test-results/` (only on failures)
- **Traces:** `test-results/` (on first retry)

### View HTML Report

```bash
npx playwright show-report
```

### View Trace Files

```bash
# Install Playwright's trace viewer
npx playwright show-trace test-results/<test-name>/trace.zip
```

### Debug Specific Test

```bash
# Run single test with debug mode
npx playwright test tests/e2e/seed-creation.spec.ts --debug

# Run in headed mode with slow mo
npx playwright test tests/e2e/seed-creation.spec.ts --headed --slow-mo=1000
```

### Enable Verbose Logging

```bash
# Set DEBUG environment variable
DEBUG=1 npx playwright test
```

### Common Debugging Commands

```bash
# List all tests
npx playwright test --list

# Run tests matching pattern
npx playwright test --grep "should generate seeds"

# Run last failed tests only
npx playwright test --last-failed

# Update snapshots (if using visual regression)
npx playwright test --update-snapshots
```

## CI/CD Configuration

### Environment Variables for CI

In your CI environment, set these environment variables:

```bash
TEST_DATABASE_URL="postgresql://user:password@postgres:5432/openhorizon_test"
BASE_URL="http://localhost:3000"
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
TEST_ADMIN_USER_ID="user_xxx"
TEST_STAFF_USER_ID="user_yyy"
TEST_PARTICIPANT_USER_ID="user_zzz"
TEST_ADMIN_EMAIL="admin@test.openhorizon.cc"
TEST_ADMIN_PASSWORD="TestPassword123!"
TEST_STAFF_EMAIL="staff@test.openhorizon.cc"
TEST_STAFF_PASSWORD="TestPassword123!"
TEST_PARTICIPANT_EMAIL="participant@test.openhorizon.cc"
TEST_PARTICIPANT_PASSWORD="TestPassword123!"
```

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: openhorizon_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd app
          npm install

      - name: Install Playwright Browsers
        run: |
          cd app
          npx playwright install chromium --with-deps

      - name: Run database migrations
        run: |
          cd app
          DATABASE_URL="postgresql://test:test@localhost:5432/openhorizon_test" npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/openhorizon_test

      - name: Run E2E tests
        run: |
          cd app
          npm test
        env:
          TEST_DATABASE_URL: postgresql://test:test@localhost:5432/openhorizon_test
          BASE_URL: http://localhost:3000
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
          TEST_ADMIN_USER_ID: ${{ secrets.TEST_ADMIN_USER_ID }}
          TEST_STAFF_USER_ID: ${{ secrets.TEST_STAFF_USER_ID }}
          TEST_PARTICIPANT_USER_ID: ${{ secrets.TEST_PARTICIPANT_USER_ID }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: app/playwright-report/
          retention-days: 30
```

### Docker Compose for CI

Create `docker-compose.test.yml`:

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5

  inngest:
    image: inngest/inngest:latest
    ports:
      - "8288:8288"
```

Run with:

```bash
# Start services
docker-compose -f docker-compose.test.yml up -d

# Wait for health checks
sleep 10

# Run tests
cd app
TEST_DATABASE_URL="postgresql://test:test@localhost:5433/openhorizon_test" npm test

# Stop services
docker-compose -f docker-compose.test.yml down
```

## Troubleshooting

### Issue: "Cannot find module '@playwright/test'"

**Solution:**
```bash
cd app
npm install
npx playwright install
```

### Issue: "organization not found" errors

**Cause:** Global setup didn't seed the database properly.

**Solution:**
```bash
# Run global setup manually
cd app
npx playwright test --global-setup=./tests/global-setup.ts

# Verify test organization exists
psql openhorizon_test -c "SELECT * FROM organizations WHERE slug = 'test-org';"
```

### Issue: "Clerk user not found" errors

**Cause:** Test users not created in Clerk or incorrect user IDs in `.env.test`.

**Solution:**
1. Go to Clerk Dashboard (test mode)
2. Create users: `admin@test.openhorizon.cc`, `staff@test.openhorizon.cc`, `participant@test.openhorizon.cc`
3. Copy user IDs to `.env.test`

### Issue: Budget planning tests timeout

**Cause:** Inngest dev server not running.

**Solution:**
```bash
# Start Inngest in separate terminal
npx inngest-cli dev

# Or skip background job tests
npx playwright test tests/e2e/ --grep-invert "vendor search"
```

### Issue: Database permission errors

**Cause:** Database user lacks TRUNCATE privileges.

**Solution:**
```sql
-- Connect to database as superuser
psql openhorizon_test

-- Grant privileges
GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Tests hang or timeout

**Cause:** Dev server not running or slow AI operations.

**Solution:**
```bash
# Start dev server
cd app
npm run dev

# Increase timeout for slow tests
npx playwright test --timeout=120000  # 2 minutes
```

### Issue: Flaky tests (intermittent failures)

**Cause:** Timing issues, network delays, or database race conditions.

**Solution:**
- Tests run serially (`workers: 1`) to avoid database conflicts
- Use `waitFor()` instead of fixed timeouts
- Increase timeout for specific tests if needed
- Check network connectivity
- Verify database is not under load

### Issue: Port already in use

**Cause:** Previous dev server or Inngest still running.

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 8288
lsof -ti:8288 | xargs kill -9

# Or use different ports
PORT=3001 npm run dev  # Dev server
PORT=8289 npx inngest-cli dev  # Inngest
```

## Performance Tips

### Speed Up Test Execution

1. **Run specific test suites** instead of full suite during development
2. **Use headed mode** only when needed (headless is faster)
3. **Disable video/screenshots** for faster runs:
   ```typescript
   // In playwright.config.ts
   use: {
     video: 'off',
     screenshot: 'off',
   }
   ```
4. **Skip slow tests** during development:
   ```bash
   npx playwright test --grep-invert "slow"
   ```

### Test Parallelization

**Note:** Tests run serially by default (`workers: 1`) to avoid database conflicts. Do NOT enable parallel execution without proper database isolation strategy.

## Best Practices

1. **Always run tests from the `app/` directory**
2. **Keep dev server and Inngest running** in separate terminals
3. **Run global setup** after database schema changes
4. **Use UI mode** for debugging during development
5. **Check HTML report** after test runs
6. **Commit .env.test.example** but never `.env.test`
7. **Run full suite** before creating pull requests
8. **Keep test database separate** from development database

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Infrastructure README](./README.md)
- [E2E Test Suite Documentation](./e2e/README.md)
- [Issue #156](https://github.com/gpt153/openhorizon.cc/issues/156)

---

**Last Updated:** 2026-01-17
**Maintainer:** SCAR AI Agent
**Status:** Ready for Use
