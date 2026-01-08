# Testing Guide

This document explains how to run Playwright E2E tests for OpenHorizon.

## Problem & Solution

### The Issue
Playwright tests require Chromium browser, which needs specific system libraries. Our production Docker image uses `node:20-alpine` (minimal, no system libraries), but Playwright needs a full Debian/Ubuntu environment.

### The Solution
We maintain **two separate Docker images**:
1. **Production** (`Dockerfile`) - Alpine-based, minimal, for deployment
2. **Testing** (`Dockerfile.test`) - Debian-based, includes all Playwright dependencies

## Running Tests Locally

### Option 1: Docker (Recommended - No System Dependencies Required)

This is the **easiest and most reliable** method. No need to install system libraries on your host machine.

```bash
# Build and run tests in Docker
npm run test:docker

# Or using docker-compose directly
docker-compose -f docker-compose.test.yml up --build
```

**Advantages:**
- ✅ No system dependencies needed on your machine
- ✅ Identical environment to CI
- ✅ Works on any OS (Windows, Mac, Linux)
- ✅ Isolated from your host system

### Option 2: Direct Execution (Requires System Dependencies)

If you have all Playwright dependencies installed on your system:

```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed
```

**Requirements:**
- Linux/Mac with full system libraries
- All dependencies from `Dockerfile.test` installed
- NOT recommended on Alpine-based systems

### Option 3: Install System Dependencies (Debian/Ubuntu only)

If you're on Debian/Ubuntu and want to run tests directly:

```bash
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

## Test Files

- `tests/project-features.spec.ts` - Main E2E tests for project features
- `playwright.config.ts` - Playwright configuration
- `test-results/` - Test execution results (gitignored)
- `playwright-report/` - HTML test reports (gitignored)

## Writing Tests

Add new tests to `tests/` directory. See [Playwright docs](https://playwright.dev/docs/intro) for syntax.

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
Check if the application is running and accessible at the configured baseURL in `playwright.config.ts`.

### "Browser not installed"
Run: `npx playwright install chromium`

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
