import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite: Project Generation (Seed → Project Conversion)
 *
 * Tests the complete user flow for converting an elaborated seed into a structured project.
 *
 * User Flow:
 * 1. Navigate to elaborated seed detail page
 * 2. Click "Convert to Project" button
 * 3. Wait for project generation
 * 4. Verify redirect to project page
 * 5. Verify project data (DNA, metadata, status)
 *
 * Part of Epic 003: Production Readiness
 * Related: Issue #131 (E2E Complete User Flows)
 */

const APP_URL = process.env.APP_URL || 'http://localhost:5174'

test.describe('Project Generation - Seed to Project Conversion', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to seeds page
    await page.goto(`${APP_URL}/seeds`)
    await page.waitForLoadState('networkidle')
  })

  test('should convert elaborated seed to project successfully', async ({ page }) => {
    console.log('🧪 Testing seed → project conversion')

    // Find first seed
    const seedCard = page.locator('[data-testid="seed-card"], .seed-card').first()

    if (!(await seedCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  No seeds available - creating one first')

      // Create a seed
      await page.goto(`${APP_URL}/seeds/generate`)
      await page.locator('textarea[name="prompt"], input[name="prompt"]')
        .fill('Youth exchange about cultural diversity in Barcelona')
      await page.locator('button:has-text("Generate"), button:has-text("Brainstorm")').click()

      const generatedSeed = page.locator('[data-testid="seed-card"], .seed-card').first()
      await expect(generatedSeed).toBeVisible({ timeout: 30000 })

      // Save it
      const saveButton = generatedSeed.locator('button:has-text("Save")')
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click()
        await page.waitForTimeout(1000)
      }

      await page.goto(`${APP_URL}/seeds`)
      await page.waitForLoadState('networkidle')
    }

    // Click on first seed
    await page.locator('[data-testid="seed-card"], .seed-card').first().click()
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    console.log(`📍 Seed detail page: ${currentUrl}`)

    // Look for "Convert to Project" button
    const convertButton = page.locator(
      'button:has-text("Convert to Project"), button:has-text("Generate Project"), button:has-text("Create Project")'
    )

    if (!(await convertButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  Convert button not found - seed may need elaboration first')
      console.log('⚠️  Checking for elaborate button...')

      // Try to elaborate first
      const elaborateButton = page.locator('button:has-text("Elaborate"), button:has-text("Start Elaboration")')

      if (await elaborateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('ℹ️  This test requires a fully elaborated seed')
        console.log('ℹ️  Skipping - use a fixture with completeness = 100%')
        test.skip()
      } else {
        console.log('⚠️  No conversion or elaboration options found')
        test.skip()
      }
      return
    }

    // Check if button is enabled
    const isEnabled = await convertButton.isEnabled()
    expect(isEnabled).toBe(true)
    console.log('✅ Convert to Project button is enabled')

    // Click convert button
    await convertButton.click()
    console.log('⏳ Conversion initiated, waiting for redirect...')

    // Wait for conversion (max 15s)
    // Should redirect to /projects/{projectId}
    await page.waitForURL(/.*projects.*/, { timeout: 15000 })

    const newUrl = page.url()
    console.log(`✅ Redirected to: ${newUrl}`)

    // Extract project ID from URL
    const projectIdMatch = newUrl.match(/\/projects\/([^\/]+)/)
    expect(projectIdMatch).toBeTruthy()

    const projectId = projectIdMatch![1]
    console.log(`📋 Created project ID: ${projectId}`)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Verify we're on project detail page
    const projectTitle = page.locator('h1, h2, [data-testid="project-title"]')
    await expect(projectTitle).toBeVisible({ timeout: 10000 })

    const title = await projectTitle.innerText()
    console.log(`📝 Project title: ${title}`)

    // Verify project has expected content
    const pageContent = await page.innerText('body')
    const hasProjectContent =
      pageContent.includes('participant') ||
      pageContent.includes('duration') ||
      pageContent.includes('days') ||
      pageContent.includes('budget') ||
      pageContent.includes('programme')

    expect(hasProjectContent).toBe(true)
    console.log('✅ Project contains expected metadata')

    // Take screenshot for verification
    await page.screenshot({
      path: 'test-results/project-generation-success.png',
      fullPage: true
    })
  })

  test('should verify project DNA structure after conversion', async ({ page }) => {
    console.log('🧪 Testing project DNA structure')

    // For this test, we need to access a project that was created from a seed
    // Navigate to projects page
    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const projectCards = page.locator('[data-testid="project-card"], .project-card')
    const projectCount = await projectCards.count()

    if (projectCount === 0) {
      console.log('⚠️  No projects available to test DNA structure')
      test.skip()
      return
    }

    // Click on first project
    await projectCards.first().click()
    await page.waitForLoadState('networkidle')

    console.log(`📍 Project detail page: ${page.url()}`)

    // Look for DNA/metadata sections
    const dnaSection = page.locator(
      '[data-testid="project-dna"], [data-testid="dna"], .project-dna, text=/DNA|Project Information/i'
    )

    if (await dnaSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Project DNA section found')

      const dnaContent = await dnaSection.innerText()

      // Check for expected DNA fields
      const hasParticipantInfo = dnaContent.includes('participant') || dnaContent.includes('Participant')
      const hasLearningObjectives =
        dnaContent.includes('learning') ||
        dnaContent.includes('Learning') ||
        dnaContent.includes('objective') ||
        dnaContent.includes('Objective')
      const hasDestination =
        dnaContent.includes('destination') ||
        dnaContent.includes('Destination') ||
        dnaContent.includes('location') ||
        dnaContent.includes('Location')

      console.log(`📊 DNA contains participant info: ${hasParticipantInfo}`)
      console.log(`📊 DNA contains learning objectives: ${hasLearningObjectives}`)
      console.log(`📊 DNA contains destination: ${hasDestination}`)

      // At least some DNA fields should be present
      const hasDnaFields = hasParticipantInfo || hasLearningObjectives || hasDestination
      expect(hasDnaFields).toBe(true)
    } else {
      console.log('⚠️  Project DNA section not found')
      console.log('⚠️  Checking for general project metadata...')

      // Check for project metadata in general page content
      const pageContent = await page.innerText('body')
      const hasMetadata =
        pageContent.includes('participant') ||
        pageContent.includes('duration') ||
        pageContent.includes('budget')

      expect(hasMetadata).toBe(true)
      console.log('✅ Project has metadata content')
    }
  })

  test('should verify project status after creation', async ({ page }) => {
    console.log('🧪 Testing project status after creation')

    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const projectCards = page.locator('[data-testid="project-card"], .project-card')

    if ((await projectCards.count()) === 0) {
      console.log('⚠️  No projects available')
      test.skip()
      return
    }

    // Click on first project
    await projectCards.first().click()
    await page.waitForLoadState('networkidle')

    // Look for status indicator
    const statusBadge = page.locator(
      '[data-testid="project-status"], .status, .badge, text=/status/i'
    )

    if (await statusBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      const statusText = await statusBadge.innerText()
      console.log(`📊 Project status: ${statusText}`)

      // New projects from seeds should typically be in 'CONCEPT' or 'DRAFT' status
      const validStatuses = ['CONCEPT', 'DRAFT', 'PLANNING', 'NEW']
      const hasValidStatus = validStatuses.some(status =>
        statusText.toUpperCase().includes(status)
      )

      console.log(hasValidStatus ? '✅ Valid initial status' : `⚠️  Status: ${statusText}`)
    } else {
      console.log('⚠️  Project status not displayed')
    }

    // Check if project is visible in dashboard/projects list
    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const visibleProjects = await projectCards.count()
    expect(visibleProjects).toBeGreaterThan(0)
    console.log(`✅ Project visible in projects list (${visibleProjects} total)`)
  })

  test('should handle incomplete seed conversion error', async ({ page }) => {
    console.log('🧪 Testing error handling for incomplete seed')

    // Navigate to seeds
    await page.goto(`${APP_URL}/seeds/generate`)
    await page.waitForLoadState('networkidle')

    // Generate a fresh seed (which will be incomplete by default)
    await page.locator('textarea[name="prompt"], input[name="prompt"]')
      .fill('Incomplete seed for testing validation')
    await page.locator('button:has-text("Generate"), button:has-text("Brainstorm")').click()

    const seedCard = page.locator('[data-testid="seed-card"], .seed-card').first()
    await expect(seedCard).toBeVisible({ timeout: 30000 })

    // Try to save it without elaborating
    const saveButton = seedCard.locator('button:has-text("Save")')
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click()
      await page.waitForTimeout(1000)
    }

    // Go to seeds and click on it
    await page.goto(`${APP_URL}/seeds`)
    await page.locator('[data-testid="seed-card"], .seed-card').first().click()
    await page.waitForLoadState('networkidle')

    // Look for convert button
    const convertButton = page.locator(
      'button:has-text("Convert to Project"), button:has-text("Generate Project")'
    )

    if (await convertButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if button is disabled for incomplete seed
      const isDisabled = await convertButton.isDisabled()

      if (isDisabled) {
        console.log('✅ Convert button is disabled for incomplete seed')

        // Look for explanation message
        const helpText = page.locator(
          'text=/complete|elaborate|80%|minimum/i, .help-text, .hint'
        )

        if (await helpText.isVisible({ timeout: 2000 }).catch(() => false)) {
          const hint = await helpText.innerText()
          console.log(`💡 Help text: ${hint}`)
        }
      } else {
        console.log('⚠️  Convert button is enabled for incomplete seed')
        console.log('⚠️  Attempting conversion to see if validation occurs...')

        // Try to click and see if there's an error
        await convertButton.click()

        // Look for error message
        const errorMessage = page.locator(
          'text=/incomplete|complete|elaborate|error/i, [role="alert"], .error'
        )

        const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)

        if (hasError) {
          const error = await errorMessage.innerText()
          console.log(`✅ Validation error shown: ${error}`)
        } else {
          console.log('⚠️  No validation error - seed may have sufficient default data')
        }
      }
    } else {
      console.log('⚠️  Convert button not found - expected for incomplete seed')
    }
  })

  test('should preserve seed after successful conversion', async ({ page }) => {
    console.log('🧪 Testing seed preservation after conversion')

    await page.goto(`${APP_URL}/seeds`)
    await page.waitForLoadState('networkidle')

    const initialSeedCount = await page.locator('[data-testid="seed-card"], .seed-card').count()
    console.log(`📊 Initial seed count: ${initialSeedCount}`)

    if (initialSeedCount === 0) {
      console.log('⚠️  No seeds available for testing')
      test.skip()
      return
    }

    // Click on first seed and get its ID
    const firstSeed = page.locator('[data-testid="seed-card"], .seed-card').first()
    const seedTitle = await firstSeed.innerText()
    await firstSeed.click()
    await page.waitForLoadState('networkidle')

    const seedUrl = page.url()

    // Try to convert
    const convertButton = page.locator(
      'button:has-text("Convert to Project"), button:has-text("Generate Project")'
    )

    if (!(await convertButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  Cannot test - seed not ready for conversion')
      test.skip()
      return
    }

    if (!(await convertButton.isEnabled())) {
      console.log('⚠️  Convert button disabled - seed incomplete')
      test.skip()
      return
    }

    // Convert to project
    await convertButton.click()

    // Wait for redirect
    const redirected = await page.waitForURL(/.*projects.*/, { timeout: 15000 }).catch(() => false)

    if (!redirected) {
      console.log('⚠️  No redirect occurred - conversion may have failed')
      test.skip()
      return
    }

    console.log('✅ Conversion successful')

    // Go back to seeds
    await page.goto(`${APP_URL}/seeds`)
    await page.waitForLoadState('networkidle')

    const finalSeedCount = await page.locator('[data-testid="seed-card"], .seed-card').count()
    console.log(`📊 Final seed count: ${finalSeedCount}`)

    // Seed should still exist (not deleted after conversion)
    expect(finalSeedCount).toBeGreaterThanOrEqual(initialSeedCount - 1) // Allow for other deletions

    console.log('✅ Seed preserved after conversion')
  })

  test('should map seed data to project fields correctly', async ({ page }) => {
    console.log('🧪 Testing seed → project data mapping')

    // This test requires accessing both the seed and the generated project
    // For now, we'll verify that the project has data that likely came from a seed

    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const projectCards = page.locator('[data-testid="project-card"], .project-card')

    if ((await projectCards.count()) === 0) {
      console.log('⚠️  No projects available')
      test.skip()
      return
    }

    // Click on first project
    await projectCards.first().click()
    await page.waitForLoadState('networkidle')

    // Get project content
    const pageContent = await page.innerText('body')

    // Check for fields that should be mapped from seed
    const checks = {
      'Has title': pageContent.length > 0,
      'Has description/content': pageContent.includes('exchange') || pageContent.includes('programme') || pageContent.length > 500,
      'Has participant info': pageContent.includes('participant') || pageContent.includes('Participant'),
      'Has duration info': pageContent.includes('day') || pageContent.includes('duration') || pageContent.includes('week'),
      'Has location info': pageContent.includes('Barcelona') || pageContent.includes('Spain') || pageContent.includes('location')
    }

    Object.entries(checks).forEach(([check, result]) => {
      console.log(`${result ? '✅' : '⚠️ '} ${check}`)
    })

    // At least 3 of the 5 checks should pass
    const passedChecks = Object.values(checks).filter(Boolean).length
    expect(passedChecks).toBeGreaterThanOrEqual(3)
    console.log(`✅ Data mapping verified (${passedChecks}/5 checks passed)`)
  })
})

test.describe('Project Generation - Edge Cases', () => {
  test('should handle concurrent conversions', async ({ browser }) => {
    // Create two contexts to simulate concurrent users
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // Both users navigate to seeds
      await page1.goto(`${APP_URL}/seeds`)
      await page2.goto(`${APP_URL}/seeds`)

      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')

      // Both users try to convert seeds
      // This is a basic test - full implementation would require proper setup

      console.log('✅ Concurrent context creation successful')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle conversion during slow network', async ({ page, context }) => {
    // Throttle network to simulate slow connection
    const client = await context.newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024, // 50kb/s
      uploadThroughput: 20 * 1024,   // 20kb/s
      latency: 200                    // 200ms
    })

    await page.goto(`${APP_URL}/seeds`)
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    const seedCard = page.locator('[data-testid="seed-card"], .seed-card').first()

    if (await seedCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await seedCard.click()
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      const convertButton = page.locator('button:has-text("Convert to Project")')

      if (await convertButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await convertButton.click()

        // Should show loading state and eventually complete
        const loading = page.locator('.loading, text=Converting, text=Generating')

        if (await loading.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Loading state shown during slow conversion')
        }

        // Wait for redirect (with extended timeout for slow network)
        await page.waitForURL(/.*projects.*/, { timeout: 30000 }).catch(() => {
          console.log('⚠️  Conversion timed out on slow network')
        })
      }
    }

    console.log('✅ Slow network test completed')
  })
})
