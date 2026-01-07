import { test, expect } from '@playwright/test'

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test.describe('Project CRUD', () => {
    test('should create a new project', async ({ page }) => {
      // Click Create Project button
      const createBtn = page.locator('button:has-text("Create Project")').or(page.locator('a:has-text("Create Project")'))
      await createBtn.first().click()

      // Should navigate to create page
      await expect(page).toHaveURL(/.*\/projects\/create/)

      // Fill form
      await page.fill('input[name="name"]', 'E2E Test Project')
      await page.selectOption('select[name="type"]', 'STUDENT_EXCHANGE')
      await page.fill('textarea[name="description"]', 'Test project created by E2E test')
      await page.fill('input[name="start_date"]', '2025-06-01')
      await page.fill('input[name="end_date"]', '2025-06-30')
      await page.fill('input[name="budget_total"]', '50000')
      await page.fill('input[name="participants_count"]', '50')
      await page.fill('input[name="location"]', 'Test Location')

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect to project detail or dashboard
      await page.waitForURL(/.*\/(projects\/[a-zA-Z0-9-]+|dashboard)/, { timeout: 10000 })

      // Check for success toast
      await expect(page.locator('[role="status"]').filter({ hasText: /created|success/i })).toBeVisible({ timeout: 5000 })
    })

    test('should edit an existing project', async ({ page }) => {
      // Navigate to first project
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().click()

      // Click Edit button
      const editBtn = page.locator('button:has-text("Edit")').or(page.locator('a:has-text("Edit")'))
      await editBtn.first().click()

      // Should navigate to edit page
      await expect(page).toHaveURL(/.*\/projects\/[a-zA-Z0-9-]+\/edit/)

      // Modify project name
      const nameInput = page.locator('input[name="name"]')
      await nameInput.fill('Updated Project Name')

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect back
      await page.waitForURL(/.*\/projects\/[a-zA-Z0-9-]+(?!\/edit)/, { timeout: 10000 })

      // Check for success toast
      await expect(page.locator('text=/success|updated/i')).toBeVisible({ timeout: 5000 })
    })

    test('should validate required fields on project create', async ({ page }) => {
      // Click Create Project
      const createBtn = page.locator('button:has-text("Create Project")').or(page.locator('a:has-text("Create Project")'))
      await createBtn.first().click()

      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(page.locator('text=/required/i').first()).toBeVisible()
    })

    test('should delete a project', async ({ page }) => {
      // Navigate to first project
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
      const firstProject = page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first()
      await firstProject.click()

      // Click Delete button
      await page.click('button:has-text("Delete")')

      // Confirm deletion dialog
      const confirmBtn = page.locator('button:has-text("Delete")').or(page.locator('button:has-text("Confirm")'))
      await confirmBtn.first().click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 })

      // Check for success toast
      await expect(page.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Phase CRUD', () => {
    test('should create a new phase', async ({ page }) => {
      // Navigate to first project
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().click()

      // Click Add Phase button
      const addPhaseBtn = page.locator('button:has-text("Add Phase")').or(page.locator('button:has-text("Create Phase")'))
      await addPhaseBtn.first().click()

      // Should navigate to create phase page
      await expect(page).toHaveURL(/.*\/phases\/create|.*\/phases\/new/)

      // Fill form
      await page.fill('input[name="name"]', 'E2E Test Phase')
      await page.selectOption('select[name="type"]', 'ACCOMMODATION')
      await page.fill('input[name="start_date"]', '2025-06-01')
      await page.fill('input[name="end_date"]', '2025-06-10')
      await page.fill('input[name="budget_allocated"]', '10000')

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect back to project
      await page.waitForURL(/.*\/projects\/[a-zA-Z0-9-]+/, { timeout: 10000 })

      // Check for success toast
      await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 5000 })
    })

    test('should edit an existing phase', async ({ page }) => {
      // Navigate to first project
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().click()

      // Wait for phases to load
      await page.waitForTimeout(1000)

      // Click on a phase (in list or gantt)
      const phaseItem = page.locator('[data-testid="phase-item"]').or(page.locator('.phase-item')).or(page.locator('text=/Accommodation|Travel|Food/i')).first()
      if (await phaseItem.isVisible({ timeout: 2000 })) {
        await phaseItem.click()

        // Click Edit button
        await page.click('button:has-text("Edit")')

        // Modify phase
        await page.fill('input[name="budget_allocated"]', '15000')

        // Submit
        await page.click('button[type="submit"]')

        // Check for success
        await expect(page.locator('text=/success|updated/i')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should delete a phase', async ({ page }) => {
      // Navigate to first project
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().waitFor({ timeout: 10000 })
      await page.locator('[data-testid="project-card"]').or(page.locator('.project-card')).first().click()

      // Wait for phases
      await page.waitForTimeout(1000)

      // Click on a phase
      const phaseItem = page.locator('[data-testid="phase-item"]').or(page.locator('.phase-item')).or(page.locator('text=/Accommodation|Travel|Food/i')).first()
      if (await phaseItem.isVisible({ timeout: 2000 })) {
        await phaseItem.click()

        // Click Delete button
        await page.click('button:has-text("Delete")')

        // Confirm deletion
        const confirmBtn = page.locator('button:has-text("Delete")').or(page.locator('button:has-text("Confirm")'))
        await confirmBtn.first().click()

        // Check for success
        await expect(page.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 })
      }
    })
  })
})
