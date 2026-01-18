import { cn } from '@/lib/utils'

interface ApprovalLikelihoodMeterProps {
  value: number // 0.0-1.0
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ApprovalLikelihoodMeter({
  value,
  size = 'md',
  showLabel = false,
}: ApprovalLikelihoodMeterProps) {
  const percentage = Math.round(value * 100)

  const getColor = () => {
    if (value >= 0.8) return 'bg-green-500'
    if (value >= 0.6) return 'bg-blue-500'
    if (value >= 0.4) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getLabel = () => {
    if (value >= 0.8) return 'Highly Likely'
    if (value >= 0.6) return 'Good Potential'
    if (value >= 0.4) return 'Needs Work'
    return 'Ambitious'
  }

  const sizeClasses = {
    sm: 'h-2 w-16',
    md: 'h-3 w-24',
    lg: 'h-4 w-32',
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {showLabel && (
        <span className="text-xs font-medium text-zinc-600">{getLabel()}</span>
      )}
      <div className={cn('overflow-hidden rounded-full bg-zinc-200', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">{percentage}%</span>
    </div>
  )
}
