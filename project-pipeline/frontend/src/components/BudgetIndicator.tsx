interface BudgetIndicatorProps {
  allocated: number
  spent: number
}

export const BudgetIndicator = ({ allocated, spent }: BudgetIndicatorProps) => {
  const percent = allocated > 0 ? (spent / allocated) * 100 : 0
  const isOverBudget = percent > 100
  const isWarning = percent > 80 && percent <= 100

  const color = isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="w-32">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{percent.toFixed(0)}% spent</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}
