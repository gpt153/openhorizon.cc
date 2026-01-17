import ExcelJS from 'exceljs'
// Removed invalid Prisma type imports from '@prisma/client'
import { formatCurrency } from '@/types/budget'

export interface ProjectWithDetails extends PipelineProject {
  phases: PipelinePhase[]
  expenses: Expense[]
}

export async function generateProjectExcel(project: ProjectWithDetails): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'OpenHorizon'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Sheet 1: Project Overview
  const overview = workbook.addWorksheet('Project Overview')
  overview.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 50 },
  ]

  overview.addRows([
    { field: 'Project Name', value: project.name },
    { field: 'Status', value: project.status },
    { field: 'Location', value: project.location || 'N/A' },
    { field: 'Host Country', value: project.hostCountry || 'N/A' },
    { field: 'Origin Country', value: project.originCountry || 'N/A' },
    { field: 'Start Date', value: project.startDate.toLocaleDateString() },
    { field: 'End Date', value: project.endDate.toLocaleDateString() },
    { field: 'Participants', value: project.participantCount.toString() },
    { field: 'Total Phases', value: project.phases.length.toString() },
    { field: 'Total Expenses', value: project.expenses.length.toString() },
    { field: 'Created', value: project.createdAt.toLocaleDateString() },
  ])

  // Style header row
  overview.getRow(1).font = { bold: true }
  overview.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  overview.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Sheet 2: Budget Summary
  const budget = workbook.addWorksheet('Budget')
  budget.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Phase', key: 'phase', width: 25 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Receipt', key: 'receipt', width: 30 },
  ]

  // Create phase map
  const phasesMap = project.phases.reduce<Record<string, string>>((acc, phase) => {
    acc[phase.id] = phase.name
    return acc
  }, {})

  // Add expense rows
  project.expenses.forEach((expense) => {
    budget.addRow({
      date: new Date(expense.date).toLocaleDateString('sv-SE'),
      phase: phasesMap[expense.phaseId] || 'Unknown',
      category: expense.category.replace('_', ' '),
      description: expense.description,
      amount: Number(expense.amount),
      receipt: expense.receiptUrl || '',
    })
  })

  // Style header
  budget.getRow(1).font = { bold: true }
  budget.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  budget.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Format amount column as currency
  budget.getColumn('amount').numFmt = '€#,##0.00'

  // Add total row
  if (project.expenses.length > 0) {
    const totalRow = budget.addRow({
      date: '',
      phase: '',
      category: '',
      description: 'TOTAL',
      amount: { formula: `SUM(E2:E${project.expenses.length + 1})` },
      receipt: '',
    })
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    }
  }

  // Sheet 3: Phases Breakdown
  const phases = workbook.addWorksheet('Phases')
  phases.columns = [
    { header: 'Phase Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Order', key: 'order', width: 10 },
    { header: 'Created', key: 'created', width: 15 },
  ]

  project.phases.forEach((phase) => {
    phases.addRow({
      name: phase.name,
      type: phase.type,
      status: phase.status,
      order: phase.order,
      created: new Date(phase.createdAt).toLocaleDateString('sv-SE'),
    })
  })

  // Style header
  phases.getRow(1).font = { bold: true }
  phases.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  phases.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
