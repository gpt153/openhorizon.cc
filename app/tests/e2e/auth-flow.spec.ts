import { test, expect } from '@playwright/test'
import { signIn, signOut } from '../../../tests/helpers/auth'

// Test configuration - use actual test users from fixtures
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.openhorizon.cc',
  password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
}

const TEST_USER = TEST_ADMIN // Use admin as default test user for signup tests

test.describe('Authentication Flow', () => {
  test.describe('Sign Up Flow', () => {
    test('should create new user and organization', async ({ page }) => {
      // Navigate to sign-up page
      await page.goto('/sign-up')

      // Fill sign-up form (Clerk's default form)
      const uniqueEmail = `test-${Date.now()}@example.com`
      await page.fill('input[name="emailAddress"]', uniqueEmail)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Wait for email verification screen (or skip if test mode)
      // Note: In test mode, Clerk may auto-verify

      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 10000 })

      // Verify user is authenticated (check for user menu)
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/sign-up')

      // Try to sign up with existing email
      await page.fill('input[name="emailAddress"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/already exists|taken/i')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should enforce password requirements', async ({ page }) => {
      await page.goto('/sign-up')

      await page.fill('input[name="emailAddress"]', 'newuser@example.com')
      await page.fill('input[name="password"]', '123') // Weak password
      await page.click('button[type="submit"]')

      // Should show password strength error
      await expect(page.locator('text=/password.*strong|weak|length/i')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Sign In Flow', () => {
    test('should sign in existing user', async ({ page }) => {
      // Use helper function for consistent sign-in
      await signIn(page, {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      })

      // Verify user is authenticated
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in')

      await page.fill('input[name="identifier"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/incorrect|invalid|not found/i')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should remember session after page refresh', async ({ page }) => {
      // Sign in using helper
      await signIn(page, {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      })

      // Refresh page
      await page.reload()

      // Should still be authenticated
      await expect(page).toHaveURL(/\/(dashboard|projects)/)
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to sign-in', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/dashboard')

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })
    })

    test('should allow authenticated users to access dashboard', async ({ page }) => {
      // Sign in using helper
      await signIn(page, {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      })

      // Try to access other protected routes
      await page.goto('/projects')
      await expect(page).toHaveURL('/projects')

      await page.goto('/pipeline/projects')
      await expect(page).toHaveURL('/pipeline/projects')
    })

    test('should return 401 for unauthenticated API calls', async ({ request }) => {
      // Try to call protected API without auth
      const response = await request.get('/api/trpc/projects.list')

      // Should return 401 or error response
      expect(response.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe('Sign Out Flow', () => {
    test('should sign out user and redirect to sign-in', async ({ page }) => {
      // Sign in using helper
      await signIn(page, {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      })

      // Sign out using helper
      await signOut(page)

      // Try to access protected route - should redirect
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })
    })
  })

  test.describe('Organization Context', () => {
    test('should load organization for authenticated user', async ({ page }) => {
      // Sign in using helper
      await signIn(page, {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      })

      // Check that tRPC calls include organization context
      // This will be visible in data loaded on the page
      await page.goto('/projects')

      // Wait for projects to load (they should be filtered by org)
      await page.waitForSelector('[data-testid="projects-list"], text=/no projects/i', {
        timeout: 10000,
      })

      // No errors should be shown (org context is working)
      const errorElement = page.locator('text=/error|failed/i')
      const errorCount = await errorElement.count()

      // If errors exist, they should not be visible (may be in hidden elements)
      if (errorCount > 0) {
        await expect(errorElement.first()).not.toBeVisible()
      }
    })
  })
})
