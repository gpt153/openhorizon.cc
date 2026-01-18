'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, MapPin, TrendingUp } from 'lucide-react'
import { PipelineProject } from '@/types/pipeline'
import { formatCurrency, getProfitMarginColor, calculateProfitMarginPercentage } from '@/types/pipeline'

type PipelineProjectCardProps = {
  project: PipelineProject
}

export function PipelineProjectCard({ project }: PipelineProjectCardProps) {
  const statusColors: Record<string, string> = {
    PLANNING: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    IN_PROGRESS: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    CANCELLED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  }

  const grantAmount = project.erasmusGrantCalculated ? Number(project.erasmusGrantCalculated) : null
  const estimatedCosts = project.estimatedCosts ? Number(project.estimatedCosts) : null
  const profitMargin = calculateProfitMarginPercentage(grantAmount, estimatedCosts)

  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/pipeline/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md" data-testid="pipeline-project-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <Badge className={statusColors[project.status] || statusColors.PLANNING}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Users className="h-4 w-4" />
              <span>{project.participantCount} participants</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-4 w-4" />
              <span>{durationDays} days</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 col-span-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{project.location}</span>
            </div>
          </div>

          {/* Profit Margin Indicator */}
          {grantAmount && (
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
              <div className="flex-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Grant Amount</p>
                <p className="text-sm font-semibold">{formatCurrency(grantAmount)}</p>
              </div>
              {profitMargin !== null && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`h-4 w-4 ${getProfitMarginColor(profitMargin)}`} />
                  <span className={`text-sm font-semibold ${getProfitMarginColor(profitMargin)}`}>
                    {profitMargin.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Phases Summary */}
          {project.phases && project.phases.length > 0 && (
            <div className="text-xs text-zinc-500">
              {project.phases.length} phases configured
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
