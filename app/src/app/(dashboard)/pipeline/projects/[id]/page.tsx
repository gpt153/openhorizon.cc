'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhaseCard } from '@/components/pipeline/phases/PhaseCard'
import { ExportReportButton } from '@/components/pipeline/projects/ExportReportButton'
import { BudgetCalculator } from '@/components/budget/BudgetCalculator'
import { BudgetOverviewDashboard } from '@/components/budget/BudgetOverviewDashboard'
import { BudgetHealthBadge } from '@/components/budget/BudgetHealthBadge'
import { formatCurrency, calculateProfitMarginPercentage, getProfitMarginColor } from '@/types/pipeline'
import { Calculator, Calendar, Users, MapPin, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PipelineProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isCalculating, setIsCalculating] = useState(false)

  const { data: project, isLoading, error, refetch } = trpc.pipeline.projects.getById.useQuery({
    id: resolvedParams.id,
  })

  const { data: budgetSummary } = trpc.pipeline.projects.getBudgetSummary.useQuery({
    id: resolvedParams.id,
  })

  const calculateGrant = trpc.pipeline.projects.calculateGrant.useMutation({
    onSuccess: () => {
      refetch()
      setIsCalculating(false)
    },
    onError: (error) => {
      console.error('Failed to calculate grant:', error)
      alert('Failed to calculate grant. Please ensure host country is set.')
      setIsCalculating(false)
    },
  })

  const handleCalculateGrant = () => {
    setIsCalculating(true)
    calculateGrant.mutate({ id: resolvedParams.id })
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading project</h2>
          <p className="text-sm text-zinc-600 mt-2">{error.message}</p>
          <Button className="mt-4" onClick={() => router.push('/pipeline/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/pipeline/projects')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {budgetSummary && <BudgetHealthBadge health={budgetSummary.health} />}
            <ExportReportButton projectId={project.id} projectName={project.name} />
            <Badge className={statusColors[project.status]}>
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Project Meta */}
        <div className="flex items-center gap-6 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{project.participantCount} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} ({durationDays} days)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{project.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Budget Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(Number(project.budgetTotal))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Budget Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(project.budgetSpent))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(project.budgetTotal) - Number(project.budgetSpent))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview - Profit & Margin Display */}
          {grantAmount && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Grant Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(grantAmount)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Erasmus+ income</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Estimated Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(estimatedCosts || 0)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Profit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(grantAmount - (estimatedCosts || 0))}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Grant - Costs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Profit Margin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${getProfitMarginColor(profitMargin)}`}>
                      {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {profitMargin !== null && profitMargin > 30 && 'Excellent'}
                      {profitMargin !== null && profitMargin >= 15 && profitMargin <= 30 && 'Good'}
                      {profitMargin !== null && profitMargin < 15 && 'Low'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tabs for Budget Calculator, Budget Tracking, and Phases */}
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">Budget Calculator</TabsTrigger>
              <TabsTrigger value="tracking">Budget Tracking</TabsTrigger>
              <TabsTrigger value="phases">Project Phases</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="mt-6">
              <BudgetCalculator projectId={project.id} onSave={() => refetch()} />
            </TabsContent>

            <TabsContent value="tracking" className="mt-6">
              {budgetSummary ? (
                <BudgetOverviewDashboard
                  summary={budgetSummary}
                  trendData={budgetSummary.trendData || []}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-zinc-500 mt-4">Loading budget tracking data...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="phases" className="mt-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Project Phases</h2>
                </div>

                {project.phases && project.phases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.phases.map((phase: any) => (
                      <PhaseCard key={phase.id} phase={phase} projectId={project.id} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-zinc-500">No phases configured yet</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Phases will be created automatically when needed
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
