// Removed invalid Prisma type import from '@prisma/client'

// ExpenseCategory enum from Prisma schema
// Defined locally to avoid Prisma client generation issues
enum ExpenseCategory {
  ACCOMMODATION = 'ACCOMMODATION',
  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  ACTIVITIES = 'ACTIVITIES',
  INSURANCE = 'INSURANCE',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export interface Expense {
  id: string
  tenantId: string
  projectId: string
  phaseId: string
  amount: number
  currency: string
  category: ExpenseCategory
  description: string
  date: Date
  receiptUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BudgetAlert {
  id: string
  projectId: string
  threshold: number
  emailRecipients: string[]
  enabled: boolean
  lastTriggeredAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type BudgetHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OVER_BUDGET'

export interface BudgetHealth {
  status: BudgetHealthStatus
  percentage: number
  message: string
  colorClass: string
  progressColor: string
}

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  health: BudgetHealth
  phases: Array<{
    id: string
    name: string
    type: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }>
}

export interface SpendingTrendData {
  date: string
  spending: number
  cumulative: number
}

export function formatCurrency(amount: number | string, currency: string = 'EUR'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
  }).format(numericAmount)
}
