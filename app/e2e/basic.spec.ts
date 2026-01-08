import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('homepage loads and redirects to projects', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Should redirect to /projects
    await expect(page).toHaveURL(/\/projects/);

    // Page title should be correct
    await expect(page).toHaveTitle(/Open Horizon Project Companion/);
  });

  test('navigation menu is visible', async ({ page }) => {
    await page.goto('/projects');

    // Check that navigation links exist and are visible
    const navItems = [
      'Dashboard',
      'Projects',
      'Brainstorm',
      'Seed Garden',
      'Settings'
    ];

    for (const item of navItems) {
      const link = page.getByRole('link', { name: item });
      await expect(link).toBeVisible();
    }
  });
});

test.describe('Projects Page', () => {
  test('displays page content', async ({ page }) => {
    await page.goto('/projects');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();

    // Should show some content (not just blank page)
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

/**
 * TEMPLATE for testing new features:
 *
 * When implementing a new feature, add a test like this:
 *
 * test('feature name', async ({ page }) => {
 *   await page.goto('/page-url');
 *
 *   // Test that UI element exists and is visible
 *   const element = page.getByRole('button', { name: /button text/i });
 *   await expect(element).toBeVisible();
 *
 *   // Test that clicking does something
 *   await element.click();
 *
 *   // Verify expected outcome
 *   await expect(page).toHaveURL(/expected-url/);
 *   // OR
 *   const result = page.getByText(/expected text/i);
 *   await expect(result).toBeVisible();
 * });
 *
 * This ensures features actually work from user perspective!
 */
