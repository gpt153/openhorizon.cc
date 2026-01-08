import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display dashboard with project list', async ({ page }) => {
    // Wait for projects to load
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })

    // Check if projects are displayed
    const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-card'))
    const count = await projectCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to project detail when clicking project card', async ({ page }) => {
    // Wait for projects to load
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })

    // Get first project card
    const firstProject = page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first()

    // Click on it
    await firstProject.click()

    // Should navigate to project detail page
    await expect(page).toHaveURL(/.*\/projects\/[a-zA-Z0-9-]+/)
  })

  test('should display Create Project button', async ({ page }) => {
    // Check for create project button
    const createButton = page.locator('button:has-text("Create Project")').or(page.locator('a:has-text("Create Project")'))
    await expect(createButton.first()).toBeVisible()
  })

  test('should navigate to Budget page from navigation', async ({ page }) => {
    // Click Budget link in navigation
    await page.click('a:has-text("Budget")')

    // Should navigate to budget page
    await expect(page).toHaveURL(/.*\/budget/)
  })

  test('should navigate to AI Chat from navigation', async ({ page }) => {
    // Click AI Chat link in navigation
    const chatLink = page.locator('a:has-text("AI Chat")').or(page.locator('a:has-text("Chat")'))
    await chatLink.first().click()

    // Should navigate to chat page
    await expect(page).toHaveURL(/.*\/chat/)
  })

  test('should display project status badges', async ({ page }) => {
    // Wait for projects to load
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })

    // Check for status indicators
    const statusBadges = page.locator('text=/PLANNING|IN_PROGRESS|COMPLETED|CANCELLED/i')
    const count = await statusBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display budget information on project cards', async ({ page }) => {
    // Wait for projects to load
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })

    // Check for budget display (currency or numbers)
    const budgetInfo = page.locator('text=/\\$|budget/i')
    const count = await budgetInfo.count()
    expect(count).toBeGreaterThan(0)
  })
})
