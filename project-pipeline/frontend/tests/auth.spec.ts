import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('auth-storage'))
    expect(token).toBeTruthy()
  })

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=/Email is required/i')).toBeVisible()
    await expect(page.locator('text=/Password is required/i')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message (toast or inline)
    await expect(page.locator('text=/Invalid credentials/i')).toBeVisible({ timeout: 5000 })
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Click logout button
    await page.click('button:has-text("Logout")')

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)

    // localStorage should be cleared
    const token = await page.evaluate(() => localStorage.getItem('auth-storage'))
    expect(token).toBeFalsy()
  })

  test('should protect routes from unauthenticated access', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())

    // Try to access protected route
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
  })
})
