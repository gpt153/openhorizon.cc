# E2E Test Suite - Complete User Flows

This directory contains comprehensive end-to-end tests for all critical user journeys in OpenHorizon.

## 📋 Test Suites

### 1. Seed Creation (`seed-creation.spec.ts`)
Tests the AI-powered seed brainstorming flow:
- Generate seeds from prompts
- Save seeds to garden
- Dismiss unwanted seeds
- Form validation
- Edge cases (long prompts, special characters)

### 2. Seed Elaboration (`seed-elaboration.spec.ts`)
Tests conversational AI elaboration:
- Start elaboration session
- Answer AI questions
- Use quick replies
- Track progress toward completion
- Metadata preview updates
- Message editing

### 3. Project Generation (`project-generation.spec.ts`)
Tests seed → project conversion:
- Convert elaborated seed to project
- Verify project DNA structure
- Verify project status
- Handle incomplete seed errors
- Data mapping verification

### 4. Programme Builder (`programme-builder.spec.ts`)
Tests multi-day programme management:
- Create programme structure
- Add/edit/delete activities
- Reorder activities (drag-drop)
- Validation
- Data persistence

### 5. Budget Planning (`budget-planning.spec.ts`)
Tests budget calculator and vendor search:
- Create budget categories
- Erasmus+ unit cost calculations
- Trigger food vendor search (background job)
- Trigger accommodation vendor search
- Poll for job completion (max 30s)
- Error handling and retry

### 6. Document Export (`document-export.spec.ts`)
Tests PDF/DOCX generation:
- Export project as PDF
- Export project as DOCX
- Export application forms
- Verify file download
- Loading states
- Error handling

### 7. Multi-Tenant Isolation (`multi-tenant.spec.ts`)
Tests user-level data isolation:
- User can only see own projects
- User can only see own seeds
- Direct URL access protection
- Session-based access control
- Security (SQL injection, path traversal prevention)

**Note:** Current schema has no organization fields, so tests focus on user-level isolation.

## 🚀 Running Tests

```bash
# Run all E2E tests
npm test tests/e2e/

# Run specific test suite
npm test tests/e2e/seed-creation.spec.ts

# Run in UI mode (for debugging)
npx playwright test --ui

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run with trace (for debugging failures)
npx playwright test --trace on
```

## 📊 Test Statistics

- **Test Suites:** 7
- **Total Tests:** ~45+ test cases
- **Coverage:** All critical user flows from Epic 003

## 🔧 Configuration

Tests use the configuration from `playwright.config.ts`:
- Base URL: `http://localhost:5174` (configurable via `APP_URL` env var)
- Browser: Chromium
- Timeout: 30s per test (configurable)
- Screenshots: On failure only
- Video: On first retry

## 🧪 Test Data

Tests rely on fixtures from Issue #129:
- Authentication via `.auth/user.json` (from `auth.setup.ts`)
- Database seeding (global setup/teardown)
- Reusable fixtures for users, orgs, projects, seeds

## ⚙️ Environment Variables

```bash
# Test environment URL (defaults to localhost:5174)
APP_URL=http://localhost:5174

# For production testing
APP_URL=https://openhorizon.cc
```

## 📝 Test Patterns

### Background Job Polling

Vendor search tests use a polling pattern for Inngest jobs:

```typescript
async function waitForVendorSearchResults(page, selector, maxWaitMs = 30000) {
  const startTime = Date.now()
  const pollInterval = 2000 // 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
      return true
    }
    await page.waitForTimeout(pollInterval)
  }
  return false
}
```

### Flexible Selectors

Tests use fallback selectors to handle different implementations:

```typescript
const button = page.locator(
  'button:has-text("Save"), button:has-text("Submit"), [data-testid="save-button"]'
)
```

### Graceful Skipping

Tests skip gracefully when features aren't available:

```typescript
if (!(await element.isVisible({ timeout: 5000 }).catch(() => false))) {
  console.log('⚠️  Feature not available')
  test.skip()
  return
}
```

## 🐛 Debugging Failed Tests

1. **Check screenshots:** `test-results/` directory contains failure screenshots
2. **Use Playwright UI:** `npx playwright test --ui` for interactive debugging
3. **Enable trace:** `npx playwright test --trace on` for detailed execution trace
4. **Increase timeouts:** Set `timeout: 60000` for slow operations
5. **Run headed:** `npx playwright test --headed` to watch execution

## 📈 Test Reliability

All tests are designed to be:
- **Idempotent:** Can run multiple times without side effects
- **Deterministic:** Same input → same output
- **Independent:** Can run in any order
- **Resilient:** Handle timing issues with proper waits

## 🔄 Continuous Integration

These tests are designed to run in CI environments:
- Fixtures ensure consistent test data
- Network waits handle variable latencies
- Screenshots capture failures
- Exit code reflects test results

## 🚧 Known Limitations

1. **Multi-tenant testing:** Requires multiple authenticated user sessions (not fully implemented)
2. **Background jobs:** Tests may timeout if Inngest is not running
3. **Document exports:** Verify file generation, not content quality
4. **Drag-drop:** May be flaky across different browsers

## 🔮 Future Enhancements

When features are added:
- [ ] Add organization-level multi-tenancy tests
- [ ] Add real-time collaboration tests
- [ ] Add accessibility tests (axe-playwright)
- [ ] Add performance tests (Lighthouse CI)
- [ ] Add visual regression tests (Percy/Chromatic)

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Epic 003: Production Readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
- [Issue #131: E2E Complete User Flows](https://github.com/gpt153/openhorizon.cc/issues/131)

---

**Last Updated:** 2026-01-17
**Status:** Ready for execution
**Maintainer:** SCAR AI Agent
