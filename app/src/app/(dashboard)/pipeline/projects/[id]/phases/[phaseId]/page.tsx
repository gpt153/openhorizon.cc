'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { QuoteCard } from '@/components/pipeline/quotes/QuoteCard'
import { PhaseChat } from '@/components/pipeline/PhaseChat'
import { formatCurrency } from '@/types/pipeline'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'

export default function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()

  const { data: phase, isLoading, error } = trpc.pipeline.phases.getById.useQuery({
    id: resolvedParams.phaseId,
  })

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading phase</h2>
          <p className="text-sm text-zinc-600 mt-2">{error.message}</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/pipeline/projects/${resolvedParams.id}`)}
          >
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !phase) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const phaseStatusColors: Record<string, string> = {
    NOT_STARTED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    SKIPPED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  }

  const budgetAllocated = Number(phase.budgetAllocated)
  const budgetSpent = Number(phase.budgetSpent)
  const budgetRemaining = budgetAllocated - budgetSpent
  const budgetPercentage = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0

  const startDate = new Date(phase.startDate)
  const endDate = new Date(phase.endDate)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pipeline/projects/${resolvedParams.id}`)}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{phase.name}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {phase.type.replace('_', ' ')}
            </p>
          </div>
          <Badge className={phaseStatusColors[phase.status]}>
            {phase.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Phase Meta */}
        <div className="flex items-center gap-4 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Budget Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Budget Status</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(budgetSpent)} / {formatCurrency(budgetAllocated)}
                  </p>
                </div>
                <Progress value={budgetPercentage} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Allocated</p>
                    <p className="text-lg font-semibold">{formatCurrency(budgetAllocated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Spent</p>
                    <p className="text-lg font-semibold">{formatCurrency(budgetSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Remaining</p>
                    <p className="text-lg font-semibold">{formatCurrency(budgetRemaining)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout: Quotes and Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quotes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Quotes</h2>
                <Button size="sm" disabled>
                  Request Quotes (Disabled)
                </Button>
              </div>

              {phase.quotes && phase.quotes.length > 0 ? (
                <div className="space-y-4">
                  {phase.quotes.map((quote) => (
                    <QuoteCard key={quote.id} quote={quote} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-zinc-500">No quotes yet</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Request quotes from vendors to get pricing estimates
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Chat Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
              <PhaseChat
                phaseId={resolvedParams.phaseId}
                phaseType={phase.type}
                phaseName={phase.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
