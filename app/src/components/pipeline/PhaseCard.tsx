'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Home, Plane, UtensilsCrossed, PartyPopper, Shield, AlertTriangle } from 'lucide-react'

const phaseIcons = {
  ACCOMMODATION: Home,
  TRAVEL: Plane,
  FOOD: UtensilsCrossed,
  ACTIVITIES: PartyPopper,
  INSURANCE: Shield,
  EMERGENCY: AlertTriangle,
}

type PhaseCardProps = {
  projectId: string
  phase: {
    id: string
    type: string
    budgetAllocated: number
    budgetSpent: number
    status: string
    _count?: {
      quotes: number
    }
  }
}

export function PhaseCard({ projectId, phase }: PhaseCardProps) {
  const Icon = phaseIcons[phase.type as keyof typeof phaseIcons]
  const progressPercent = phase.budgetAllocated > 0
    ? Math.min((phase.budgetSpent / phase.budgetAllocated) * 100, 100)
    : 0

  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    RESEARCHING: 'bg-blue-100 text-blue-700',
    QUOTES_REQUESTED: 'bg-purple-100 text-purple-700',
    QUOTES_RECEIVED: 'bg-yellow-100 text-yellow-700',
    VENDOR_SELECTED: 'bg-green-100 text-green-700',
  }

  return (
    <Link href={`/pipeline/projects/${projectId}/phases/${phase.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5 text-blue-600" />}
              <h3 className="font-semibold">{phase.type}</h3>
            </div>
            <Badge
              className={statusColors[phase.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {phase.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Budget */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600">Budget</span>
                <span className="font-medium">
                  €{phase.budgetSpent.toLocaleString()} / €{phase.budgetAllocated.toLocaleString()}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Quote Count */}
            {phase._count && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Quotes</span>
                <span className="font-medium">{phase._count.quotes} received</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
