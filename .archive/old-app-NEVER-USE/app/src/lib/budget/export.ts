import Papa from 'papaparse'
// Removed invalid Prisma type import from '@prisma/client'
import { formatCurrency } from '@/types/budget'

export interface BudgetExportRow {
  Date: string
  Phase: string
  Category: string
  Description: string
  Amount: string
  'Receipt URL': string
}

export function generateBudgetCSV(expenses: any[], phasesMap: Record<string, { name: string; type: string }>): string {
  const rows: BudgetExportRow[] = expenses.map(expense => ({
    Date: new Date(expense.date).toLocaleDateString('sv-SE'),
    Phase: phasesMap[expense.phaseId]?.name || 'Unknown',
    Category: expense.category.replace('_', ' '),
    Description: expense.description,
    Amount: formatCurrency(Number(expense.amount)),
    'Receipt URL': expense.receiptUrl || '',
  }))

  const csv = Papa.unparse(rows, {
    header: true,
    delimiter: ',',
  })

  return csv
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
