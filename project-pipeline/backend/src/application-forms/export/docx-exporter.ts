import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import type { ApplicationFormData } from '../application-forms.types.js'

/**
 * Export application form as Word document (.docx)
 */
export async function exportFormAsDocx(formData: ApplicationFormData): Promise<Buffer> {
  console.log('[DocxExporter] Generating Word document for form:', formData.id)

  try {
    const sections: Paragraph[] = []

    // Title
    sections.push(
      new Paragraph({
        text: 'Erasmus+ Application Form',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    )

    // Subtitle
    const formTypeLabel =
      formData.form_type === 'KA1' ? 'Key Action 1 - Learning Mobility' :
      formData.form_type === 'KA2' ? 'Key Action 2 - Cooperation Partnerships' :
      'Custom Application'

    sections.push(
      new Paragraph({
        text: formTypeLabel,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )

    // Form metadata table
    sections.push(
      new Paragraph({
        text: 'Form Information',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    )

    const metadataTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: 'Form ID:', bold: true })] }),
            new TableCell({ children: [new Paragraph(formData.id)] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: 'Status:', bold: true })] }),
            new TableCell({ children: [new Paragraph(formData.status)] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: 'Created:', bold: true })] }),
            new TableCell({ children: [new Paragraph(new Date(formData.created_at).toLocaleDateString())] })
          ]
        })
      ]
    })
    sections.push(metadataTable as any)

    // AI-Generated Narratives
    if (formData.generated_narratives) {
      sections.push(
        new Paragraph({
          text: 'AI-Generated Project Narratives',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      )

      const narratives = formData.generated_narratives
      if (narratives.project_description) {
        sections.push(
          new Paragraph({
            text: 'Project Description',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            text: narratives.project_description,
            spacing: { after: 200 }
          })
        )
      }

      if (narratives.objectives) {
        sections.push(
          new Paragraph({
            text: 'Objectives',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            text: narratives.objectives,
            spacing: { after: 200 }
          })
        )
      }

      if (narratives.methodology) {
        sections.push(
          new Paragraph({
            text: 'Methodology',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            text: narratives.methodology,
            spacing: { after: 200 }
          })
        )
      }

      if (narratives.expected_impact) {
        sections.push(
          new Paragraph({
            text: 'Expected Impact',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            text: narratives.expected_impact,
            spacing: { after: 200 }
          })
        )
      }
    }

    // Application Details
    sections.push(
      new Paragraph({
        text: 'Application Details',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    )

    // Group and render form fields
    for (const [key, value] of Object.entries(formData.form_data)) {
      const label = formatFieldLabel(key)
      const formattedValue = formatFieldValue(value)

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true })
          ],
          spacing: { before: 100, after: 50 }
        })
      )
      sections.push(
        new Paragraph({
          text: formattedValue,
          spacing: { after: 100 }
        })
      )
    }

    // Footer
    sections.push(
      new Paragraph({
        text: '\nGenerated by Erasmus+ Project Pipeline Management System',
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 }
      })
    )
    sections.push(
      new Paragraph({
        text: new Date().toLocaleDateString(),
        alignment: AlignmentType.CENTER
      })
    )

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections
        }
      ]
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    console.log('[DocxExporter] Word document generated successfully, size:', buffer.length, 'bytes')

    return buffer
  } catch (error) {
    console.error('[DocxExporter] Failed to generate Word document:', error)
    throw new Error('Failed to export form as Word document')
  }
}

/**
 * Format field label from snake_case to Title Case
 */
function formatFieldLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  // Check if value looks like a date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      return date.toLocaleDateString()
    } catch {
      return String(value)
    }
  }

  return String(value)
}
