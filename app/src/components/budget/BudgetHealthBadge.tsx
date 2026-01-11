'use client'

import { Badge } from '@/components/ui/badge'
import { BudgetHealth } from '@/types/budget'
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle } from 'lucide-react'

interface BudgetHealthBadgeProps {
  health: BudgetHealth
  showIcon?: boolean
}

const healthIcons = {
  HEALTHY: CheckCircle2,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
  OVER_BUDGET: XCircle,
}

const healthColors = {
  HEALTHY: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  WARNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  CRITICAL: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  OVER_BUDGET: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export function BudgetHealthBadge({ health, showIcon = true }: BudgetHealthBadgeProps) {
  const Icon = healthIcons[health.status]

  return (
    <Badge className={healthColors[health.status]}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {health.message}
    </Badge>
  )
}
