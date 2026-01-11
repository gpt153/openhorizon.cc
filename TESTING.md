# Testing Guide

This document explains how to run Playwright E2E tests for OpenHorizon (monorepo structure).

## Problem & Solution

### The Issue
Playwright tests require Chromium browser, which needs specific system libraries. Our production Docker image uses `node:20-alpine` (minimal, no system libraries), but Playwright needs a full Debian/Ubuntu environment.

### The Solution
We maintain **two separate Docker images**:
1. **Production** (`Dockerfile`) - Alpine-based, minimal, for deployment
2. **Testing** (`Dockerfile.test`) - Debian-based, includes all Playwright dependencies

## Monorepo Structure

This is a monorepo with two workspaces:
- `landing/` - Landing page website
- `app/` - Main application (contains Playwright tests)

**Tests are located in the `app` workspace.**

## Running Tests Locally

### Option 1: Docker (Recommended - No System Dependencies Required)

This is the **easiest and most reliable** method. No need to install system libraries on your host machine.

```bash
# From project root
npm run test:docker

# Or using docker-compose directly
docker-compose -f docker-compose.test.yml up --build

# From app workspace
cd app && npm run test:docker
```

**Advantages:**
- ✅ No system dependencies needed on your machine
- ✅ Identical environment to CI
- ✅ Works on any OS (Windows, Mac, Linux)
- ✅ Isolated from your host system

### Option 2: Direct Execution (Requires System Dependencies)

If you have all Playwright dependencies installed on your system:

```bash
# From app workspace
cd app

# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Or from project root
npm test
npm run test:ui
```

**Requirements:**
- Linux/Mac with full system libraries
- All dependencies from `Dockerfile.test` installed
- NOT recommended on Alpine-based systems

### Option 3: Install System Dependencies (Debian/Ubuntu only)

If you're on Debian/Ubuntu and want to run tests directly:

```bash
# Navigate to app workspace
cd app

# Install Playwright system dependencies
npx playwright install-deps chromium

# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test
```

## CI/CD

Tests run automatically in GitHub Actions on every push/PR using the official Playwright Docker image.

See: `.github/workflows/playwright.yml`

The workflow:
1. Installs root dependencies
2. Installs app workspace dependencies
3. Runs tests from the app workspace
4. Uploads test results and screenshots

## Test Files

This is a monorepo with tests in the `app` workspace:

- `app/tests/*.spec.ts` - Production verification E2E tests (test against production URLs)
- `app/e2e/*.spec.ts` - Local development E2E tests (test against localhost)
- `app/playwright.config.ts` - Playwright configuration
- `app/test-results/` - Test execution results (gitignored)
- `app/playwright-report/` - HTML test reports (gitignored)

## Writing Tests

Add new tests to `app/tests/` or `app/e2e/` directory. See [Playwright docs](https://playwright.dev/docs/intro) for syntax.

Example:
```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Expected Title/);
});
```

## Troubleshooting

### Tests fail with "libnspr4.so not found"
You're trying to run tests without system dependencies. Use **Docker method** instead (Option 1).

### Tests time out
Check if the application is running and accessible at the configured baseURL in `app/playwright.config.ts`.

### "Browser not installed"
Run: `npx playwright install chromium`

### Working directory issues
Make sure you're either:
- Running from project root with `npm run test:docker`
- Or running from `app/` workspace with `cd app && npm test`

## Architecture Decision

**Why two Dockerfiles?**

We use Alpine for production because:
- Smaller image size (~50MB vs ~200MB)
- Faster deployments
- Better security (minimal attack surface)
- We only need Node.js runtime, not browser testing

We use Debian for testing because:
- Playwright requires full system libraries
- Easier to install dependencies
- Better compatibility with browser binaries

This separation keeps production lean while enabling comprehensive testing.

## Quick Reference

```bash
# Run tests in Docker (recommended)
npm run test:docker

# Run tests locally from app workspace (requires deps)
cd app && npm test

# Interactive test UI
cd app && npm run test:ui

# See browser while testing
cd app && npm run test:headed

# Test against production
cd app && npm run test:prod

# Install Playwright browsers
cd app && npx playwright install chromium

# Install system deps (Debian/Ubuntu)
cd app && npx playwright install-deps chromium
```
