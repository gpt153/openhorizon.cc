import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle
} from 'docx'
import type { ReportProject, ExportResult } from './types.js'

export async function generateWordReport(
  project: ReportProject
): Promise<ExportResult> {
  // Create phase table rows
  const phaseTableRows = [
    // Header row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Phase Name', bold: true })],
          shading: { fill: '0066CC', color: 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Type', bold: true })],
          shading: { fill: '0066CC', color: 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Status', bold: true })],
          shading: { fill: '0066CC', color: 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Budget', bold: true })],
          shading: { fill: '0066CC', color: 'FFFFFF' }
        })
      ]
    }),
    // Data rows
    ...project.phases.map(phase => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(phase.name)] }),
        new TableCell({ children: [new Paragraph(phase.type)] }),
        new TableCell({ children: [new Paragraph(phase.status)] }),
        new TableCell({
          children: [new Paragraph(`$${Number(phase.budget_allocated).toLocaleString()}`)]
        })
      ]
    }))
  ]

  const doc = new Document({
    creator: 'Open Horizon Project Pipeline',
    title: `${project.name} - Project Report`,
    description: 'Comprehensive project report',
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: [
        // Title
        new Paragraph({
          text: project.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Subtitle
        new Paragraph({
          children: [
            new TextRun({
              text: `Project Report - Generated ${new Date().toLocaleDateString()}`,
              italics: true,
              color: '666666'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }),

        // Project Overview section
        new Paragraph({
          text: 'Project Overview',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Type: ', bold: true }),
            new TextRun(project.type)
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Status: ', bold: true }),
            new TextRun(project.status)
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Location: ', bold: true }),
            new TextRun(project.location)
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Participants: ', bold: true }),
            new TextRun(project.participants_count.toString())
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Budget: ', bold: true }),
            new TextRun(`$${Number(project.budget_total).toLocaleString()}`)
          ],
          spacing: { after: 400 }
        }),

        // Description
        ...(project.description ? [
          new Paragraph({
            text: 'Description',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: project.description,
            spacing: { after: 400 }
          })
        ] : []),

        // Phases section
        new Paragraph({
          text: 'Project Phases',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: phaseTableRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
          }
        })
      ]
    }]
  })

  const buffer = await Packer.toBuffer(doc)

  return {
    buffer,
    filename: `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
}
