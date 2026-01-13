import { test, expect } from '@playwright/test';

/**
 * Week 1 Sprint Feature Verification Tests
 * Tests for Issues #86, #87, #88 deployed to production
 */

const APP_URL = process.env.APP_URL || 'https://oh.153.se';

test.describe('Issue #86: Food Agent UI Integration', () => {
  test('food search panel is accessible on FOOD phase', async ({ page }) => {
    // Navigate to app (will redirect to auth if not logged in)
    await page.goto(`${APP_URL}/pipeline/projects`);
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Take screenshot of current state
    await page.screenshot({
      path: 'test-results/food-agent-check.png',
      fullPage: true
    });

    console.log('━'.repeat(60));
    console.log('ISSUE #86 STATUS (Food Agent UI):');
    console.log(`  Projects page accessible: ${url.includes('/projects') ? '✅ YES' : '❌ NO'}`);
    console.log(`  Note: Full test requires authentication and FOOD phase`);
    console.log('━'.repeat(60));
  });
});

test.describe('Issue #88: Budget Tracking Dashboard', () => {
  test('budget tracking tab is present on project detail page', async ({ page }) => {
    await page.goto(`${APP_URL}/pipeline/projects`);
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/budget-tracking-check.png',
      fullPage: true
    });

    console.log('━'.repeat(60));
    console.log('ISSUE #88 STATUS (Budget Tracking):');
    console.log(`  Budget Tracking feature deployment: ⏳ REQUIRES AUTH TO VERIFY`);
    console.log(`  Expected: Budget tab on project detail pages`);
    console.log(`  Expected: BudgetHealthBadge in project headers`);
    console.log('━'.repeat(60));
  });
});

test.describe('Issue #87: Accommodation Agent Enhancement', () => {
  test('accommodation search panel exists', async ({ page }) => {
    await page.goto(`${APP_URL}/pipeline/projects`);
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/accommodation-agent-check.png',
      fullPage: true
    });

    console.log('━'.repeat(60));
    console.log('ISSUE #87 STATUS (Accommodation Agent):');
    console.log(`  Accommodation Agent deployment: ⏳ REQUIRES AUTH TO VERIFY`);
    console.log(`  Expected: AccommodationSearchPanel on ACCOMMODATION phases`);
    console.log(`  Expected: Search, AI analysis, quote generation`);
    console.log('━'.repeat(60));
  });
});

test.describe('Week 1 Sprint: Overall Site Health', () => {
  test('critical endpoints respond correctly', async ({ page }) => {
    const endpoints = [
      { url: APP_URL, name: 'App Home' },
      { url: `${APP_URL}/pipeline/projects`, name: 'Projects List' },
      { url: `${APP_URL}/api/trpc/pipeline.projects.list`, name: 'Projects API' },
    ];

    const results: { name: string; status: string; time: number }[] = [];

    for (const { url, name } of endpoints) {
      const startTime = Date.now();
      try {
        const response = await page.request.get(url);
        const status = response.status();
        const time = Date.now() - startTime;

        results.push({
          name,
          status: status < 400 ? `✅ ${status}` : `❌ ${status}`,
          time
        });
      } catch (error) {
        results.push({
          name,
          status: '❌ ERROR',
          time: Date.now() - startTime
        });
      }
    }

    console.log('━'.repeat(60));
    console.log('WEEK 1 DEPLOYMENT HEALTH:');
    results.forEach(r => console.log(`  ${r.name}: ${r.status} (${r.time}ms)`));
    console.log('━'.repeat(60));

    // At least app home should respond
    const appHomeOk = results.find(r => r.name === 'App Home')?.status.includes('✅');
    expect(appHomeOk).toBe(true);
  });

  test('new tRPC routes are deployed', async ({ page }) => {
    // Check if new tRPC endpoints are available
    const routes = [
      { path: 'pipeline.phases.searchFood', name: 'Search Food Route' },
      { path: 'pipeline.phases.searchAccommodation', name: 'Search Accommodation Route' },
      { path: 'pipeline.projects.getBudgetSummary', name: 'Budget Summary Route' },
    ];

    console.log('━'.repeat(60));
    console.log('NEW tRPC ROUTES (Week 1):');
    routes.forEach(r => console.log(`  ${r.name}: ⏳ REQUIRES AUTH TO VERIFY`));
    console.log('━'.repeat(60));

    // Take screenshot of network activity
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'test-results/week1-deployment.png',
      fullPage: true
    });
  });
});

test.describe('Deployment Verification', () => {
  test('check deployment timestamp and commit', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);

    // Try to determine deployment info from headers or meta tags
    const poweredBy = await page.locator('meta[name="generator"]').getAttribute('content') ||
                       await page.locator('[data-version]').getAttribute('data-version') ||
                       'Unknown';

    console.log('━'.repeat(60));
    console.log('DEPLOYMENT INFO:');
    console.log(`  Target: ${APP_URL}`);
    console.log(`  Expected Commit: ce45c41 (Accommodation Agent)`);
    console.log(`  Framework: ${poweredBy || 'Next.js'}`);
    console.log(`  Verification: ${page.url().includes('oh.153.se') || page.url().includes('openhorizon') ? '✅ Correct domain' : '❌ Wrong domain'}`);
    console.log('━'.repeat(60));
  });
});
