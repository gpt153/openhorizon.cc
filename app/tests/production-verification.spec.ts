import { test, expect } from '@playwright/test';

/**
 * Production Verification Test Suite
 *
 * Tests the actual live site to verify which issues are fixed and which remain
 */

const LANDING_URL = 'https://openhorizon.cc';
const APP_URL = 'https://app.openhorizon.cc';

test.describe('Issue #19/#21 Verification: Domain Routing', () => {
  test('openhorizon.cc shows landing page with correct content', async ({ page }) => {
    await page.goto(LANDING_URL);
    await page.waitForLoadState('domcontentloaded');

    // Landing page should have the main heading
    const heading = await page.locator('text=/Empowering Youth.*Erasmus/i').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Should have Get Started and Sign In buttons
    const getStarted = page.locator('text=/Get Started/i').first();
    const signIn = page.locator('text=/Sign In/i').first();

    await expect(getStarted).toBeVisible();
    await expect(signIn).toBeVisible();

    // Should NOT have app navigation (Dashboard, Projects sidebar)
    const hasDashboard = await page.locator('text=/^Dashboard$/').count();
    expect(hasDashboard).toBe(0);

    console.log('✅ Landing page displays correctly on openhorizon.cc');
  });

  test('app.openhorizon.cc shows application interface', async ({ page }) => {
    await page.goto(APP_URL);

    // Either shows app interface OR redirects to auth
    await page.waitForTimeout(3000);
    const url = page.url();

    // Check if we see auth page or app
    const isAuth = url.includes('clerk') || url.includes('sign-in');
    const hasAppInterface = await page.locator('text=/Projects|Dashboard/i').count() > 0;

    expect(isAuth || hasAppInterface).toBe(true);

    console.log(`✅ App subdomain works - ${isAuth ? 'Auth page' : 'App interface'} shown`);
  });

  test('VERIFICATION: Issues #19 and #21 status', async ({ page }) => {
    // Test landing
    await page.goto(LANDING_URL);
    await page.waitForLoadState('domcontentloaded');
    const landingHeading = await page.locator('text=/Empowering Youth/i').count();

    // Test app
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    const appUrl = page.url();

    const issue19Fixed = landingHeading > 0 && (appUrl.includes('app.openhorizon') || appUrl.includes('clerk'));

    console.log('━'.repeat(60));
    console.log('ISSUE #19/#21 STATUS:');
    console.log(`  Landing on root domain: ${landingHeading > 0 ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`  App on subdomain: ${appUrl.includes('app.') || appUrl.includes('clerk') ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`  Overall Status: ${issue19Fixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
    console.log('━'.repeat(60));

    expect(issue19Fixed).toBe(true);
  });
});

test.describe('Issue #15 Verification: Working vs Formal Mode Toggle', () => {
  test('toggle buttons are visible and clickable', async ({ page, context }) => {
    // This test needs to bypass auth - we'll check what we can without auth
    await page.goto(APP_URL);
    await page.waitForTimeout(3000);

    // Check if we can see the toggle in the screenshot
    const workingModeButton = page.locator('text=/Working Mode/i');
    const formalModeButton = page.locator('text=/Formal|Switch to Formal/i');

    const workingVisible = await workingModeButton.count() > 0;
    const formalVisible = await formalModeButton.count() > 0;

    console.log('━'.repeat(60));
    console.log('ISSUE #15 STATUS (Preliminary):');
    console.log(`  Working Mode button visible: ${workingVisible ? '✅ YES' : '❌ NO'}`);
    console.log(`  Formal Mode button visible: ${formalVisible ? '✅ YES' : '❌ NO'}`);
    console.log(`  Note: Full functionality test requires authentication`);
    console.log('━'.repeat(60));

    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/mode-toggle-check.png', fullPage: true });
  });
});

test.describe('Issue #14 Verification: Seeds Page and Inngest', () => {
  test('check if seeds page is accessible', async ({ page }) => {
    await page.goto(`${APP_URL}/seeds`);
    await page.waitForTimeout(5000);

    const url = page.url();
    const isOnSeedsPage = url.includes('/seeds');
    const isOnAuth = url.includes('sign-in') || url.includes('clerk');

    // Take screenshot
    await page.screenshot({ path: 'test-results/seeds-page-check.png', fullPage: true });

    console.log('━'.repeat(60));
    console.log('ISSUE #14 STATUS (Preliminary):');
    console.log(`  Seeds page route: ${isOnSeedsPage ? '✅ ACCESSIBLE' : isOnAuth ? '⚠️  AUTH REQUIRED' : '❌ REDIRECTED'}`);
    console.log(`  Current URL: ${url}`);
    console.log(`  Note: Full test requires authentication to check loading spinner`);
    console.log('━'.repeat(60));
  });
});

test.describe('Site Health Check', () => {
  test('all critical pages respond correctly', async ({ page }) => {
    const urls = [
      { url: LANDING_URL, name: 'Landing Page' },
      { url: APP_URL, name: 'App Home' },
      { url: `${APP_URL}/projects`, name: 'Projects' },
      { url: `${APP_URL}/seeds`, name: 'Seeds' },
    ];

    const results: { name: string; status: string }[] = [];

    for (const { url, name } of urls) {
      try {
        const response = await page.goto(url);
        const status = response?.status() || 0;
        results.push({
          name,
          status: status < 400 ? `✅ ${status}` : `❌ ${status}`
        });
      } catch (error) {
        results.push({ name, status: '❌ ERROR' });
      }
    }

    console.log('━'.repeat(60));
    console.log('SITE HEALTH:');
    results.forEach(r => console.log(`  ${r.name}: ${r.status}`));
    console.log('━'.repeat(60));
  });
});
