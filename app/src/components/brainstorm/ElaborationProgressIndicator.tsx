/**
 * Progress Indicator for Seed Elaboration
 *
 * Displays 0-100% completeness with color-coded progress bar
 * Based on: project-pipeline/frontend/src/components/seeds/ProgressIndicator.tsx
 */

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'

interface ElaborationProgressIndicatorProps {
  completeness: number // 0-100
  totalQuestions?: number
  answeredQuestions?: number
}

export function ElaborationProgressIndicator({
  completeness,
  totalQuestions = 7,
  answeredQuestions,
}: ElaborationProgressIndicatorProps) {
  const getColor = (): string => {
    if (completeness < 50) return 'bg-red-600'
    if (completeness < 80) return 'bg-yellow-500'
    return 'bg-green-600'
  }

  const getMessage = (): string => {
    if (completeness < 30) return "Let's get started!"
    if (completeness < 60) return "You're making progress!"
    if (completeness < 80) return "Almost there!"
    return "Great work! Ready to convert!"
  }

  const getTextColor = (): string => {
    if (completeness < 50) return 'text-red-600'
    if (completeness < 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Calculate answered questions from completeness if not provided
  const answered = answeredQuestions ?? Math.round((completeness / 100) * totalQuestions)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Elaboration Progress
          </span>
          <span className={`text-sm font-semibold ${getTextColor()}`}>
            {answered}/{totalQuestions} questions
          </span>
        </div>
        <span className={`text-2xl font-bold ${getTextColor()}`}>
          {completeness}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <Progress value={completeness} className="h-3" indicatorClassName={getColor()} />
      </div>

      {/* Question indicators */}
      <div className="mb-3 flex items-center justify-between gap-1">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            {index < answered ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
            <span className="text-xs text-muted-foreground">{index + 1}</span>
          </div>
        ))}
      </div>

      {/* Encouraging message */}
      <p className={`text-center text-sm font-medium ${getTextColor()}`}>
        {getMessage()}
      </p>

      {/* Convert button hint */}
      {completeness >= 80 && completeness < 100 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          You can convert to a project now! (or complete all questions for 100%)
        </p>
      )}
      {completeness === 100 && (
        <p className="mt-2 text-center text-xs font-semibold text-green-600">
          ✓ All questions completed! Ready to convert to project.
        </p>
      )}
    </div>
  )
}
