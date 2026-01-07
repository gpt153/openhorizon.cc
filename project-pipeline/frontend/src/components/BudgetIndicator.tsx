// Budget progress indicator with health status
import { useMemo } from 'react'

export interface BudgetIndicatorProps {
  allocated: number
  spent: number
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export default function BudgetIndicator({
  allocated,
  spent,
  showDetails = true,
  size = 'md',
  label,
}: BudgetIndicatorProps) {
  const budgetData = useMemo(() => {
    const remaining = allocated - spent
    const percentageSpent = allocated > 0 ? (spent / allocated) * 100 : 0
    const isOverBudget = spent > allocated

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' | 'over'
    let statusColor: string
    let statusBgColor: string
    let statusText: string

    if (isOverBudget) {
      healthStatus = 'over'
      statusColor = 'text-red-700'
      statusBgColor = 'bg-red-600'
      statusText = 'Over Budget'
    } else if (percentageSpent >= 90) {
      healthStatus = 'critical'
      statusColor = 'text-orange-700'
      statusBgColor = 'bg-orange-500'
      statusText = 'Critical'
    } else if (percentageSpent >= 75) {
      healthStatus = 'warning'
      statusColor = 'text-yellow-700'
      statusBgColor = 'bg-yellow-500'
      statusText = 'Warning'
    } else {
      healthStatus = 'healthy'
      statusColor = 'text-green-700'
      statusBgColor = 'bg-green-500'
      statusText = 'On Track'
    }

    return {
      remaining,
      percentageSpent,
      isOverBudget,
      healthStatus,
      statusColor,
      statusBgColor,
      statusText,
    }
  }, [allocated, spent])

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-2',
      text: 'text-xs',
      spacing: 'space-y-1',
    },
    md: {
      height: 'h-3',
      text: 'text-sm',
      spacing: 'space-y-2',
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      spacing: 'space-y-3',
    },
  }

  const config = sizeConfig[size]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={config.spacing}>
      {/* Label and status */}
      {(label || showDetails) && (
        <div className="flex items-center justify-between">
          {label && <span className={`font-medium text-gray-700 ${config.text}`}>{label}</span>}
          {showDetails && (
            <span className={`${config.text} ${budgetData.statusColor} font-semibold`}>
              {budgetData.statusText}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <div className={`w-full ${config.height} bg-gray-200 rounded-full overflow-hidden`}>
          <div
            className={`${config.height} ${budgetData.statusBgColor} transition-all duration-300 ease-in-out`}
            style={{
              width: `${Math.min(budgetData.percentageSpent, 100)}px`,
              maxWidth: '100%',
            }}
            aria-valuenow={budgetData.percentageSpent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>

        {/* Over-budget extension (shows as red overflow) */}
        {budgetData.isOverBudget && (
          <div
            className={`absolute top-0 left-0 ${config.height} bg-red-600 opacity-50`}
            style={{ width: '100%' }}
          />
        )}
      </div>

      {/* Budget details */}
      {showDetails && (
        <div className={`flex items-center justify-between ${config.text} text-gray-600`}>
          <div className="flex items-center gap-4">
            <span>
              <span className="font-medium text-gray-700">Spent:</span>{' '}
              {formatCurrency(spent)}
            </span>
            <span>
              <span className="font-medium text-gray-700">Budget:</span>{' '}
              {formatCurrency(allocated)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                budgetData.isOverBudget ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {budgetData.percentageSpent.toFixed(1)}%
            </span>
            {!budgetData.isOverBudget && (
              <span className="text-gray-500">
                ({formatCurrency(budgetData.remaining)} remaining)
              </span>
            )}
            {budgetData.isOverBudget && (
              <span className="text-red-600 font-medium">
                ({formatCurrency(Math.abs(budgetData.remaining))} over)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Compact percentage (when details are hidden) */}
      {!showDetails && (
        <div className={`${config.text} text-right`}>
          <span className={`font-semibold ${budgetData.statusColor}`}>
            {budgetData.percentageSpent.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
