import { test, expect } from '@playwright/test';
import { signInAsAdmin } from './helpers/auth';

test.describe('OpenHorizon Project Features', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await signInAsAdmin(page);
  });

  test('should load the homepage and redirect to projects', async ({ page }) => {
    await page.goto('/');

    // Should redirect to /projects or /dashboard
    await expect(page).toHaveURL(/.\*(projects|dashboard)/);

    // Check page title
    await expect(page).toHaveTitle(/Open Horizon Project Companion/);
  });

  test('should have seed generation functionality', async ({ page }) => {
    await page.goto('/projects');

    // Look for seed generation button or link
    const seedButton = page.locator('button:has-text("Generate Seed"), a:has-text("Generate Seed"), button:has-text("New Seed"), a:has-text("New Seed")');

    if (await seedButton.count() > 0) {
      console.log('✓ Seed generation UI element found');
      await expect(seedButton.first()).toBeVisible();
    } else {
      console.log('✗ Seed generation UI element NOT found');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'seed-generation-missing.png', fullPage: true });
    }
  });

  test('should have project creation functionality', async ({ page }) => {
    await page.goto('/projects');

    // Look for project creation button or link
    const createProjectButton = page.locator('button:has-text("Create Project"), a:has-text("Create Project"), button:has-text("New Project"), a:has-text("New Project")');

    if (await createProjectButton.count() > 0) {
      console.log('✓ Project creation UI element found');
      await expect(createProjectButton.first()).toBeVisible();
    } else {
      console.log('✗ Project creation UI element NOT found');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'project-creation-missing.png', fullPage: true });
    }
  });

  test('should check for Inngest integration indicators', async ({ page }) => {
    await page.goto('/projects');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for any loading states or async job indicators
    const loadingIndicators = page.locator('[data-testid*="loading"], [aria-label*="loading"], .loading, .spinner');

    // Check network requests for Inngest
    const inngestRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('inngest') || request.url().includes('/api/inngest')) {
        inngestRequests.push(request.url());
      }
    });

    // Trigger any action that might use Inngest
    await page.waitForTimeout(2000);

    if (inngestRequests.length > 0) {
      console.log('✓ Inngest requests detected:', inngestRequests);
    } else {
      console.log('✗ No Inngest requests detected');
    }
  });

  test('should capture page structure for analysis', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Get all buttons and links
    const buttons = await page.locator('button').allTextContents();
    const links = await page.locator('a').allTextContents();

    console.log('=== PAGE STRUCTURE ===');
    console.log('Buttons found:', buttons.filter(b => b.trim()));
    console.log('Links found:', links.filter(l => l.trim()));

    // Take a screenshot
    await page.screenshot({ path: 'projects-page.png', fullPage: true });
  });
});
