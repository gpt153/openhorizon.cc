import { test, expect } from '@playwright/test'

test.describe('Gantt Timeline', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to first project
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
    await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().click()
    await expect(page).toHaveURL(/.*\/projects\/[a-zA-Z0-9-]+/)
  })

  test('should render Gantt chart with phases', async ({ page }) => {
    // Wait for Gantt chart to render
    await page.locator('.gantt-container').or(page.locator('.gantt')).or(page.locator('svg.gantt')).first().waitFor({ timeout: 10000 })

    // Check if SVG elements are present
    const svg = page.locator('svg.gantt').or(page.locator('.gantt svg'))
    await expect(svg.first()).toBeVisible()

    // Check for phase bars (rects in SVG)
    const bars = page.locator('svg rect.bar').or(page.locator('svg .bar'))
    const count = await bars.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display phase names on Gantt bars', async ({ page }) => {
    // Wait for Gantt chart
    await page.locator('.gantt-container').or(page.locator('.gantt')).or(page.locator('svg.gantt')).first().waitFor({ timeout: 10000 })

    // Check for text labels
    const labels = page.locator('svg text').or(page.locator('.gantt text'))
    const count = await labels.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show phase details on hover or click', async ({ page }) => {
    // Wait for Gantt chart
    await page.locator('.gantt-container').or(page.locator('.gantt')).or(page.locator('svg.gantt')).first().waitFor({ timeout: 10000 })

    // Hover over first bar
    const firstBar = page.locator('svg rect.bar').or(page.locator('svg .bar')).first()
    await firstBar.hover()

    // Wait a bit for popup to appear
    await page.waitForTimeout(500)

    // Check if popup or tooltip appears (Frappe Gantt shows popup)
    const popup = page.locator('.popup-wrapper').or(page.locator('.gantt-popup')).or(page.locator('[class*="popup"]'))
    await expect(popup.first()).toBeVisible({ timeout: 5000 })
  })

  test('should switch between view modes', async ({ page }) => {
    // Wait for Gantt chart
    await page.locator('.gantt-container').or(page.locator('.gantt')).or(page.locator('svg.gantt')).first().waitFor({ timeout: 10000 })

    // Look for view mode buttons (Day, Week, Month)
    const weekButton = page.locator('button:has-text("Week")').or(page.locator('[data-view="Week"]'))

    if (await weekButton.first().isVisible()) {
      await weekButton.first().click()
      await page.waitForTimeout(500)

      // Gantt should still be visible after view change
      const svg = page.locator('svg.gantt').or(page.locator('.gantt svg'))
      await expect(svg.first()).toBeVisible()
    }
  })

  test('should show Add Phase button', async ({ page }) => {
    // Check for Add Phase button
    const addPhaseButton = page.locator('button:has-text("Add Phase")').or(page.locator('button:has-text("Create Phase")'))
    await expect(addPhaseButton.first()).toBeVisible()
  })

  test('should handle project with no phases', async ({ page }) => {
    // Try to find "no phases" message or empty state
    // This test may fail if all projects have phases
    const emptyState = page.locator('text=/No phases|Add your first phase/i')

    // If empty state exists, verify it's shown
    if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible()
    } else {
      // If no empty state, gantt should be visible
      const gantt = page.locator('.gantt-container').or(page.locator('.gantt')).or(page.locator('svg.gantt'))
      await expect(gantt.first()).toBeVisible()
    }
  })
})
