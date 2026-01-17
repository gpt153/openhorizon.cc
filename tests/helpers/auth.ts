import type { Page } from '@playwright/test'

/**
 * Authentication Helper for E2E Tests
 *
 * Provides utilities for:
 * - Signing in test users
 * - Managing authentication state
 * - Clerk-specific auth flows
 */

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

export interface SignInOptions {
  email: string
  password: string
  waitForUrl?: string | RegExp
}

/**
 * Sign in a test user via Clerk
 */
export async function signIn(page: Page, options: SignInOptions): Promise<void> {
  const { email, password, waitForUrl = /\/(dashboard|projects)/ } = options

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

  // Navigate to sign-in page
  await page.goto(`${baseUrl}/sign-in`)

  try {
    // Fill in Clerk sign-in form
    // Clerk uses 'identifier' for email/username field
    const identifierInput = page.locator('input[name="identifier"]')
    await identifierInput.waitFor({ state: 'visible', timeout: 10000 })
    await identifierInput.fill(email)

    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.fill(password)

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Wait for redirect to dashboard or projects
    await page.waitForURL(waitForUrl, { timeout: 15000 })

    console.log(`[Auth] ✓ Signed in as ${email}`)
  } catch (error) {
    console.error(`[Auth] ✗ Sign-in failed for ${email}:`, error)
    // Take screenshot for debugging
    await page.screenshot({ path: `test-results/sign-in-failed-${Date.now()}.png` })
    throw error
  }
}

/**
 * Sign in as admin test user
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.openhorizon.cc'
  const password = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

  await signIn(page, { email, password })
}

/**
 * Sign in as staff test user
 */
export async function signInAsStaff(page: Page): Promise<void> {
  const email = process.env.TEST_STAFF_EMAIL || 'staff@test.openhorizon.cc'
  const password = process.env.TEST_STAFF_PASSWORD || 'TestPassword123!'

  await signIn(page, { email, password })
}

/**
 * Sign in as participant test user
 */
export async function signInAsParticipant(page: Page): Promise<void> {
  const email = process.env.TEST_PARTICIPANT_EMAIL || 'participant@test.openhorizon.cc'
  const password = process.env.TEST_PARTICIPANT_PASSWORD || 'TestPassword123!'

  await signIn(page, { email, password })
}

/**
 * Sign out current user
 */
export async function signOut(page: Page): Promise<void> {
  try {
    // Click Clerk user button
    await page.click('[data-clerk-element="userButton"]')

    // Wait for menu to appear
    await page.waitForTimeout(500)

    // Click sign out
    await page.click('text=/sign out/i')

    // Wait for redirect to sign-in
    await page.waitForURL(/\/sign-in/, { timeout: 10000 })

    console.log('[Auth] ✓ Signed out')
  } catch (error) {
    console.error('[Auth] ✗ Sign-out failed:', error)
    throw error
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for Clerk user button (indicates authenticated state)
    const userButton = page.locator('[data-clerk-element="userButton"]')
    await userButton.waitFor({ state: 'visible', timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Ensure user is authenticated, sign in if needed
 */
export async function ensureAuthenticated(page: Page, role: 'admin' | 'staff' | 'participant' = 'admin'): Promise<void> {
  if (await isAuthenticated(page)) {
    console.log('[Auth] Already authenticated')
    return
  }

  console.log('[Auth] Not authenticated, signing in...')

  switch (role) {
    case 'admin':
      await signInAsAdmin(page)
      break
    case 'staff':
      await signInAsStaff(page)
      break
    case 'participant':
      await signInAsParticipant(page)
      break
  }
}

// =============================================================================
// STORAGE STATE HELPERS
// =============================================================================

/**
 * Save authentication state to file
 * Useful for reusing auth across tests
 */
export async function saveAuthState(page: Page, filePath: string = '.auth/user.json'): Promise<void> {
  await page.context().storageState({ path: filePath })
  console.log(`[Auth] ✓ Saved auth state to ${filePath}`)
}

/**
 * Load authentication state from file
 * NOTE: This should be done during browser context creation, not after
 */
export function getAuthStorageStatePath(role: 'admin' | 'staff' | 'participant' = 'admin'): string {
  return `.auth/${role}-user.json`
}
