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
