'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, Calendar, Users, MapPin, TrendingUp, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { PhaseCard } from '@/components/pipeline/PhaseCard'

export default function PipelineProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, error } = trpc.pipeline.projects.getById.useQuery({ id })

  const utils = trpc.useUtils()

  const calculateGrantMutation = trpc.pipeline.projects.calculateGrant.useMutation({
    onSuccess: () => {
      toast.success('Erasmus+ grant calculated successfully')
      utils.pipeline.projects.getById.invalidate({ id })
    },
    onError: (error) => {
      toast.error(`Failed to calculate grant: ${error.message}`)
    },
  })

  const createDefaultPhasesMutation = trpc.pipeline.phases.createDefaultPhases.useMutation({
    onSuccess: () => {
      toast.success('Default phases created successfully')
      utils.pipeline.projects.getById.invalidate({ id })
    },
    onError: (error) => {
      toast.error(`Failed to create phases: ${error.message}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const durationDays = Math.ceil(
    (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Convert Decimal to number for calculations
  const grant = project.erasmusGrantCalculated ? Number(project.erasmusGrantCalculated) : null
  const costs = project.estimatedCosts ? Number(project.estimatedCosts) : null
  const margin = project.profitMargin ? Number(project.profitMargin) : null

  const profitAmount = grant && costs ? grant - costs : null

  const getProfitColor = (profitMargin: number | null) => {
    if (!profitMargin) return 'text-zinc-600'
    if (profitMargin >= 30) return 'text-green-600'
    if (profitMargin >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pipeline Projects
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-zinc-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Badge>{project.status}</Badge>
        </div>
      </div>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Overview</CardTitle>
            {!project.erasmusGrantCalculated && (
              <Button
                size="sm"
                onClick={() => calculateGrantMutation.mutate({ id })}
                disabled={calculateGrantMutation.isPending}
              >
                {calculateGrantMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Calculate Grant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-600">Erasmus+ Grant</p>
              <p className="text-2xl font-bold">
                {grant
                  ? `€${grant.toLocaleString()}`
                  : 'Not calculated'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Estimated Costs</p>
              <p className="text-2xl font-bold">
                {costs
                  ? `€${costs.toLocaleString()}`
                  : '€0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${getProfitColor(margin)}`}>
                {margin
                  ? `${margin}% (€${profitAmount?.toLocaleString()})`
                  : 'TBD'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-2xl font-bold">{project.participantCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold">{durationDays} days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Project Type</p>
                <p className="text-lg font-bold">{project.type}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Project Phases</h2>
          {(!project.phases || project.phases.length === 0) && (
            <Button
              size="sm"
              onClick={() => createDefaultPhasesMutation.mutate({ projectId: id })}
              disabled={createDefaultPhasesMutation.isPending}
            >
              {createDefaultPhasesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Create Default Phases'
              )}
            </Button>
          )}
        </div>

        {!project.phases || project.phases.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-zinc-600">No phases yet. Create default phases to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                projectId={project.id}
                phase={{
                  ...phase,
                  budgetAllocated: Number(phase.budgetAllocated),
                  budgetSpent: Number(phase.budgetSpent),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
