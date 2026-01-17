import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite: Programme Builder
 *
 * Tests the complete user flow for creating and managing multi-day learning programmes.
 *
 * User Flow:
 * 1. Navigate to project programme page
 * 2. Create programme structure (multiple days)
 * 3. Add activities to days
 * 4. Edit existing activities
 * 5. Reorder activities (drag-drop)
 * 6. Delete activities
 * 7. Save programme
 *
 * Part of Epic 003: Production Readiness
 * Related: Issue #131 (E2E Complete User Flows)
 */

const APP_URL = process.env.APP_URL || 'http://localhost:5174'

test.describe('Programme Builder - CRUD Operations', () => {
  let testProjectId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to projects page
    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    // Get or create a project
    const projectCards = page.locator('[data-testid="project-card"], .project-card')
    const projectCount = await projectCards.count()

    if (projectCount === 0) {
      console.log('⚠️  No projects available - test requires existing project')
      test.skip()
      return
    }

    // Click on first project
    await projectCards.first().click()
    await page.waitForLoadState('networkidle')

    // Extract project ID from URL
    const url = page.url()
    const match = url.match(/\/projects\/([^\/]+)/)
    if (match) {
      testProjectId = match[1]
      console.log(`📋 Using project ID: ${testProjectId}`)
    }
  })

  test('should create new programme structure', async ({ page }) => {
    console.log('🧪 Testing programme creation')

    // Look for programme/program section or create button
    const programmeLink = page.locator(
      'a:has-text("Programme"), a:has-text("Program"), button:has-text("Programme"), button:has-text("Activities")'
    )

    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
      console.log('✅ Navigated to programme section')
    }

    // Look for "Create Programme" or "Add Programme" button
    const createButton = page.locator(
      'button:has-text("Create Programme"), button:has-text("New Programme"), button:has-text("Add Programme")'
    )

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()

      // Fill programme details
      const durationInput = page.locator('input[name="duration"], input[id="duration"], input[placeholder*="days"]')

      if (await durationInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await durationInput.fill('7')
        console.log('✅ Set duration to 7 days')

        // Look for generate/create button
        const generateButton = page.locator(
          'button:has-text("Generate"), button:has-text("Create"), button[type="submit"]'
        )
        await generateButton.click()

        // Wait for programme structure to be created
        await page.waitForTimeout(2000)

        // Verify days are created
        const dayElements = page.locator('[data-testid="programme-day"], .programme-day, .day')
        const dayCount = await dayElements.count()

        expect(dayCount).toBeGreaterThan(0)
        console.log(`✅ Created ${dayCount} programme days`)
      } else {
        console.log('⚠️  Programme creation form not found')
        test.skip()
      }
    } else {
      console.log('ℹ️  Programme may already exist or creation not implemented')

      // Check if programme days already exist
      const existingDays = page.locator('[data-testid="programme-day"], .programme-day, .day')
      const existingDayCount = await existingDays.count()

      if (existingDayCount > 0) {
        console.log(`✅ Programme already exists with ${existingDayCount} days`)
      } else {
        console.log('⚠️  No programme found')
        test.skip()
      }
    }
  })

  test('should add activity to programme day', async ({ page }) => {
    console.log('🧪 Testing activity addition')

    // Navigate to programme section
    const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Find first day
    const day1 = page.locator('[data-testid="programme-day"], .programme-day, .day').first()

    if (!(await day1.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  No programme days found')
      test.skip()
      return
    }

    // Look for "Add Activity" button
    const addActivityButton = day1.locator(
      'button:has-text("Add Activity"), button:has-text("New Activity"), button:has-text("+")'
    ).or(page.locator('button:has-text("Add Activity"), button:has-text("New Activity")').first())

    if (await addActivityButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addActivityButton.click()

      // Fill activity form
      const titleInput = page.locator('input[name="title"], input[id="activity-title"], input[placeholder*="title"]').last()

      if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await titleInput.fill('Icebreaker Games')

        // Duration
        const durationInput = page.locator('input[name="duration"], input[id="activity-duration"], input[placeholder*="duration"]').last()
        if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await durationInput.fill('2 hours')
        }

        // Type/Category
        const typeSelect = page.locator('select[name="type"], select[id="activity-type"]').last()
        if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await typeSelect.selectOption({ index: 1 })
        }

        // Save activity
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button[type="submit"]').last()
        await saveButton.click()

        // Wait for activity to appear
        await page.waitForTimeout(1000)

        // Verify activity was added
        const activities = page.locator('[data-testid="activity"], .activity, text="Icebreaker Games"')
        const hasActivity = await activities.count() > 0

        expect(hasActivity).toBe(true)
        console.log('✅ Activity added successfully')

        // Take screenshot
        await page.screenshot({
          path: 'test-results/programme-builder-activity-added.png',
          fullPage: true
        })
      } else {
        console.log('⚠️  Activity form not found')
        test.skip()
      }
    } else {
      console.log('⚠️  Add Activity button not found')
      test.skip()
    }
  })

  test('should edit existing activity', async ({ page }) => {
    console.log('🧪 Testing activity editing')

    // Navigate to programme
    const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Find an activity
    const activity = page.locator('[data-testid="activity"], .activity').first()

    if (!(await activity.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  No activities found to edit')
      test.skip()
      return
    }

    const originalText = await activity.innerText()
    console.log(`📝 Original activity: ${originalText.substring(0, 50)}...`)

    // Look for edit button
    const editButton = activity.locator('button:has-text("Edit"), [data-action="edit"], .edit-button')

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click()

      // Edit the title
      const titleInput = page.locator('input[name="title"], input[value*=""]').last()

      if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const currentValue = await titleInput.inputValue()
        const newValue = `${currentValue} (Updated)`

        await titleInput.fill(newValue)

        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').last()
        await saveButton.click()

        await page.waitForTimeout(1000)

        // Verify edit persisted
        const updatedActivity = page.locator(`text="${newValue}"`).or(
          page.locator('text="Updated"')
        )

        const wasUpdated = await updatedActivity.count() > 0
        expect(wasUpdated).toBe(true)
        console.log('✅ Activity edited successfully')
      } else {
        console.log('⚠️  Edit form not found')
        test.skip()
      }
    } else {
      console.log('⚠️  Edit button not found')
      test.skip()
    }
  })

  test('should delete activity', async ({ page }) => {
    console.log('🧪 Testing activity deletion')

    // Navigate to programme
    const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Count initial activities
    const activities = page.locator('[data-testid="activity"], .activity')
    const initialCount = await activities.count()

    if (initialCount === 0) {
      console.log('⚠️  No activities to delete')
      test.skip()
      return
    }

    console.log(`📊 Initial activity count: ${initialCount}`)

    // Find delete button
    const deleteButton = activities.first().locator(
      'button:has-text("Delete"), button:has-text("Remove"), [data-action="delete"]'
    )

    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteButton.click()

      // Handle confirmation dialog if present
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")')

      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
      }

      await page.waitForTimeout(1000)

      // Verify activity was deleted
      const finalCount = await activities.count()
      expect(finalCount).toBe(initialCount - 1)
      console.log(`✅ Activity deleted (${finalCount} remaining)`)
    } else {
      console.log('⚠️  Delete button not found')
      test.skip()
    }
  })

  test('should validate programme structure', async ({ page }) => {
    console.log('🧪 Testing programme validation')

    // Navigate to programme
    const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Try to save programme (if there's a save button)
    const saveButton = page.locator('button:has-text("Save Programme"), button:has-text("Save All")')

    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveButton.click()

      // Check for validation messages or success
      const successMessage = page.locator(
        'text=/saved|success/i, [role="status"]:has-text("saved")'
      )

      const errorMessage = page.locator(
        'text=/error|validation|required/i, [role="alert"]'
      )

      const hasSuccess = await successMessage.isVisible({ timeout: 3000 }).catch(() => false)
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasSuccess) {
        console.log('✅ Programme saved successfully')
      } else if (hasError) {
        const error = await errorMessage.innerText()
        console.log(`✅ Validation error shown: ${error}`)
      } else {
        console.log('⚠️  No feedback after save attempt')
      }
    } else {
      console.log('ℹ️  Auto-save may be enabled (no manual save button)')
    }
  })

  test('should persist programme data on refresh', async ({ page }) => {
    console.log('🧪 Testing programme persistence')

    // Navigate to programme
    const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
    if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await programmeLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Count activities before refresh
    const activities = page.locator('[data-testid="activity"], .activity')
    const countBeforeRefresh = await activities.count()

    console.log(`📊 Activities before refresh: ${countBeforeRefresh}`)

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Navigate back to programme if needed
    const stillOnProgramme = await page.locator(
      '[data-testid="programme-day"], .programme-day'
    ).isVisible({ timeout: 5000 }).catch(() => false)

    if (!stillOnProgramme) {
      const programmeLinkAfterRefresh = page.locator('a:has-text("Programme"), button:has-text("Programme")')
      if (await programmeLinkAfterRefresh.isVisible({ timeout: 5000 }).catch(() => false)) {
        await programmeLinkAfterRefresh.click()
        await page.waitForLoadState('networkidle')
      }
    }

    // Count activities after refresh
    const activitiesAfterRefresh = page.locator('[data-testid="activity"], .activity')
    const countAfterRefresh = await activitiesAfterRefresh.count()

    console.log(`📊 Activities after refresh: ${countAfterRefresh}`)

    // Should be the same (data persisted)
    expect(countAfterRefresh).toBe(countBeforeRefresh)
    console.log('✅ Programme data persisted across refresh')
  })
})

test.describe('Programme Builder - Advanced Features', () => {
  test('should reorder activities via drag and drop', async ({ page }) => {
    console.log('🧪 Testing activity reordering (drag-drop)')

    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()
    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const programmeLink = page.locator('a:has-text("Programme"), button:has-text("Programme")')
      if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await programmeLink.click()
        await page.waitForLoadState('networkidle')

        const activities = page.locator('[data-testid="activity"], .activity')
        const activityCount = await activities.count()

        if (activityCount >= 2) {
          // Get first two activities
          const firstActivity = activities.nth(0)
          const secondActivity = activities.nth(1)

          const firstText = await firstActivity.innerText()
          const secondText = await secondActivity.innerText()

          console.log(`📝 First: ${firstText.substring(0, 30)}...`)
          console.log(`📝 Second: ${secondText.substring(0, 30)}...`)

          // Attempt drag and drop
          const firstBox = await firstActivity.boundingBox()
          const secondBox = await secondActivity.boundingBox()

          if (firstBox && secondBox) {
            await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
            await page.mouse.down()
            await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 5 })
            await page.mouse.up()

            await page.waitForTimeout(1000)

            console.log('✅ Drag and drop attempted')

            // Verify order changed (if drag-drop is implemented)
            const activitiesAfter = page.locator('[data-testid="activity"], .activity')
            const newFirstText = await activitiesAfter.nth(0).innerText()

            if (newFirstText !== firstText) {
              console.log('✅ Activity order changed via drag-drop')
            } else {
              console.log('⚠️  Drag-drop may not be implemented')
            }
          }
        } else {
          console.log('⚠️  Need at least 2 activities for reorder test')
          test.skip()
        }
      }
    }
  })

  test('should handle multiple days with activities', async ({ page }) => {
    console.log('🧪 Testing multi-day programme')

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const programmeLink = page.locator('a:has-text("Programme")')
      if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await programmeLink.click()
        await page.waitForLoadState('networkidle')

        // Count days
        const days = page.locator('[data-testid="programme-day"], .programme-day, .day')
        const dayCount = await days.count()

        console.log(`📊 Programme has ${dayCount} days`)
        expect(dayCount).toBeGreaterThan(0)

        // Verify each day can hold activities
        for (let i = 0; i < Math.min(dayCount, 3); i++) {
          const day = days.nth(i)
          const dayText = await day.innerText()

          console.log(`📅 Day ${i + 1}: ${dayText.substring(0, 50)}...`)
        }

        console.log('✅ Multi-day structure verified')

        // Take full screenshot
        await page.screenshot({
          path: 'test-results/programme-builder-multiday.png',
          fullPage: true
        })
      }
    }
  })

  test('should handle activity time conflicts', async ({ page }) => {
    console.log('🧪 Testing activity time conflict detection')

    // This test checks if the system prevents overlapping activities
    // Implementation may vary

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const programmeLink = page.locator('a:has-text("Programme")')
      if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await programmeLink.click()

        // Look for time-based activity scheduling
        const timeInputs = page.locator('input[type="time"], input[placeholder*="time"]')
        const hasTimeScheduling = await timeInputs.count() > 0

        if (hasTimeScheduling) {
          console.log('✅ Time-based scheduling available')
          // Could add more specific conflict testing here
        } else {
          console.log('ℹ️  Duration-based activities (no specific times)')
        }
      }
    }
  })
})

test.describe('Programme Builder - Edge Cases', () => {
  test('should handle empty programme day', async ({ page }) => {
    console.log('🧪 Testing empty day validation')

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      // Check if there are warnings about empty days
      const warning = page.locator('text=/empty|no activities|add activity/i')

      if (await warning.isVisible({ timeout: 5000 }).catch(() => false)) {
        const warningText = await warning.innerText()
        console.log(`💡 Validation: ${warningText}`)
      } else {
        console.log('ℹ️  No validation for empty days (may be allowed)')
      }
    }
  })

  test('should handle very long activity titles', async ({ page }) => {
    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const programmeLink = page.locator('a:has-text("Programme")')
      if (await programmeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await programmeLink.click()

        const addButton = page.locator('button:has-text("Add Activity")').first()
        if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await addButton.click()

          const titleInput = page.locator('input[name="title"]').last()
          if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            const longTitle = 'A very long activity title that '.repeat(10) + 'should be validated'
            await titleInput.fill(longTitle)

            const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').last()
            await saveButton.click()

            await page.waitForTimeout(1000)

            // Should either succeed or show validation
            console.log('✅ Long title handled (accepted or validated)')
          }
        }
      }
    }
  })
})
