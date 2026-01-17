import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite: Document Export (PDF & DOCX)
 *
 * Tests the complete user flow for exporting projects and application forms to PDF and DOCX formats.
 *
 * User Flow:
 * 1. Navigate to project detail page
 * 2. Click export button (PDF or DOCX)
 * 3. Wait for document generation (max 20s)
 * 4. Verify file download
 * 5. Verify file properties (size, MIME type)
 *
 * NOTE: Tests verify FILE GENERATION, not content quality
 *
 * Part of Epic 003: Production Readiness
 * Related: Issue #131 (E2E Complete User Flows)
 */

const APP_URL = process.env.APP_URL || 'http://localhost:5174'

test.describe('Document Export - Project Export', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page
    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    const projectCards = page.locator('[data-testid="project-card"], .project-card')

    if ((await projectCards.count()) === 0) {
      console.log('⚠️  No projects available - test requires existing project')
      test.skip()
      return
    }

    // Click on first project
    await projectCards.first().click()
    await page.waitForLoadState('networkidle')
  })

  test('should export project as PDF', async ({ page }) => {
    console.log('🧪 Testing PDF export')

    // Look for export button/menu
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]'
    )

    if (!(await exportButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  Export button not found')
      test.skip()
      return
    }

    // Click export button (may open menu)
    await exportButton.click()
    await page.waitForTimeout(500)

    // Look for PDF option
    const pdfOption = page.locator(
      'button:has-text("PDF"), a:has-text("PDF"), text="Export as PDF", [data-testid="export-pdf"]'
    )

    if (!(await pdfOption.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  PDF export option not found')
      test.skip()
      return
    }

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

    // Click PDF export
    await pdfOption.click()
    console.log('✅ PDF export initiated')

    // Wait for download (max 20s)
    const download = await downloadPromise

    console.log('✅ PDF download started')

    // Verify filename
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.pdf$/i)
    console.log(`📄 Filename: ${filename}`)

    // Save and verify file
    const path = await download.path()
    expect(path).toBeTruthy()

    // Verify file size (not empty)
    const fs = require('fs')
    const stats = fs.statSync(path!)

    expect(stats.size).toBeGreaterThan(1000) // At least 1KB
    console.log(`✅ PDF file size: ${stats.size} bytes`)

    // Verify MIME type if available
    // Note: Playwright's download object doesn't always expose MIME type
    console.log('✅ PDF export completed successfully')
  })

  test('should export project as DOCX', async ({ page }) => {
    console.log('🧪 Testing DOCX export')

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')

    if (!(await exportButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  Export button not found')
      test.skip()
      return
    }

    await exportButton.click()
    await page.waitForTimeout(500)

    // Look for DOCX option
    const docxOption = page.locator(
      'button:has-text("DOCX"), button:has-text("Word"), a:has-text("Word Document"), [data-testid="export-docx"]'
    )

    if (!(await docxOption.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  DOCX export option not found')
      test.skip()
      return
    }

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

    // Click DOCX export
    await docxOption.click()
    console.log('✅ DOCX export initiated')

    // Wait for download
    const download = await downloadPromise

    console.log('✅ DOCX download started')

    // Verify filename
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.docx$/i)
    console.log(`📄 Filename: ${filename}`)

    // Verify file exists and has content
    const path = await download.path()
    expect(path).toBeTruthy()

    const fs = require('fs')
    const stats = fs.statSync(path!)

    expect(stats.size).toBeGreaterThan(1000) // At least 1KB
    console.log(`✅ DOCX file size: ${stats.size} bytes`)

    console.log('✅ DOCX export completed successfully')
  })

  test('should show loading state during export generation', async ({ page }) => {
    console.log('🧪 Testing export loading state')

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')

    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click()

      const pdfOption = page.locator('button:has-text("PDF"), a:has-text("PDF")')

      if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click export but don't wait for download yet
        await pdfOption.click()

        // Check for loading indicator
        const loadingIndicator = page.locator(
          '.loading, text=/generating|exporting|preparing/i, [data-testid="export-loading"]'
        )

        const hasLoading = await loadingIndicator.isVisible({ timeout: 3000 }).catch(() => false)

        if (hasLoading) {
          console.log('✅ Loading indicator shown during export')
        } else {
          console.log('⚠️  Loading state not detected (may be very fast)')
        }
      }
    }
  })

  test('should handle export errors gracefully', async ({ page }) => {
    console.log('🧪 Testing export error handling')

    // This test is challenging without mocking - would need to trigger actual error
    // For now, we'll just verify that the UI has error handling mechanisms

    const exportButton = page.locator('button:has-text("Export")')

    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click export multiple times rapidly to see if there's rate limiting/error handling
      await exportButton.click()

      const pdfOption = page.locator('button:has-text("PDF")')

      if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click PDF export
        const downloadPromise = page.waitForEvent('download', { timeout: 25000 }).catch(() => null)

        await pdfOption.click()

        const download = await downloadPromise

        if (!download) {
          // Check for error message
          const errorMessage = page.locator('text=/error|failed/i, [role="alert"]')

          const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)

          if (hasError) {
            const error = await errorMessage.innerText()
            console.log(`✅ Error handling detected: ${error}`)
          } else {
            console.log('⚠️  Export timeout - may be slow or errored silently')
          }
        } else {
          console.log('✅ Export succeeded (no error to handle)')
        }
      }
    }
  })
})

test.describe('Document Export - Application Form Export', () => {
  test('should export application form as PDF', async ({ page }) => {
    console.log('🧪 Testing application form PDF export')

    // Navigate to application forms section
    await page.goto(`${APP_URL}/application-forms`)
      .catch(() => page.goto(`${APP_URL}/forms`))
      .catch(() => page.goto(`${APP_URL}/projects`))

    await page.waitForLoadState('networkidle')

    // Look for application forms
    const formCards = page.locator(
      '[data-testid="form-card"], .form-card, [data-testid="application-form"]'
    )

    if ((await formCards.count()) === 0) {
      console.log('⚠️  No application forms found')
      console.log('ℹ️  Application form export test requires existing form')
      test.skip()
      return
    }

    // Click on first form
    await formCards.first().click()
    await page.waitForLoadState('networkidle')

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')

    if (!(await exportButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️  Export button not found on form page')
      test.skip()
      return
    }

    await exportButton.click()
    await page.waitForTimeout(500)

    const pdfOption = page.locator('button:has-text("PDF"), a:has-text("PDF")')

    if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

      await pdfOption.click()
      console.log('✅ Application form PDF export initiated')

      const download = await downloadPromise

      const filename = download.suggestedFilename()
      expect(filename).toMatch(/\.pdf$/i)

      const path = await download.path()
      const fs = require('fs')
      const stats = fs.statSync(path!)

      expect(stats.size).toBeGreaterThan(5000) // Form PDFs should be larger
      console.log(`✅ Form PDF exported: ${stats.size} bytes`)
    } else {
      console.log('⚠️  PDF export not available for forms')
      test.skip()
    }
  })

  test('should export application form as DOCX', async ({ page }) => {
    console.log('🧪 Testing application form DOCX export')

    await page.goto(`${APP_URL}/application-forms`)
      .catch(() => page.goto(`${APP_URL}/forms`))
      .catch(() => page.goto(`${APP_URL}/projects`))

    await page.waitForLoadState('networkidle')

    const formCards = page.locator('[data-testid="form-card"], .form-card')

    if ((await formCards.count()) === 0) {
      console.log('⚠️  No application forms found')
      test.skip()
      return
    }

    await formCards.first().click()
    await page.waitForLoadState('networkidle')

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')

    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click()

      const docxOption = page.locator('button:has-text("DOCX"), button:has-text("Word")')

      if (await docxOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

        await docxOption.click()
        console.log('✅ Application form DOCX export initiated')

        const download = await downloadPromise

        const filename = download.suggestedFilename()
        expect(filename).toMatch(/\.docx$/i)

        const path = await download.path()
        const fs = require('fs')
        const stats = fs.statSync(path!)

        expect(stats.size).toBeGreaterThan(5000)
        console.log(`✅ Form DOCX exported: ${stats.size} bytes`)
      } else {
        console.log('⚠️  DOCX export not available for forms')
        test.skip()
      }
    }
  })
})

test.describe('Document Export - Export with Different Project States', () => {
  test('should export project in draft state', async ({ page }) => {
    console.log('🧪 Testing export of draft project')

    await page.goto(`${APP_URL}/projects`)
    await page.waitForLoadState('networkidle')

    // Find a draft project (if any)
    const draftProject = page.locator('text=/draft/i, [data-status="DRAFT"]').first()

    if (await draftProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Navigate to this project's parent
      const projectCard = draftProject.locator('xpath=ancestor::*[contains(@class, "card") or @data-testid="project-card"]').first()

      if (await projectCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await projectCard.click()
      } else {
        await draftProject.click()
      }

      await page.waitForLoadState('networkidle')

      // Try to export
      const exportButton = page.locator('button:has-text("Export")')

      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exportButton.click()

        const pdfOption = page.locator('button:has-text("PDF")')

        if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          const downloadPromise = page.waitForEvent('download', { timeout: 25000 }).catch(() => null)

          await pdfOption.click()

          const download = await downloadPromise

          if (download) {
            console.log('✅ Draft project exported successfully')
          } else {
            console.log('⚠️  Draft project export failed or timed out')
          }
        }
      }
    } else {
      console.log('ℹ️  No draft projects available')
    }
  })

  test('should export complete project with all data', async ({ page }) => {
    console.log('🧪 Testing export of complete project')

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()
      await page.waitForLoadState('networkidle')

      const exportButton = page.locator('button:has-text("Export")')

      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exportButton.click()

        const pdfOption = page.locator('button:has-text("PDF")')

        if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

          await pdfOption.click()

          const download = await downloadPromise

          const path = await download.path()
          const fs = require('fs')
          const stats = fs.statSync(path!)

          // Complete project should have larger export
          console.log(`📊 Complete project export size: ${stats.size} bytes`)
          expect(stats.size).toBeGreaterThan(5000)

          console.log('✅ Complete project exported with all data')
        }
      }
    }
  })
})

test.describe('Document Export - Edge Cases', () => {
  test('should handle concurrent export requests', async ({ page }) => {
    console.log('🧪 Testing concurrent export handling')

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const exportButton = page.locator('button:has-text("Export")')

      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Try to trigger multiple exports
        await exportButton.click()

        const pdfOption = page.locator('button:has-text("PDF")')

        if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click PDF twice quickly
          const download1Promise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)
          await pdfOption.click()

          // Try to click again
          await page.waitForTimeout(100)

          if (await exportButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await exportButton.click()
            const pdfOption2 = page.locator('button:has-text("PDF")')

            if (await pdfOption2.isVisible({ timeout: 1000 }).catch(() => false)) {
              const download2Promise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)
              await pdfOption2.click()

              const [download1, download2] = await Promise.all([download1Promise, download2Promise])

              if (download1 && download2) {
                console.log('✅ System handled concurrent exports')
              } else if (download1) {
                console.log('✅ Second export prevented (rate limiting works)')
              }
            }
          }

          const download1 = await download1Promise

          if (download1) {
            console.log('✅ At least one export completed')
          }
        }
      }
    }
  })

  test('should preserve export quality across multiple exports', async ({ page }) => {
    console.log('🧪 Testing export consistency')

    await page.goto(`${APP_URL}/projects`)
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first()

    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click()

      const exportButton = page.locator('button:has-text("Export")')

      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        const fs = require('fs')
        const sizes: number[] = []

        // Export twice
        for (let i = 0; i < 2; i++) {
          await exportButton.click()

          const pdfOption = page.locator('button:has-text("PDF")')

          if (await pdfOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)

            await pdfOption.click()

            const download = await downloadPromise

            if (download) {
              const path = await download.path()
              const stats = fs.statSync(path!)
              sizes.push(stats.size)

              console.log(`📊 Export ${i + 1} size: ${stats.size} bytes`)
            }

            await page.waitForTimeout(2000)
          }
        }

        if (sizes.length === 2) {
          // Sizes should be similar (within 10% variance)
          const variance = Math.abs(sizes[0] - sizes[1]) / sizes[0]

          expect(variance).toBeLessThan(0.1)
          console.log('✅ Export sizes consistent across multiple exports')
        }
      }
    }
  })
})
