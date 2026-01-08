'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft } from 'lucide-react'
import { QuoteCard } from '@/components/pipeline/QuoteCard'
import { ChatPlaceholder } from '@/components/pipeline/ChatPlaceholder'

export default function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>
}) {
  const { id: projectId, phaseId } = use(params)
  const router = useRouter()

  const { data: project, isLoading } = trpc.pipeline.projects.getById.useQuery({ id: projectId })

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading phase...</p>
        </div>
      </div>
    )
  }

  const phase = project?.phases?.find((p) => p.id === phaseId)

  if (!project || !phase) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Phase not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The phase you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  // Convert Decimal to number
  const budgetAllocated = Number(phase.budgetAllocated)
  const budgetSpent = Number(phase.budgetSpent)

  const progressPercent = budgetAllocated > 0
    ? Math.min((budgetSpent / budgetAllocated) * 100, 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/pipeline/projects/${projectId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {project.name}
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{phase.type} Phase</h1>
            <p className="mt-2 text-zinc-600">{project.name}</p>
          </div>
          <Badge>{phase.status}</Badge>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Phase Management */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-600">Spent / Allocated</span>
                    <span className="font-medium">
                      €{budgetSpent.toLocaleString()} / €{budgetAllocated.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-zinc-600">Remaining</span>
                  <span className="text-lg font-bold">
                    €{(budgetAllocated - budgetSpent).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Vendor Quotes</h2>
            {!phase.quotes || phase.quotes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-zinc-600">No quotes yet. Request quotes from vendors to get started.</p>
                <Button className="mt-4" disabled>
                  Request Quote (Coming Soon)
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {phase.quotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    projectId={projectId}
                    phaseId={phaseId}
                    quote={{
                      ...quote,
                      amount: Number(quote.amount),
                      vendor: {
                        ...quote.vendor,
                        email: quote.vendor.email || '',
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Chat */}
        <div>
          <ChatPlaceholder />
        </div>
      </div>
    </div>
  )
}
