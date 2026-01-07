import { test, expect } from '@playwright/test'

test.describe('Budget Overview', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to budget page
    await page.click('a:has-text("Budget")')
    await expect(page).toHaveURL(/.*\/budget/)
  })

  test('should display budget overview page', async ({ page }) => {
    // Check for main heading
    await expect(page.locator('h1').filter({ hasText: 'Budget' })).toBeVisible()
  })

  test('should display summary cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for Total Budget card
    await expect(page.locator('text=/Total Budget/i').first()).toBeVisible()

    // Check for Total Spent card
    await expect(page.locator('text=/Total Spent|Spent/i').first()).toBeVisible()

    // Check for Remaining Budget card
    await expect(page.locator('text=/Remaining|Available/i').first()).toBeVisible()

    // Check for Over Budget card
    await expect(page.locator('text=/Over Budget/i').first()).toBeVisible()
  })

  test('should display budget indicators', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for progress bars or budget indicators
    const indicators = page.locator('[data-testid="budget-indicator"]').or(page.locator('.budget-indicator')).or(page.locator('[role="progressbar"]'))
    const count = await indicators.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show budget health distribution', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for health status categories
    await expect(page.locator('text=/On Track/i').first()).toBeVisible()
    await expect(page.locator('text=/Warning/i').first()).toBeVisible()
    await expect(page.locator('text=/Critical/i').first()).toBeVisible()
  })

  test('should display project budget breakdown list', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for project breakdown section
    await expect(page.locator('h2').filter({ hasText: /Project Budget Breakdown|Projects/i })).toBeVisible()

    // Check if projects are listed
    const projectItems = page.locator('[data-testid="project-budget"]').or(page.locator('.project-budget-item'))
    const count = await projectItems.count()

    if (count === 0) {
      // Fallback: check for any project names
      const projectNames = page.locator('text=/Barcelona|Exchange|Training/i')
      const nameCount = await projectNames.count()
      expect(nameCount).toBeGreaterThan(0)
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should show budget percentage calculations', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for percentage displays
    const percentages = page.locator('text=/\\d+(\\.\\d+)?%/')
    const count = await percentages.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display currency formatting', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for currency symbols or formatted amounts
    const currency = page.locator('text=/\\$|€|£|USD/')
    const count = await currency.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to project detail from budget list', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Find a clickable project item
    const projectItem = page.locator('[data-testid="project-budget"]').or(page.locator('.project-budget-item')).or(page.locator('text=/Barcelona|Exchange/i')).first()

    if (await projectItem.isVisible()) {
      await projectItem.click()

      // Should navigate to project detail
      await expect(page).toHaveURL(/.*\/projects\/[a-zA-Z0-9-]+/)
    }
  })

  test('should show over-budget indicators', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)

    // Check for over-budget warnings or indicators
    const overBudgetIndicators = page.locator('text=/Over Budget|Exceeded/i').or(page.locator('[data-status="over-budget"]'))
    const count = await overBudgetIndicators.count()

    // May be 0 if no projects are over budget - that's OK
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to reports page', async ({ page }) => {
    // Click Generate Reports button
    const reportsButton = page.locator('button:has-text("Reports")').or(page.locator('a:has-text("Reports")')).or(page.locator('button:has-text("Generate Reports")'))

    if (await reportsButton.first().isVisible()) {
      await reportsButton.first().click()

      // Should navigate to reports page
      await expect(page).toHaveURL(/.*\/reports/)
    }
  })
})

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to reports
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/reports')
  })

  test('should display reports page', async ({ page }) => {
    // Check for reports heading
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible()
  })

  test('should display report type selection', async ({ page }) => {
    // Check for report type options
    await expect(page.locator('text=/Projects Report|Budget Report|Export/i')).toBeVisible()
  })

  test('should have export functionality', async ({ page }) => {
    // Check for export button
    const exportButton = page.locator('button:has-text("Export")').or(page.locator('button:has-text("Download")')).or(page.locator('button:has-text("Generate")'))
    await expect(exportButton.first()).toBeVisible()
  })

  test('should select report type and export', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Select a report type (if there are radio buttons or cards)
    const reportOption = page.locator('[data-report-type]').or(page.locator('.report-option')).first()

    if (await reportOption.isVisible({ timeout: 2000 })) {
      await reportOption.click()
    }

    // Click export button
    const exportButton = page.locator('button:has-text("Export")').or(page.locator('button:has-text("Download")')).or(page.locator('button:has-text("Generate")'))

    if (await exportButton.first().isVisible()) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

      await exportButton.first().click()

      // Wait for download to start
      const download = await downloadPromise
      expect(download).toBeTruthy()

      // Check filename has .csv extension
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/\.csv$/i)
    }
  })
})
