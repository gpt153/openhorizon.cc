// CSV export utility for reports
import type { Project, Phase } from '../types'
import type { ProjectBudget, PhaseBudget } from '../hooks/useBudget'

/**
 * Convert data to CSV format and trigger download
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape CSV field value
 */
function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return ''

  const stringValue = String(field)

  // If field contains comma, double quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerRow = headers.map(escapeCSVField).join(',')
  const dataRows = rows.map((row) => row.map(escapeCSVField).join(',')).join('\n')

  return `${headerRow}\n${dataRows}`
}

/**
 * Export projects to CSV
 */
export function exportProjectsCSV(projects: Project[]) {
  const headers = [
    'Project Name',
    'Type',
    'Status',
    'Start Date',
    'End Date',
    'Budget Total',
    'Budget Spent',
    'Budget Remaining',
    'Percentage Spent',
    'Participants',
    'Phase Count',
  ]

  const rows = projects.map((project) => {
    const budgetRemaining = project.budget_total - project.budget_spent
    const percentageSpent =
      project.budget_total > 0 ? (project.budget_spent / project.budget_total) * 100 : 0

    return [
      project.name,
      project.type,
      project.status,
      new Date(project.start_date).toLocaleDateString(),
      new Date(project.end_date).toLocaleDateString(),
      project.budget_total,
      project.budget_spent,
      budgetRemaining,
      percentageSpent.toFixed(2),
      project.participants_count,
      project._count?.phases || 0,
    ]
  })

  const csvContent = arrayToCSV(headers, rows)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`projects-export-${timestamp}.csv`, csvContent)
}

/**
 * Export phases to CSV
 */
export function exportPhasesCSV(phases: Phase[], projectName?: string) {
  const headers = [
    'Phase Name',
    'Type',
    'Status',
    'Start Date',
    'End Date',
    'Budget Allocated',
    'Budget Spent',
    'Budget Remaining',
    'Percentage Spent',
    'Quote Count',
  ]

  const rows = phases.map((phase) => {
    const budgetRemaining = phase.budget_allocated - phase.budget_spent
    const percentageSpent =
      phase.budget_allocated > 0 ? (phase.budget_spent / phase.budget_allocated) * 100 : 0

    return [
      phase.name,
      phase.type,
      phase.status,
      new Date(phase.start_date).toLocaleDateString(),
      new Date(phase.end_date).toLocaleDateString(),
      phase.budget_allocated,
      phase.budget_spent,
      budgetRemaining,
      percentageSpent.toFixed(2),
      phase.quotes?.length || 0,
    ]
  })

  const csvContent = arrayToCSV(headers, rows)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = projectName
    ? `phases-${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`
    : `phases-export-${timestamp}.csv`

  downloadCSV(filename, csvContent)
}

/**
 * Export project budgets to CSV
 */
export function exportProjectBudgetsCSV(projectBudgets: ProjectBudget[]) {
  const headers = [
    'Project Name',
    'Type',
    'Status',
    'Budget Allocated',
    'Budget Spent',
    'Budget Remaining',
    'Percentage Spent',
    'Phase Count',
    'Over Budget',
    'Health Status',
  ]

  const rows = projectBudgets.map((pb) => {
    let healthStatus: string
    if (pb.is_over_budget) {
      healthStatus = 'Over Budget'
    } else if (pb.percentage_spent >= 90) {
      healthStatus = 'Critical'
    } else if (pb.percentage_spent >= 75) {
      healthStatus = 'Warning'
    } else {
      healthStatus = 'On Track'
    }

    return [
      pb.project.name,
      pb.project.type,
      pb.project.status,
      pb.budget_allocated,
      pb.budget_spent,
      pb.budget_remaining,
      pb.percentage_spent.toFixed(2),
      pb.phase_count,
      pb.is_over_budget ? 'Yes' : 'No',
      healthStatus,
    ]
  })

  const csvContent = arrayToCSV(headers, rows)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`budget-report-${timestamp}.csv`, csvContent)
}

/**
 * Export phase budgets to CSV
 */
export function exportPhaseBudgetsCSV(phaseBudgets: PhaseBudget[], projectName?: string) {
  const headers = [
    'Phase Name',
    'Type',
    'Status',
    'Budget Allocated',
    'Budget Spent',
    'Budget Remaining',
    'Percentage Spent',
    'Over Budget',
    'Health Status',
  ]

  const rows = phaseBudgets.map((pb) => {
    let healthStatus: string
    if (pb.is_over_budget) {
      healthStatus = 'Over Budget'
    } else if (pb.percentage_spent >= 90) {
      healthStatus = 'Critical'
    } else if (pb.percentage_spent >= 75) {
      healthStatus = 'Warning'
    } else {
      healthStatus = 'On Track'
    }

    return [
      pb.phase.name,
      pb.phase.type,
      pb.phase.status,
      pb.budget_allocated,
      pb.budget_spent,
      pb.budget_remaining,
      pb.percentage_spent.toFixed(2),
      pb.is_over_budget ? 'Yes' : 'No',
      healthStatus,
    ]
  })

  const csvContent = arrayToCSV(headers, rows)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = projectName
    ? `phase-budgets-${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`
    : `phase-budgets-${timestamp}.csv`

  downloadCSV(filename, csvContent)
}

/**
 * Export comprehensive budget summary to CSV
 */
export function exportBudgetSummaryCSV(
  projectBudgets: ProjectBudget[],
  totalBudget: number,
  totalSpent: number,
  totalRemaining: number
) {
  // Summary section
  const summaryHeaders = ['Metric', 'Value']
  const summaryRows = [
    ['Total Budget', totalBudget],
    ['Total Spent', totalSpent],
    ['Total Remaining', totalRemaining],
    ['Percentage Spent', ((totalSpent / totalBudget) * 100).toFixed(2) + '%'],
    ['Project Count', projectBudgets.length],
    [
      'Over Budget Count',
      projectBudgets.filter((pb) => pb.is_over_budget).length,
    ],
  ]

  const summaryCsv = arrayToCSV(summaryHeaders, summaryRows)

  // Project breakdown section
  const projectHeaders = [
    'Project Name',
    'Budget Allocated',
    'Budget Spent',
    'Budget Remaining',
    'Percentage Spent',
    'Health Status',
  ]

  const projectRows = projectBudgets.map((pb) => {
    let healthStatus: string
    if (pb.is_over_budget) {
      healthStatus = 'Over Budget'
    } else if (pb.percentage_spent >= 90) {
      healthStatus = 'Critical'
    } else if (pb.percentage_spent >= 75) {
      healthStatus = 'Warning'
    } else {
      healthStatus = 'On Track'
    }

    return [
      pb.project.name,
      pb.budget_allocated,
      pb.budget_spent,
      pb.budget_remaining,
      pb.percentage_spent.toFixed(2),
      healthStatus,
    ]
  })

  const projectCsv = arrayToCSV(projectHeaders, projectRows)

  // Combine sections
  const csvContent = `BUDGET SUMMARY\n${summaryCsv}\n\n\nPROJECT BREAKDOWN\n${projectCsv}`

  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`budget-summary-${timestamp}.csv`, csvContent)
}
