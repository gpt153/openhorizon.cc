import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://openhorizon.cc',
    trace: 'on-first-retry',
  },

  // Start dev server before running tests (only in local development)
  webServer: process.env.CI ? undefined : {
    command: 'cd project-pipeline/frontend && npm run dev -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 120000, // 2 minutes to start
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
