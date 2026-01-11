import { BudgetHealth, BudgetHealthStatus } from '@/types/budget'

/**
 * Calculate budget health status based on spent percentage
 */
export function calculateBudgetHealth(allocated: number, spent: number): BudgetHealth {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

  let status: BudgetHealthStatus
  let message: string
  let colorClass: string
  let progressColor: string

  if (percentage >= 100) {
    status = 'OVER_BUDGET'
    message = 'Budget exceeded'
    colorClass = 'text-red-600 dark:text-red-400'
    progressColor = 'bg-red-500'
  } else if (percentage >= 90) {
    status = 'CRITICAL'
    message = 'Budget almost exhausted'
    colorClass = 'text-orange-600 dark:text-orange-400'
    progressColor = 'bg-orange-500'
  } else if (percentage >= 75) {
    status = 'WARNING'
    message = 'Budget usage high'
    colorClass = 'text-yellow-600 dark:text-yellow-400'
    progressColor = 'bg-yellow-500'
  } else {
    status = 'HEALTHY'
    message = 'Budget on track'
    colorClass = 'text-green-600 dark:text-green-400'
    progressColor = 'bg-green-500'
  }

  return {
    status,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    message,
    colorClass,
    progressColor,
  }
}

/**
 * Determine if alert should be triggered based on threshold
 */
export function shouldTriggerAlert(
  allocated: number,
  spent: number,
  threshold: number,
  lastTriggeredAt: Date | null
): boolean {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

  // Only trigger if threshold reached
  if (percentage < threshold) {
    return false
  }

  // Don't re-trigger within 24 hours
  if (lastTriggeredAt) {
    const hoursSinceLastTrigger = (Date.now() - lastTriggeredAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastTrigger < 24) {
      return false
    }
  }

  return true
}
