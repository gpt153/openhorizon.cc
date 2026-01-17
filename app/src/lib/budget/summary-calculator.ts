// Removed invalid Prisma type imports from '@prisma/client'
import { BudgetSummary, SpendingTrendData } from '@/types/budget'
import { calculateBudgetHealth } from './health-calculator'

type ProjectWithPhases = any & {
  phases: any[]
}

export function calculateBudgetSummary(
  project: ProjectWithPhases,
  expenses?: any[]
): BudgetSummary {
  const totalBudget = Number(project.budgetTotal)
  const totalSpent = Number(project.budgetSpent)
  const totalRemaining = totalBudget - totalSpent
  const health = calculateBudgetHealth(totalBudget, totalSpent)

  const phases = project.phases.map((phase: any) => {
    const allocated = Number(phase.budgetAllocated)
    const spent = Number(phase.budgetSpent)
    const remaining = allocated - spent
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

    return {
      id: phase.id,
      name: phase.name,
      type: phase.type,
      allocated,
      spent,
      remaining,
      percentage,
    }
  })

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    health,
    phases,
  }
}

export function generateTrendData(expenses: any[]): SpendingTrendData[] {
  if (expenses.length === 0) return []

  // Group expenses by date
  const expensesByDate = expenses.reduce((acc, expense) => {
    const dateKey = new Date(expense.date).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = 0
    }
    acc[dateKey] += Number(expense.amount)
    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort
  const dates = Object.keys(expensesByDate).sort()

  // Calculate cumulative
  let cumulative = 0
  const trendData: SpendingTrendData[] = dates.map(date => {
    const spending = expensesByDate[date]
    cumulative += spending
    return {
      date,
      spending,
      cumulative,
    }
  })

  return trendData
}
