import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Test isolation - run tests serially to avoid database conflicts
  fullyParallel: false,
  workers: 1, // Single worker for database test isolation

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Timeout configuration
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Use authenticated storage state (created by global setup)
    // Individual tests can override this if they need a specific role
    // storageState: '.auth/admin-user.json', // Disabled - tests will authenticate explicitly
  },

  // Start dev server before running tests (only in local development)
  webServer: process.env.CI ? undefined : {
    command: 'cd app && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
