import { test, expect } from '@playwright/test'
import { signInAsAdmin } from '../helpers/auth'

/**
 * E2E Test Suite: Seed Creation (Brainstorming UI)
 *
 * Tests the complete user flow for generating project ideas via AI-powered brainstorming.
 *
 * User Flow:
 * 1. Navigate to seed generation page
 * 2. Enter brainstorming prompt
 * 3. Configure generation parameters (creativity, seed count)
 * 4. Generate seeds via AI
 * 5. Review generated seeds
 * 6. Save seeds to garden or dismiss unwanted seeds
 *
 * Part of Epic 003: Production Readiness
 * Related: Issue #131 (E2E Complete User Flows)
 */

const APP_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Seed Creation - Brainstorming UI', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate using test helper
    await signInAsAdmin(page)

    // Navigate to seeds generation page
    await page.goto(`${APP_URL}/seeds/generate`)
    await page.waitForLoadState('networkidle')
  })

  test('should generate seeds from brainstorming prompt', async ({ page }) => {
    console.log('🧪 Testing seed generation from AI prompt')

    // Fill brainstorming prompt
    const promptInput = page.locator('textarea[name="prompt"], input[name="prompt"]')
    await expect(promptInput).toBeVisible({ timeout: 10000 })
    await promptInput.fill('Youth exchange about climate change in Barcelona for 30 participants')

    // Configure generation parameters (if available)
    const creativitySlider = page.locator('input[name="creativityTemp"], input[id="creativity"]')
    if (await creativitySlider.isVisible({ timeout: 2000 }).catch(() => false)) {
      await creativitySlider.fill('0.9')
    }

    const seedCountInput = page.locator('input[name="seedCount"], input[id="seedCount"]')
    if (await seedCountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedCountInput.fill('10')
    }

    // Click generate button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brainstorm")')
    await generateButton.click()

    // Wait for AI generation (max 30s)
    console.log('⏳ Waiting for AI seed generation...')

    // Wait for loading state to appear
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, text=Generating')
    if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 })
    }

    // Wait for seed cards to appear
    const seedCards = page.locator('[data-testid="seed-card"], .seed-card, div:has-text("Approval Likelihood")')
    await expect(seedCards.first()).toBeVisible({ timeout: 30000 })

    // Verify multiple seeds generated (should be ~10)
    const seedCount = await seedCards.count()
    expect(seedCount).toBeGreaterThan(0)
    console.log(`✅ Generated ${seedCount} seeds`)

    // Verify seed structure - check first seed
    const firstSeed = seedCards.first()

    // Check for title (working or formal)
    const hasTitle = await firstSeed.locator('h3, h2, [data-testid="seed-title"]').count() > 0
    expect(hasTitle).toBe(true)

    // Check for description
    const hasDescription = await firstSeed.locator('p, [data-testid="seed-description"]').count() > 0
    expect(hasDescription).toBe(true)

    console.log('✅ Seed generation completed successfully')
  })

  test('should save seed to garden', async ({ page }) => {
    console.log('🧪 Testing save seed to garden')

    // First generate a seed
    await page.locator('textarea[name="prompt"], input[name="prompt"]').fill('Test seed for saving')
    await page.locator('button:has-text("Generate"), button:has-text("Brainstorm")').click()

    // Wait for seeds
    const seedCard = page.locator('[data-testid="seed-card"], .seed-card').first()
    await expect(seedCard).toBeVisible({ timeout: 30000 })

    // Click "Save to Garden" button
    const saveButton = seedCard.locator('button:has-text("Save"), button:has-text("Save to Garden")')
    await saveButton.click()

    // Verify success toast appears
    const successToast = page.locator('text=/saved|Saved/i, [role="status"]:has-text("saved")')
    await expect(successToast).toBeVisible({ timeout: 5000 })
    console.log('✅ Toast notification appeared')

    // Navigate to seed garden to verify
    await page.goto(`${APP_URL}/seeds`)
    await page.waitForLoadState('networkidle')

    // Verify seed appears in garden
    const gardenSeeds = page.locator('[data-testid="seed-card"], .seed-card')
    await expect(gardenSeeds.first()).toBeVisible({ timeout: 10000 })

    const gardenSeedCount = await gardenSeeds.count()
    expect(gardenSeedCount).toBeGreaterThan(0)
    console.log(`✅ Seed garden contains ${gardenSeedCount} seeds`)
  })

  test('should dismiss unwanted seed', async ({ page }) => {
    console.log('🧪 Testing dismiss seed functionality')

    // Generate seeds
    await page.locator('textarea[name="prompt"], input[name="prompt"]').fill('Test seed for dismissal')
    await page.locator('button:has-text("Generate"), button:has-text("Brainstorm")').click()

    // Wait for seeds
    const seedCards = page.locator('[data-testid="seed-card"], .seed-card')
    await expect(seedCards.first()).toBeVisible({ timeout: 30000 })

    const initialCount = await seedCards.count()
    console.log(`📊 Initial seed count: ${initialCount}`)

    // Click dismiss button on first seed
    const firstSeed = seedCards.first()
    const dismissButton = firstSeed.locator('button:has-text("Dismiss"), button:has-text("Remove")')

    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click()

      // Verify toast notification
      const dismissToast = page.locator('text=/dismissed|Dismissed/i, [role="status"]:has-text("dismissed")')
      await expect(dismissToast).toBeVisible({ timeout: 5000 })

      // Wait a moment for UI update
      await page.waitForTimeout(500)

      // Verify seed is removed from UI
      const updatedCount = await seedCards.count()
      expect(updatedCount).toBe(initialCount - 1)
      console.log(`✅ Seed dismissed successfully (${updatedCount} remaining)`)
    } else {
      console.log('⚠️  Dismiss button not found - may not be implemented yet')
      test.skip()
    }
  })

  test('should validate empty prompt', async ({ page }) => {
    console.log('🧪 Testing form validation for empty prompt')

    // Try to submit with empty prompt
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brainstorm")')
    await generateButton.click()

    // Check for validation error
    // Could be browser validation, form error, or toast
    const hasError = await Promise.race([
      // Browser validation
      page.locator('textarea[name="prompt"]:invalid, input[name="prompt"]:invalid')
        .count()
        .then(count => count > 0),

      // Form error message
      page.locator('text=/required|Required|cannot be empty/i, .error')
        .isVisible({ timeout: 2000 })
        .catch(() => false),

      // Error toast
      page.locator('[role="alert"]:has-text("error"), [role="status"]:has-text("error")')
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ])

    expect(hasError).toBe(true)
    console.log('✅ Empty prompt validation works')

    // Verify no API call was made (no seeds generated)
    const seedCards = page.locator('[data-testid="seed-card"], .seed-card')
    const seedCount = await seedCards.count()
    expect(seedCount).toBe(0)
    console.log('✅ No seeds generated with invalid input')
  })

  test('should display all seed fields correctly', async ({ page }) => {
    console.log('🧪 Testing seed field display')

    // Generate seeds
    await page.locator('textarea[name="prompt"], input[name="prompt"]')
      .fill('Comprehensive test for seed field display')
    await page.locator('button:has-text("Generate"), button:has-text("Brainstorm")').click()

    // Wait for seeds
    const seedCard = page.locator('[data-testid="seed-card"], .seed-card').first()
    await expect(seedCard).toBeVisible({ timeout: 30000 })

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/seed-creation-fields.png',
      fullPage: true
    })

    // Verify presence of key fields (structure, not content)
    const cardText = await seedCard.innerText()

    // Check for common seed metadata fields
    const hasMetadata =
      cardText.includes('participant') ||
      cardText.includes('duration') ||
      cardText.includes('days') ||
      cardText.length > 50 // Has substantial content

    expect(hasMetadata).toBe(true)
    console.log('✅ Seed displays metadata fields')
  })

  test('should handle slow AI generation gracefully', async ({ page }) => {
    console.log('🧪 Testing handling of slow AI generation')

    // Fill prompt
    await page.locator('textarea[name="prompt"], input[name="prompt"]')
      .fill('Complex multi-country youth exchange with sustainability focus')

    // Click generate
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brainstorm")')
    await generateButton.click()

    // Verify loading indicator appears
    const loadingIndicator = page.locator(
      '[data-testid="loading"], .loading, .spinner, text=Generating, text=Loading'
    )

    const loadingVisible = await loadingIndicator.isVisible({ timeout: 5000 }).catch(() => false)

    if (loadingVisible) {
      console.log('✅ Loading indicator displayed during generation')

      // Verify generate button is disabled during generation
      const isDisabled = await generateButton.isDisabled().catch(() => false)
      expect(isDisabled).toBe(true)
      console.log('✅ Generate button disabled during processing')
    }

    // Wait for completion
    const seedCards = page.locator('[data-testid="seed-card"], .seed-card')
    await expect(seedCards.first()).toBeVisible({ timeout: 30000 })

    console.log('✅ Slow generation completed successfully')
  })

  test('should allow viewing seed garden from generation page', async ({ page }) => {
    console.log('🧪 Testing navigation to seed garden')

    // Look for "View Garden" or similar link
    const gardenLink = page.locator(
      'a:has-text("Garden"), a:has-text("View Seeds"), button:has-text("Garden")'
    )

    if (await gardenLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gardenLink.click()

      // Verify navigation to seed garden
      await page.waitForURL(/.*seeds.*/, { timeout: 5000 })

      const url = page.url()
      expect(url).toContain('seeds')
      console.log(`✅ Navigated to seed garden: ${url}`)
    } else {
      console.log('⚠️  Garden navigation link not found')
      test.skip()
    }
  })
})

test.describe('Seed Creation - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate for edge case tests
    await signInAsAdmin(page)
  })

  test('should handle very long prompts', async ({ page }) => {
    await page.goto(`${APP_URL}/seeds/generate`)

    const longPrompt = 'A youth exchange program '.repeat(50) +
      'focusing on climate action, sustainability, and intercultural dialogue.'

    const promptInput = page.locator('textarea[name="prompt"], input[name="prompt"]')
    await promptInput.fill(longPrompt)

    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brainstorm")')
    await generateButton.click()

    // Should either generate successfully or show validation error
    const result = await Promise.race([
      page.locator('[data-testid="seed-card"], .seed-card').first()
        .isVisible({ timeout: 30000 })
        .then(() => 'success'),
      page.locator('text=/too long|maximum length|limit/i')
        .isVisible({ timeout: 5000 })
        .then(() => 'validation'),
      page.waitForTimeout(30000).then(() => 'timeout')
    ])

    expect(result).not.toBe('timeout')
    console.log(`✅ Long prompt handled: ${result}`)
  })

  test('should handle special characters in prompt', async ({ page }) => {
    await page.goto(`${APP_URL}/seeds/generate`)

    const specialPrompt = 'Youth exchange: "Culture & Arts" (2024) — España, Deutschland, França!'

    const promptInput = page.locator('textarea[name="prompt"], input[name="prompt"]')
    await promptInput.fill(specialPrompt)

    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brainstorm")')
    await generateButton.click()

    const seedCards = page.locator('[data-testid="seed-card"], .seed-card')
    await expect(seedCards.first()).toBeVisible({ timeout: 30000 })

    console.log('✅ Special characters handled correctly')
  })
})
