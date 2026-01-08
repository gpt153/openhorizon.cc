'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { PhaseChat } from '@/components/pipeline/PhaseChat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, DollarSign, Loader2 } from 'lucide-react'

export default function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>
}) {
  const { id: projectId, phaseId } = use(params)
  const router = useRouter()

  const { data: project, isLoading } = trpc.pipeline.projects.getById.useQuery({ id: projectId })
  const phase = project?.phases?.find((p) => p.id === phaseId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project || !phase) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Phase not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const budgetAllocated = Number(phase.budgetAllocated)
  const budgetSpent = Number(phase.budgetSpent)
  const budgetRemaining = budgetAllocated - budgetSpent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.push(`/pipeline/projects/${projectId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        <h1 className="mt-4 text-3xl font-bold">{phase.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {project.name} - {phase.type}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Phase Management */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">Allocated</span>
                  <span className="font-semibold">€{budgetAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">Spent</span>
                  <span className="font-semibold">€{budgetSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Remaining</span>
                  <span className={`font-semibold ${budgetRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    €{budgetRemaining.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    budgetSpent > budgetAllocated ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min((budgetSpent / budgetAllocated) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Start Date</span>
                <span className="font-medium">{new Date(phase.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">End Date</span>
                <span className="font-medium">{new Date(phase.endDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Chat */}
        <div>
          <PhaseChat
            phaseId={phaseId}
            phaseType={phase.type}
            phaseName={phase.name}
          />
        </div>
      </div>
    </div>
  )
}
