import { chromium } from 'playwright'
import { renderFormAsHTML } from './html-renderer.js'
import type { ApplicationFormData } from '../application-forms.types.js'

/**
 * Export application form as PDF using Playwright
 */
export async function exportFormAsPDF(formData: ApplicationFormData): Promise<Buffer> {
  console.log('[PDFExporter] Generating PDF for form:', formData.id)

  let browser
  try {
    // Generate HTML content
    const htmlContent = renderFormAsHTML(formData)

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    // Create new page
    const page = await browser.newPage()

    // Set viewport for consistent rendering
    await page.setViewportSize({
      width: 1200,
      height: 1600
    })

    // Set HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })

    console.log('[PDFExporter] PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    return pdfBuffer
  } catch (error) {
    console.error('[PDFExporter] Failed to generate PDF:', error)
    throw new Error('Failed to export form as PDF')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
