'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, TrendingUp, MapPin } from 'lucide-react'

type PipelineProject = {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  participantCount: number
  erasmusGrantCalculated: number | null
  estimatedCosts: number | null
  profitMargin: number | null
  status: string
}

export function PipelineProjectCard({ project }: { project: PipelineProject }) {
  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    PLANNING: 'bg-blue-100 text-blue-700',
    VENDOR_RESEARCH: 'bg-purple-100 text-purple-700',
    QUOTES_PENDING: 'bg-yellow-100 text-yellow-700',
    READY_TO_SUBMIT: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
  }

  // Profit margin color coding
  const getProfitBadgeColor = (margin: number | null) => {
    if (!margin) return 'bg-zinc-100 text-zinc-700'
    if (margin >= 30) return 'bg-green-100 text-green-700'
    if (margin >= 15) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const durationDays = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/pipeline/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{project.name}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </p>
            </div>
            <Badge
              className={statusColors[project.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.participantCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{durationDays}d</span>
              </div>
            </div>

            {/* Financial Info */}
            {project.erasmusGrantCalculated && (
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Grant:</span>
                  <span className="font-medium">€{project.erasmusGrantCalculated.toLocaleString()}</span>
                </div>
                {project.estimatedCosts && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Costs:</span>
                      <span className="font-medium">€{project.estimatedCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-600">Profit:</span>
                      <Badge className={getProfitBadgeColor(project.profitMargin)}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {project.profitMargin}%
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
