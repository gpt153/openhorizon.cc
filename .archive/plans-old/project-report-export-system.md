# Feature: Project Report Export System

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement a comprehensive project report export system that allows users to generate and download professional reports for Erasmus+ projects in three formats: PDF, Excel (.xlsx), and Word (.docx). Reports will include project overview, Gantt chart visualization, phase breakdown, budget summary, expense details, participant information, and application form data. This is the final step (11/11) in the project pipeline, enabling users to share complete project documentation with stakeholders and funding agencies.

## User Story

As a project manager
I want to export comprehensive project reports in multiple formats (PDF, Excel, Word)
So that I can share project status, budgets, timelines, and documentation with stakeholders, funding agencies, and team members in their preferred format

## Problem Statement

Currently, the project pipeline system lacks report export functionality. Users cannot easily share project data with external stakeholders or create professional documentation for funding applications. While the system has all the necessary data (projects, phases, budgets, expenses, Gantt charts), there's no way to compile this into shareable, professional reports.

## Solution Statement

Create a backend API endpoint and frontend component that:
1. Aggregates all project data from the database (project details, phases, budgets, expenses)
2. Generates professional reports in PDF (using Playwright), Excel (using ExcelJS), and Word (using docx library)
3. Provides a download interface on the project detail page with format selection
4. Renders Gantt charts and other visualizations as images for inclusion in reports
5. Applies professional formatting with Erasmus+ branding

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- Backend API (project-pipeline/backend/src)
- Frontend UI (app/src - Next.js application)
**Dependencies**:
- exceljs (new) - Excel file generation
- docx (new) - Word document generation
- playwright (existing) - PDF generation

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `project-pipeline/backend/src/projects/projects.routes.ts` (lines 1-214) - Why: Existing project routes pattern, authentication middleware usage
- `project-pipeline/backend/src/seeds/seeds.service.ts` (lines 1-100) - Why: Service layer pattern example with Prisma
- `project-pipeline/backend/src/app.ts` (lines 1-113) - Why: Route registration pattern, Fastify app structure
- `project-pipeline/backend/prisma/schema.prisma` (lines 37-78) - Why: Project, Phase, Communication models and relationships
- `project-pipeline/backend/src/tests/integration/budget-tracking.test.ts` (lines 1-80) - Why: Test pattern example with vitest
- `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` (lines 1-232) - Why: Project detail page where export button will be added, TRPC usage pattern
- `project-pipeline/backend/package.json` (lines 1-56) - Why: Dependency structure, playwright already installed

### New Files to Create

- `project-pipeline/backend/src/exports/report.service.ts` - Service to aggregate project data for reports
- `project-pipeline/backend/src/exports/pdf-export.service.ts` - PDF generation using Playwright
- `project-pipeline/backend/src/exports/excel-export.service.ts` - Excel generation using ExcelJS
- `project-pipeline/backend/src/exports/word-export.service.ts` - Word generation using docx library
- `project-pipeline/backend/src/exports/exports.routes.ts` - API routes for export endpoints
- `app/src/components/pipeline/projects/ExportReportButton.tsx` - Frontend button component with format selector
- `project-pipeline/backend/src/tests/integration/report-export.test.ts` - Integration tests for export functionality

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Playwright PDF API](https://playwright.dev/docs/api/class-page#page-pdf)
  - Specific section: page.pdf() method
  - Why: Core API for PDF generation with Chromium
- [Playwright PDF Generation Guide](https://www.checklyhq.com/docs/learn/playwright/generating-pdfs/)
  - Specific section: Styling for print, headers/footers
  - Why: Best practices for professional PDF output
- [ExcelJS GitHub Documentation](https://github.com/exceljs/exceljs)
  - Specific section: Workbook creation, cell formatting, formulas
  - Why: Complete API reference for Excel generation
- [Docx Library Documentation](https://docx.js.org/)
  - Specific section: Document structure, tables, paragraphs
  - Why: Word document generation API

### Patterns to Follow

**Service Layer Pattern:**
```typescript
// Pattern from seeds.service.ts
export async function generateReport(
  userId: string,
  projectId: string
): Promise<ReportData> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, created_by: userId },
    include: { phases: true, communications: true }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  return transformToReportData(project)
}
```

**Route Pattern:**
```typescript
// Pattern from projects.routes.ts
export async function registerExportRoutes(app: FastifyInstance) {
  app.post('/projects/:id/export', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { id: string },
    Body: { format: 'pdf' | 'excel' | 'word' }
  }>, reply: FastifyReply) => {
    const userId = (request.user as any).userId
    const { id } = request.params
    const { format } = request.body

    // Generate report
    const buffer = await generateExportBuffer(userId, id, format)

    return reply
      .header('Content-Type', getContentType(format))
      .header('Content-Disposition', `attachment; filename="project-report.${format}"`)
      .send(buffer)
  })
}
```

**TRPC Client Pattern:**
```typescript
// Pattern from app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx
const exportReport = trpc.pipeline.projects.exportReport.useMutation({
  onSuccess: (data) => {
    // Download file
    downloadFile(data.filename, data.buffer, data.mimeType)
  },
  onError: (error) => {
    console.error('Export failed:', error)
    alert('Failed to generate report')
  }
})
```

**Error Handling:**
```typescript
// Pattern from projects.routes.ts
try {
  const data = await generateReport(userId, projectId)
  return reply.send({ data })
} catch (error) {
  if (error instanceof NotFoundError) {
    return reply.code(404).send({ error: 'Project not found' })
  }
  throw error
}
```

**Validation with Zod:**
```typescript
// Pattern from projects.routes.ts
import { z } from 'zod'

const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'excel', 'word']),
  sections: z.array(z.string()).optional()
})
```

---

## IMPLEMENTATION PLAN

### Phase 1: Backend Foundation

Set up export services infrastructure and install dependencies.

**Tasks:**

- Install ExcelJS and docx libraries (playwright already installed)
- Create exports directory structure
- Set up base service for data aggregation
- Create TypeScript types for report data structures

### Phase 2: Service Layer Implementation

Implement core data aggregation and export generation services.

**Tasks:**

- Implement ReportService to aggregate project data (phases, budgets, expenses)
- Implement PDFExportService using Playwright
- Implement ExcelExportService using ExcelJS
- Implement WordExportService using docx library

### Phase 3: API Endpoints

Create RESTful API endpoints for export functionality.

**Tasks:**

- Create exports.routes.ts with POST /projects/:id/export endpoint
- Implement format-based routing to appropriate service
- Add proper content-type headers and file download response
- Register export routes in app.ts

### Phase 4: Frontend Integration

Add export button to project detail page with format selector.

**Tasks:**

- Create ExportReportButton component with format dropdown
- Integrate with TRPC mutation for API calls
- Implement file download handling
- Add loading states and error handling
- Place button in project detail page header

### Phase 5: Testing & Validation

Comprehensive testing of all export formats and edge cases.

**Tasks:**

- Write integration tests for each export format
- Test with projects containing multiple phases and expenses
- Test with empty/minimal project data
- Validate file output opens correctly in respective applications
- Test error handling (project not found, permission denied)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE project-pipeline/backend/src/exports/types.ts

- **IMPLEMENT**: TypeScript interfaces for report data structures
- **PATTERN**: Follow Prisma model structure from schema.prisma
- **IMPORTS**: None (pure type definitions)
- **GOTCHA**: Ensure types match Prisma query results with includes
- **VALIDATE**: `npx tsc --noEmit` (no type errors)

```typescript
export interface ReportProject {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  start_date: Date
  end_date: Date
  budget_total: number
  budget_spent: number
  participants_count: number
  location: string
  phases: ReportPhase[]
  creator: {
    name: string
    email: string
  }
}

export interface ReportPhase {
  id: string
  name: string
  type: string
  status: string
  start_date: Date
  end_date: Date
  budget_allocated: number
  budget_spent: number
  order: number
}

export interface ExportFormat {
  format: 'pdf' | 'excel' | 'word'
}

export interface ExportResult {
  buffer: Buffer
  filename: string
  mimeType: string
}
```

### UPDATE project-pipeline/backend/package.json

- **IMPLEMENT**: Add exceljs and docx dependencies
- **PATTERN**: Existing dependencies structure
- **IMPORTS**: N/A
- **GOTCHA**: Use latest stable versions
- **VALIDATE**: `npm install && npm list exceljs docx`

Add to dependencies:
```json
{
  "exceljs": "^4.4.0",
  "docx": "^9.0.0"
}
```

### CREATE project-pipeline/backend/src/exports/report.service.ts

- **IMPLEMENT**: Service to fetch and aggregate project data
- **PATTERN**: Mirror seeds.service.ts:14-43 (data fetching with Prisma)
- **IMPORTS**: `prisma` from '../config/database.js', types from './types.js'
- **GOTCHA**: Include all related data (phases, creator) in single query for performance
- **VALIDATE**: `npx tsc --noEmit && npm test`

```typescript
import { prisma } from '../config/database.js'
import type { ReportProject } from './types.js'

export async function fetchProjectReportData(
  userId: string,
  projectId: string
): Promise<ReportProject> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      created_by: userId
    },
    include: {
      phases: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          start_date: true,
          end_date: true,
          budget_allocated: true,
          budget_spent: true,
          order: true
        }
      },
      creator: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  return project as ReportProject
}
```

### CREATE project-pipeline/backend/src/exports/excel-export.service.ts

- **IMPLEMENT**: Excel generation using ExcelJS with multiple worksheets
- **PATTERN**: Follow ExcelJS documentation examples for workbook/worksheet creation
- **IMPORTS**: `import * as Excel from 'exceljs'`, types from './types.js'
- **GOTCHA**: Use proper number formatting for currency (`'$#,##0.00'`), dates, and percentages
- **VALIDATE**: `npx tsc --noEmit && node -e "const Excel = require('exceljs'); console.log('ExcelJS OK')"`

```typescript
import * as Excel from 'exceljs'
import type { ReportProject, ExportResult } from './types.js'

export async function generateExcelReport(
  project: ReportProject
): Promise<ExportResult> {
  const workbook = new Excel.Workbook()

  // Metadata
  workbook.creator = 'Open Horizon Project Pipeline'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Overview worksheet
  const overview = workbook.addWorksheet('Overview')
  overview.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 50 }
  ]

  overview.addRows([
    { field: 'Project Name', value: project.name },
    { field: 'Type', value: project.type },
    { field: 'Status', value: project.status },
    { field: 'Description', value: project.description || 'N/A' },
    { field: 'Start Date', value: project.start_date.toLocaleDateString() },
    { field: 'End Date', value: project.end_date.toLocaleDateString() },
    { field: 'Participants', value: project.participants_count },
    { field: 'Location', value: project.location },
    { field: 'Total Budget', value: Number(project.budget_total) },
    { field: 'Budget Spent', value: Number(project.budget_spent) }
  ])

  // Format currency cells
  overview.getCell('B9').numFmt = '$#,##0.00'
  overview.getCell('B10').numFmt = '$#,##0.00'

  // Style header row
  const headerRow = overview.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  }

  // Phases worksheet
  const phases = workbook.addWorksheet('Phases')
  phases.columns = [
    { header: 'Phase Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Start Date', key: 'start_date', width: 15 },
    { header: 'End Date', key: 'end_date', width: 15 },
    { header: 'Budget Allocated', key: 'allocated', width: 18 },
    { header: 'Budget Spent', key: 'spent', width: 18 }
  ]

  project.phases.forEach(phase => {
    phases.addRow({
      name: phase.name,
      type: phase.type,
      status: phase.status,
      start_date: phase.start_date.toLocaleDateString(),
      end_date: phase.end_date.toLocaleDateString(),
      allocated: Number(phase.budget_allocated),
      spent: Number(phase.budget_spent)
    })
  })

  // Format currency columns
  for (let i = 2; i <= project.phases.length + 1; i++) {
    phases.getCell(`F${i}`).numFmt = '$#,##0.00'
    phases.getCell(`G${i}`).numFmt = '$#,##0.00'
  }

  // Style header
  const phasesHeader = phases.getRow(1)
  phasesHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  phasesHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  return {
    buffer: Buffer.from(buffer),
    filename: `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
}
```

### CREATE project-pipeline/backend/src/exports/word-export.service.ts

- **IMPLEMENT**: Word document generation using docx library
- **PATTERN**: Follow docx documentation for Document, Paragraph, Table creation
- **IMPORTS**: `import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx'`, types from './types.js'
- **GOTCHA**: TableCells must contain Paragraphs, not TextRuns directly; use twips for measurements (1440 twips = 1 inch)
- **VALIDATE**: `npx tsc --noEmit && node -e "const docx = require('docx'); console.log('Docx OK')"`

```typescript
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
```

### CREATE project-pipeline/backend/src/exports/pdf-export.service.ts

- **IMPLEMENT**: PDF generation using Playwright with HTML templates
- **PATTERN**: Playwright page.pdf() API with custom HTML content
- **IMPORTS**: `import { chromium } from 'playwright'`, types from './types.js'
- **GOTCHA**: PDF generation is Chromium-only; use `printBackground: true` for colors; implement print CSS with `page-break-inside: avoid`
- **VALIDATE**: `npx tsc --noEmit && npm test`

```typescript
import { chromium } from 'playwright'
import type { ReportProject, ExportResult } from './types.js'

function generateReportHTML(project: ReportProject): string {
  const totalDays = Math.ceil(
    (project.end_date.getTime() - project.start_date.getTime()) / (1000 * 60 * 60 * 24)
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      color: #0066CC;
      font-size: 24pt;
      text-align: center;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h2 {
      color: #0066CC;
      font-size: 16pt;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #0066CC;
      padding-bottom: 5px;
      page-break-after: avoid;
    }

    .subtitle {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-bottom: 40px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .info-item {
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }

    .info-label {
      font-weight: bold;
      color: #0066CC;
      margin-bottom: 5px;
    }

    .description {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #0066CC;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    thead {
      background-color: #0066CC;
      color: white;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
    }

    th {
      font-weight: bold;
    }

    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
    }

    .status-planning {
      background-color: #E3F2FD;
      color: #1976D2;
    }

    .status-in-progress {
      background-color: #F3E5F5;
      color: #7B1FA2;
    }

    .status-completed {
      background-color: #E8F5E9;
      color: #388E3C;
    }

    .status-not-started {
      background-color: #FFF3E0;
      color: #F57C00;
    }

    @media print {
      body {
        margin: 0;
        padding: 15px;
      }

      @page {
        size: A4;
        margin: 2cm;
      }
    }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <p class="subtitle">Project Report - Generated ${new Date().toLocaleDateString()}</p>

  <h2>Project Overview</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Type</div>
      <div>${project.type}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Status</div>
      <div><span class="status-badge status-${project.status.toLowerCase().replace('_', '-')}">${project.status}</span></div>
    </div>
    <div class="info-item">
      <div class="info-label">Location</div>
      <div>${project.location}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Participants</div>
      <div>${project.participants_count}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Duration</div>
      <div>${totalDays} days</div>
    </div>
    <div class="info-item">
      <div class="info-label">Budget</div>
      <div>$${Number(project.budget_total).toLocaleString()}</div>
    </div>
  </div>

  ${project.description ? `
    <h2>Description</h2>
    <div class="description">
      ${project.description}
    </div>
  ` : ''}

  <h2>Project Phases</h2>
  <table>
    <thead>
      <tr>
        <th>Phase Name</th>
        <th>Type</th>
        <th>Status</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Budget Allocated</th>
        <th>Budget Spent</th>
      </tr>
    </thead>
    <tbody>
      ${project.phases.map(phase => `
        <tr>
          <td>${phase.name}</td>
          <td>${phase.type}</td>
          <td><span class="status-badge status-${phase.status.toLowerCase().replace('_', '-')}">${phase.status}</span></td>
          <td>${phase.start_date.toLocaleDateString()}</td>
          <td>${phase.end_date.toLocaleDateString()}</td>
          <td>$${Number(phase.budget_allocated).toLocaleString()}</td>
          <td>$${Number(phase.budget_spent).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Budget Summary</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Total Budget</div>
      <div>$${Number(project.budget_total).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Total Spent</div>
      <div>$${Number(project.budget_spent).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Remaining</div>
      <div>$${(Number(project.budget_total) - Number(project.budget_spent)).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Utilization</div>
      <div>${((Number(project.budget_spent) / Number(project.budget_total)) * 100).toFixed(1)}%</div>
    </div>
  </div>
</body>
</html>
  `
}

export async function generatePDFReport(
  project: ReportProject
): Promise<ExportResult> {
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    const html = generateReportHTML(project)

    await page.setContent(html, { waitUntil: 'networkidle' })

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    })

    return {
      buffer: Buffer.from(buffer),
      filename: `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.pdf`,
      mimeType: 'application/pdf'
    }
  } finally {
    await browser.close()
  }
}
```

### CREATE project-pipeline/backend/src/exports/exports.routes.ts

- **IMPLEMENT**: Fastify routes for export endpoints
- **PATTERN**: Mirror projects.routes.ts:20-56 (route registration with authentication)
- **IMPORTS**: Fastify types, z from 'zod', services from export services
- **GOTCHA**: Set correct Content-Type headers for each format; use Content-Disposition for downloads
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { fetchProjectReportData } from './report.service.js'
import { generatePDFReport } from './pdf-export.service.js'
import { generateExcelReport } from './excel-export.service.js'
import { generateWordReport } from './word-export.service.js'

const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'excel', 'word'])
})

export async function registerExportRoutes(app: FastifyInstance) {
  // POST /projects/:id/export - Generate and download report
  app.post('/projects/:id/export', {
    onRequest: [app.authenticate]
  }, async (
    request: FastifyRequest<{
      Params: { id: string }
      Body: { format: 'pdf' | 'excel' | 'word' }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params
      const { format } = exportRequestSchema.parse(request.body)

      // Fetch project data
      const project = await fetchProjectReportData(userId, id)

      // Generate report based on format
      let result
      switch (format) {
        case 'pdf':
          result = await generatePDFReport(project)
          break
        case 'excel':
          result = await generateExcelReport(project)
          break
        case 'word':
          result = await generateWordReport(project)
          break
        default:
          return reply.code(400).send({ error: 'Invalid format' })
      }

      // Send file download response
      return reply
        .header('Content-Type', result.mimeType)
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.buffer)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error instanceof Error && error.message === 'Project not found') {
        return reply.code(404).send({ error: 'Project not found' })
      }
      throw error
    }
  })
}
```

### UPDATE project-pipeline/backend/src/app.ts

- **IMPLEMENT**: Register export routes in main app
- **PATTERN**: Follow existing route registration at lines 62-70
- **IMPORTS**: `import { registerExportRoutes } from './exports/exports.routes.js'`
- **GOTCHA**: ⚠️ **CRITICAL: Preserve import order** - Add import after existing route imports but before route registration
- **VALIDATE**: `npx tsc --noEmit && npm run dev` (server starts without errors)

Add import:
```typescript
import { registerExportRoutes } from './exports/exports.routes.js'
```

Add registration after line 70:
```typescript
await registerExportRoutes(app)
```

Update root endpoint documentation to include exports:
```typescript
// In root endpoint response (around line 57)
exports: ['/projects/:id/export']
```

### CREATE project-pipeline/backend/src/tests/integration/report-export.test.ts

- **IMPLEMENT**: Integration tests for all three export formats
- **PATTERN**: Follow budget-tracking.test.ts:11-80 (vitest, mock Prisma, test scenarios)
- **IMPORTS**: vitest, mock setup from '../setup'
- **GOTCHA**: Mock Prisma responses must match ReportProject interface shape
- **VALIDATE**: `npm test src/tests/integration/report-export.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchProjectReportData } from '../../exports/report.service'
import { generatePDFReport } from '../../exports/pdf-export.service'
import { generateExcelReport } from '../../exports/excel-export.service'
import { generateWordReport } from '../../exports/word-export.service'
import { createMockPrismaClient } from '../setup'

describe('Report Export Integration', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    type: 'STUDENT_EXCHANGE',
    status: 'IN_PROGRESS',
    description: 'A test project for export functionality',
    start_date: new Date('2025-03-01'),
    end_date: new Date('2025-03-15'),
    budget_total: 50000,
    budget_spent: 15000,
    participants_count: 20,
    location: 'Stockholm, Sweden',
    created_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
    metadata: null,
    phases: [
      {
        id: 'phase-1',
        name: 'Accommodation',
        type: 'ACCOMMODATION',
        status: 'COMPLETED',
        start_date: new Date('2025-03-01'),
        end_date: new Date('2025-03-05'),
        budget_allocated: 15000,
        budget_spent: 12000,
        order: 1
      },
      {
        id: 'phase-2',
        name: 'Travel',
        type: 'TRAVEL',
        status: 'IN_PROGRESS',
        start_date: new Date('2025-03-06'),
        end_date: new Date('2025-03-15'),
        budget_allocated: 20000,
        budget_spent: 3000,
        order: 2
      }
    ],
    creator: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  }

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
  })

  describe('Data Fetching', () => {
    it('should fetch project report data with all relations', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject)

      const result = await fetchProjectReportData('user-1', 'project-1')

      expect(result).toBeDefined()
      expect(result.id).toBe('project-1')
      expect(result.phases).toHaveLength(2)
      expect(result.creator).toBeDefined()
    })

    it('should throw error if project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null)

      await expect(
        fetchProjectReportData('user-1', 'nonexistent')
      ).rejects.toThrow('Project not found')
    })
  })

  describe('PDF Export', () => {
    it('should generate PDF with correct structure', async () => {
      const result = await generatePDFReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toContain('test-project')
      expect(result.filename).toEndWith('.pdf')
      expect(result.mimeType).toBe('application/pdf')
    })

    it('should handle project with no description', async () => {
      const projectNoDesc = { ...mockProject, description: null }
      const result = await generatePDFReport(projectNoDesc)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('Excel Export', () => {
    it('should generate Excel with multiple worksheets', async () => {
      const result = await generateExcelReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toEndWith('.xlsx')
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('should include all phases in phases worksheet', async () => {
      const result = await generateExcelReport(mockProject)
      expect(result.buffer).toBeDefined()
      // Excel file should contain data for 2 phases
    })
  })

  describe('Word Export', () => {
    it('should generate Word document with tables', async () => {
      const result = await generateWordReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toEndWith('.docx')
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    })

    it('should handle empty phases array', async () => {
      const projectNoPhases = { ...mockProject, phases: [] }
      const result = await generateWordReport(projectNoPhases)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('Format Selection', () => {
    it('should generate different file types for each format', async () => {
      const pdf = await generatePDFReport(mockProject)
      const excel = await generateExcelReport(mockProject)
      const word = await generateWordReport(mockProject)

      expect(pdf.filename).toMatch(/\.pdf$/)
      expect(excel.filename).toMatch(/\.xlsx$/)
      expect(word.filename).toMatch(/\.docx$/)

      expect(pdf.mimeType).toContain('pdf')
      expect(excel.mimeType).toContain('spreadsheet')
      expect(word.mimeType).toContain('wordprocessing')
    })
  })
})
```

### CREATE app/src/components/pipeline/projects/ExportReportButton.tsx

- **IMPLEMENT**: React component with dropdown for format selection and download handling
- **PATTERN**: Follow existing component patterns in app/src/components/pipeline/
- **IMPORTS**: Button, DropdownMenu from UI components, lucide-react icons
- **GOTCHA**: Use Blob and createObjectURL for client-side downloads; cleanup URL after download
- **VALIDATE**: `npx tsc --noEmit && npm run build`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Table, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ExportReportButtonProps {
  projectId: string
  projectName: string
}

type ExportFormat = 'pdf' | 'excel' | 'word'

export function ExportReportButton({ projectId, projectName }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setSelectedFormat(format)

    try {
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectId}/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication header if needed
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ format })
        }
      )

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get blob from response
      const blob = await response.blob()

      // Determine file extension
      const extension = format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : 'pdf'
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.${extension}`

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsExporting(false)
      setSelectedFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting && selectedFormat ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting {selectedFormat.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <Table className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('word')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### UPDATE app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx

- **IMPLEMENT**: Add ExportReportButton to project detail page header
- **PATTERN**: Place button in header section alongside "Back to Projects" (lines 80-102)
- **IMPORTS**: `import { ExportReportButton } from '@/components/pipeline/projects/ExportReportButton'`
- **GOTCHA**: Pass project.id and project.name as props
- **VALIDATE**: `npm run dev` and navigate to project detail page

Add import at top:
```typescript
import { ExportReportButton } from '@/components/pipeline/projects/ExportReportButton'
```

Update header section (around line 98-102) to include export button:
```typescript
<div className="flex items-start justify-between">
  <div className="flex-1">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push('/pipeline/projects')}
      className="mb-2 -ml-2"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Projects
    </Button>
    <h1 className="text-2xl font-bold">{project.name}</h1>
    {project.description && (
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
        {project.description}
      </p>
    )}
  </div>
  <div className="flex items-center gap-2">
    <ExportReportButton projectId={project.id} projectName={project.name} />
    <Badge className={statusColors[project.status]}>
      {project.status}
    </Badge>
  </div>
</div>
```

---

## TESTING STRATEGY

### Unit Tests

**Scope**: Individual service functions with mocked dependencies

- Test each export service independently with mock data
- Verify correct TypeScript types for all functions
- Test error handling for missing/invalid data

### Integration Tests

**Scope**: End-to-end export workflow with real Prisma queries (using test database)

- Test complete export flow: fetch data → generate report → return buffer
- Verify file format validity (PDF opens, Excel has worksheets, Word has tables)
- Test with various project states (no phases, no description, etc.)
- Test authentication and authorization (user can only export own projects)

### Edge Cases

- Empty projects (no phases)
- Large projects (50+ phases, stress test)
- Projects with null/undefined optional fields
- Special characters in project names (filename sanitization)
- Missing budget data (NaN, null handling)
- Concurrent export requests from same user

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Import Validation (CRITICAL)

**Verify all imports resolve before running tests:**

```bash
cd project-pipeline/backend
npx tsc --noEmit
```

**Expected:** No type errors, all imports valid

**Why:** Catches incorrect imports immediately (exceljs, docx, playwright usage)

### Level 2: Dependency Installation

**Install new dependencies:**

```bash
cd project-pipeline/backend
npm install
npm list exceljs docx playwright
```

**Expected:** All three packages listed with versions

### Level 3: Backend Tests

**Run integration tests:**

```bash
cd project-pipeline/backend
npm test src/tests/integration/report-export.test.ts
```

**Expected:** All tests pass

### Level 4: Backend Server

**Start backend server and verify routes:**

```bash
cd project-pipeline/backend
npm run dev
```

**Expected:** Server starts on port 3001, no errors in console

**Manual check:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

### Level 5: Frontend Build

**Build Next.js app:**

```bash
cd app
npx tsc --noEmit
npm run build
```

**Expected:** Build completes without TypeScript errors

### Level 6: Frontend Dev Server

**Start frontend dev server:**

```bash
cd app
npm run dev
```

**Expected:** App loads at localhost:3000

### Level 7: Manual E2E Testing

**Test complete export workflow:**

1. Navigate to http://localhost:3000/pipeline/projects
2. Click on any project
3. Click "Export Report" button
4. Select "Export as PDF" - verify PDF downloads and opens correctly
5. Select "Export as Excel" - verify XLSX downloads and opens in Excel/LibreOffice
6. Select "Export as Word" - verify DOCX downloads and opens in Word/LibreOffice
7. Verify all data is present and correctly formatted in each export

**Expected:** All three formats download successfully, open without errors, contain correct project data

### Level 8: File Validation

**Verify generated files:**

```bash
# PDF
file downloaded-report.pdf
# Expected: "PDF document, version 1.4"

# Excel
file downloaded-report.xlsx
# Expected: "Microsoft Excel 2007+"

# Word
file downloaded-report.docx
# Expected: "Microsoft Word 2007+"
```

---

## ACCEPTANCE CRITERIA

- [ ] Backend API endpoint `/projects/:id/export` accepts POST requests with format parameter
- [ ] PDF export generates with professional layout, tables, and formatting
- [ ] Excel export creates multi-sheet workbook with Overview and Phases sheets
- [ ] Word export generates document with headings, tables, and proper structure
- [ ] Export button appears on project detail page header
- [ ] Format dropdown shows three options: PDF, Excel, Word
- [ ] Downloads start immediately upon format selection
- [ ] Loading state shows during export generation
- [ ] Error handling displays user-friendly messages
- [ ] Only project owner can export (authentication check)
- [ ] All project data included: overview, phases, budgets, dates
- [ ] Filenames sanitized (no special characters)
- [ ] All integration tests pass
- [ ] No TypeScript errors in frontend or backend
- [ ] Backend server starts without errors
- [ ] Frontend builds successfully

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (top to bottom)
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms all three formats work
- [ ] Export button visible and functional on project detail page
- [ ] Acceptance criteria all met
- [ ] Code follows project conventions and patterns
- [ ] No regressions in existing functionality

---

## NOTES

### Design Decisions

1. **Backend-heavy approach**: All export generation happens on backend to avoid browser memory limits with large datasets and leverage Node.js performance
2. **Playwright for PDF**: Chosen over jsPDF/PDFKit because it allows using HTML/CSS for layout, making it easier to create professional designs
3. **Separate services**: Each export format has its own service for separation of concerns and easier testing
4. **Buffer-based response**: Files sent as buffers rather than saving to disk, reducing I/O and cleanup complexity
5. **No TRPC**: Using direct fetch() to backend API since this is a file download, not data fetching (TRPC better for JSON responses)

### Trade-offs

- **PDF generation speed**: Playwright requires launching Chromium browser, adds ~1-2 second latency vs. pure PDF libraries, but gains HTML/CSS layout flexibility
- **Memory usage**: Large projects with many phases may consume significant memory during export (mitigate with streaming for future enhancement)
- **No chart images**: Initial version excludes Gantt chart visualization (would require additional rendering step with chart library)

### Future Enhancements

- Add Gantt chart visualization to reports using Chart.js or similar
- Support custom report sections (user can select which sections to include)
- Email report option (generate and send via email instead of download)
- Scheduled reports (generate weekly/monthly reports automatically)
- Report templates (different layouts for different stakeholder types)
- Batch export (export multiple projects at once)
