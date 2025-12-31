import { test, expect } from '@playwright/test';

/**
 * Critical Issues Test Suite
 *
 * This suite tests all open critical issues:
 * - Issue #14: Seeds page loading and Inngest integration
 * - Issue #15: Working vs Formal mode toggle
 * - Issue #19/21: Domain routing (landing vs app)
 */

// Test against production site
const PRODUCTION_URL = 'https://openhorizon.cc';
const APP_URL = 'https://app.openhorizon.cc';

test.describe('Domain Routing - Issues #19 and #21', () => {
  test('openhorizon.cc should show landing page, not app', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Landing page should NOT have app-specific elements
    // Check for landing page indicators (adjust based on actual landing page)
    const hasSignInButton = await page.locator('text=/sign in/i').count() > 0;
    const hasProjectsPage = await page.locator('text=/projects/i').count() > 0;

    // If we see "Projects" or "Sign In" in the main nav, we're seeing the app, not landing
    // Landing page should have different content
    expect(hasProjectsPage).toBe(false);

    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/landing-page.png', fullPage: true });
  });

  test('app.openhorizon.cc should show the application', async ({ page }) => {
    await page.goto(APP_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // App should have authentication or redirect to sign in
    // Check for Clerk auth elements or app interface
    const url = page.url();

    // Should be on app subdomain or auth provider
    expect(url).toMatch(/app\.openhorizon\.cc|accounts\.clerk|sign-in/);

    await page.screenshot({ path: 'test-results/app-page.png', fullPage: true });
  });
});

test.describe('Seeds Page - Issue #14', () => {
  test.skip('seeds page should load without infinite spinner', async ({ page, context }) => {
    // This test requires authentication
    // Skip for now - will need to add auth setup

    await page.goto(`${APP_URL}/seeds`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that we're not stuck in loading state
    // Look for loading spinner or skeleton
    const hasLoadingSpinner = await page.locator('[data-loading="true"]').count();
    const hasInfiniteSpinner = await page.locator('.animate-spin').count();

    // Wait a reasonable amount of time
    await page.waitForTimeout(5000);

    // After 5 seconds, there should be content, not just spinner
    const hasContent = await page.locator('text=/seed/i').count() > 0;

    expect(hasContent).toBe(true);
    expect(hasLoadingSpinner).toBe(0);

    await page.screenshot({ path: 'test-results/seeds-page.png', fullPage: true });
  });
});

test.describe('Working vs Formal Mode Toggle - Issue #15', () => {
  test.skip('toggle should switch between working and formal modes', async ({ page }) => {
    // This test requires authentication and navigation to a page with the toggle
    // Skip for now - will need to add auth setup

    // Navigate to a page with the toggle (project planning area)
    await page.goto(`${APP_URL}/projects`);

    // Look for the mode toggle button
    const toggleButton = page.locator('button:has-text("Working"), button:has-text("Formal")');
    await expect(toggleButton).toBeVisible();

    // Get initial mode
    const initialText = await page.textContent('body');

    // Click toggle
    await toggleButton.click();

    // Wait for content to update
    await page.waitForTimeout(1000);

    // Verify content changed
    const updatedText = await page.textContent('body');
    expect(initialText).not.toBe(updatedText);

    // Take screenshots of both modes
    await page.screenshot({ path: 'test-results/formal-mode.png', fullPage: true });

    // Toggle back
    await toggleButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/working-mode.png', fullPage: true });
  });
});

test.describe('Inngest Integration - Issue #14', () => {
  test.skip('project generation should use Inngest', async ({ page }) => {
    // This test requires authentication and monitoring network requests
    // Skip for now - will need to add auth setup

    // Set up network monitoring
    let inngestRequestFound = false;
    page.on('request', request => {
      if (request.url().includes('inngest') || request.url().includes('/api/inngest')) {
        inngestRequestFound = true;
      }
    });

    // Navigate to project creation
    await page.goto(`${APP_URL}/projects/new`);

    // Fill out project creation form and submit
    // (This will need to be customized based on actual form fields)

    // Verify Inngest was called
    expect(inngestRequestFound).toBe(true);
  });
});

test.describe('Basic Site Health Check', () => {
  test('production site should be accessible', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.status()).toBeLessThan(400);
  });

  test('app subdomain should be accessible', async ({ page }) => {
    const response = await page.goto(APP_URL);
    expect(response?.status()).toBeLessThan(400);
  });
});
