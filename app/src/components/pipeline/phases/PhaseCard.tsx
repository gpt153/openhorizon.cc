'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PipelinePhase } from '@/types/pipeline'
import { formatCurrency } from '@/types/pipeline'
import { Home, Plane, Utensils, PartyPopper, Shield, AlertTriangle } from 'lucide-react'

type PhaseCardProps = {
  phase: Omit<PipelinePhase, 'project' | 'communications' | 'quotes' | 'aiConversations'> & {
    _count?: {
      communications?: number
      quotes?: number
    }
  }
  projectId: string
}

const phaseIcons = {
  ACCOMMODATION: Home,
  TRAVEL: Plane,
  FOOD: Utensils,
  ACTIVITIES: PartyPopper,
  INSURANCE: Shield,
  EMERGENCY: AlertTriangle,
  CUSTOM: PartyPopper,
}

const phaseStatusColors: Record<string, string> = {
  NOT_STARTED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  SKIPPED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export function PhaseCard({ phase, projectId }: PhaseCardProps) {
  const Icon = phaseIcons[phase.type] || phaseIcons.CUSTOM
  const budgetAllocated = Number(phase.budgetAllocated)
  const budgetSpent = Number(phase.budgetSpent)
  const budgetPercentage = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0

  return (
    <Link href={`/pipeline/projects/${projectId}/phases/${phase.id}`}>
      <Card
        className="transition-shadow hover:shadow-md"
        data-testid="phase-card"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">{phase.name}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {phase.type.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Badge className={phaseStatusColors[phase.status] || phaseStatusColors.NOT_STARTED}>
              {phase.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Budget</span>
              <span className="font-medium">
                {formatCurrency(budgetSpent)} / {formatCurrency(budgetAllocated)}
              </span>
            </div>
            <Progress value={budgetPercentage} className="h-2" />
            <p className="text-xs text-zinc-500">
              {budgetPercentage.toFixed(1)}% spent
            </p>
          </div>

          {/* Counts */}
          {phase._count && (
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              {phase._count.quotes !== undefined && (
                <span>{phase._count.quotes} quote{phase._count.quotes !== 1 ? 's' : ''}</span>
              )}
              {phase._count.communications !== undefined && (
                <span>{phase._count.communications} communication{phase._count.communications !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
