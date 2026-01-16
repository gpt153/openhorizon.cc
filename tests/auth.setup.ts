import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  const APP_URL = process.env.APP_URL || 'http://localhost:5174';

  // Go to login page
  await page.goto(`${APP_URL}/login`);

  // Fill in login form with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(`${APP_URL}/dashboard`);

  // Wait for user info to be visible (confirms login success)
  await page.getByText('Test User').waitFor({ state: 'visible' });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
