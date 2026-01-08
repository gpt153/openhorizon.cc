import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pipeline Projects Page', () => {
  test('should load pipeline projects list page', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Pipeline Projects');

    // Check that we're not stuck in loading (no spinner after load)
    await page.waitForTimeout(2000);
    const spinnerCount = await page.locator('.animate-spin').count();
    expect(spinnerCount).toBe(0);
  });

  test('should show create project button', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check for "New Pipeline Project" button
    const createButton = page.locator('button:has-text("New Pipeline Project")');
    await expect(createButton).toBeVisible();
  });

  test('should open create project dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.locator('button:has-text("New Pipeline Project")').click();

    // Dialog should appear
    await expect(page.locator('text="Create Pipeline Project"')).toBeVisible();

    // Check for required form fields
    await expect(page.locator('label:has-text("Project Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Location")')).toBeVisible();
    await expect(page.locator('label:has-text("Participant Count")')).toBeVisible();
  });
});

test.describe('Pipeline Project Detail Page', () => {
  test.skip('should navigate to project detail page', async ({ page }) => {
    // Skip if no projects exist - this would need test data setup
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Wait for projects to load
    await page.waitForTimeout(2000);

    // If there are project cards, click the first one
    const projectCards = page.locator('a[href^="/pipeline/projects/"]');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/pipeline\/projects\/[a-f0-9-]+/);

      // Check for expected elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text="Financial Overview"')).toBeVisible();
    }
  });
});

test.describe('Profit Dashboard Page', () => {
  test('should load profit dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/profit`);
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Profit Dashboard');

    // Check for summary cards
    await expect(page.locator('text="Total Grants"')).toBeVisible();
    await expect(page.locator('text="Total Costs"')).toBeVisible();
    await expect(page.locator('text="Accumulated Profit"')).toBeVisible();

    // No loading spinner after load
    await page.waitForTimeout(2000);
    const spinnerCount = await page.locator('.animate-spin').count();
    expect(spinnerCount).toBe(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pipeline pages using sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check sidebar has pipeline links
    await expect(page.locator('text="Pipeline Projects"')).toBeVisible();
    await expect(page.locator('text="Profit Dashboard"')).toBeVisible();

    // Click profit dashboard link
    await page.locator('a[href="/dashboard/profit"]').click();
    await page.waitForLoadState('networkidle');

    // Should navigate to profit dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/profit`);
    await expect(page.locator('h1')).toContainText('Profit Dashboard');

    // Navigate back to pipeline projects
    await page.locator('a[href="/pipeline/projects"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(`${BASE_URL}/pipeline/projects`);
    await expect(page.locator('h1')).toContainText('Pipeline Projects');
  });
});

test.describe('Phase Detail Page', () => {
  test.skip('should load phase detail page', async ({ page }) => {
    // Skip - requires test data setup with project and phases
    // This would test: /pipeline/projects/[id]/phases/[phaseId]
  });
});
