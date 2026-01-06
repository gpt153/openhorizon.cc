import type { Phase } from '../types'
import { BudgetIndicator } from './BudgetIndicator'

interface PhaseCardProps {
  phase: Phase
  onClick: () => void
}

const phaseIcons: Record<Phase['type'], string> = {
  ACCOMMODATION: '🏨',
  TRAVEL: '✈️',
  FOOD: '🍽️',
  ACTIVITIES: '🎯',
  INSURANCE: '🛡️',
  EMERGENCY_PLANNING: '🚨',
  REPORTING: '📊',
  OTHER: '📋',
}

export const PhaseCard = ({ phase, onClick }: PhaseCardProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border rounded-lg hover:shadow cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{phaseIcons[phase.type]}</div>
        <div>
          <h3 className="font-medium">{phase.name}</h3>
          <div className="text-sm text-gray-600">
            €{phase.budget_allocated.toLocaleString()} allocated
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <BudgetIndicator
          allocated={phase.budget_allocated}
          spent={phase.budget_spent}
        />
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View →
        </button>
      </div>
    </div>
  )
}
