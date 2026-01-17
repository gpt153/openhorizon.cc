'use client'

import { trpc } from '@/lib/trpc/client'
import { ProfitSummaryCard } from '@/components/pipeline/profit/ProfitSummaryCard'
import { ProjectProfitTable } from '@/components/pipeline/profit/ProjectProfitTable'
import { ProfitData, ProfitSummary, calculateProfitMarginPercentage } from '@/types/pipeline'
import { DollarSign, TrendingDown, TrendingUp, Percent, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

export default function ProfitDashboardPage() {
  const { data: projects, isLoading, error } = trpc.pipeline.projects.list.useQuery()

  const { profitData, profitSummary } = useMemo(() => {
    if (!projects) {
      return { profitData: [], profitSummary: null }
    }

    // Calculate profit data for each project
    const profitData: ProfitData[] = projects
      .filter((project: any) => project.erasmusGrantCalculated) // Only include projects with calculated grants
      .map((project: any) => {
        const grantAmount = project.erasmusGrantCalculated ? Number(project.erasmusGrantCalculated) : null
        const estimatedCosts = project.estimatedCosts ? Number(project.estimatedCosts) : null
        const profit = grantAmount && estimatedCosts !== null ? grantAmount - estimatedCosts : null
        const profitMargin = calculateProfitMarginPercentage(grantAmount, estimatedCosts)

        return {
          projectId: project.id,
          projectName: project.name,
          participantCount: project.participantCount,
          grantAmount,
          estimatedCosts,
          profit,
          profitMargin,
        }
      })

    // Calculate summary metrics
    const totalIncome = profitData.reduce((sum, p) => sum + (p.grantAmount || 0), 0)
    const totalCosts = profitData.reduce((sum, p) => sum + (p.estimatedCosts || 0), 0)
    const totalProfit = totalIncome - totalCosts
    const averageMargin = profitData.length > 0
      ? profitData.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / profitData.length
      : 0

    const profitSummary: ProfitSummary = {
      totalIncome,
      totalCosts,
      totalProfit,
      averageMargin,
      projectCount: profitData.length,
    }

    return { profitData, profitSummary }
  }, [projects])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading profit data</h2>
          <p className="text-sm text-zinc-600 mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !profitSummary) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Profit Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Track income, costs, and profit margins across all pipeline projects
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfitSummaryCard
              title="Total Income"
              value={profitSummary.totalIncome}
              icon={DollarSign}
              iconColor="text-blue-600"
            />
            <ProfitSummaryCard
              title="Total Costs"
              value={profitSummary.totalCosts}
              icon={TrendingDown}
              iconColor="text-red-600"
            />
            <ProfitSummaryCard
              title="Total Profit"
              value={profitSummary.totalProfit}
              icon={TrendingUp}
              iconColor="text-green-600"
              valueColor={
                profitSummary.totalProfit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            />
            <ProfitSummaryCard
              title="Average Margin"
              value={profitSummary.averageMargin}
              icon={Percent}
              iconColor="text-purple-600"
              suffix="%"
              valueColor={
                profitSummary.averageMargin >= 30
                  ? 'text-green-600 dark:text-green-400'
                  : profitSummary.averageMargin >= 15
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }
            />
          </div>

          {/* Project Profit Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Project Profit Analysis</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {profitData.length} project{profitData.length !== 1 ? 's' : ''} with grant data
              </p>
            </div>
            <ProjectProfitTable projects={profitData} />
          </div>

          {/* Color Legend */}
          {profitData.length > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">Profit Margin Legend:</p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600" />
                <span className="text-zinc-600 dark:text-zinc-400">&gt;30% (Excellent)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-600" />
                <span className="text-zinc-600 dark:text-zinc-400">15-30% (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-600" />
                <span className="text-zinc-600 dark:text-zinc-400">&lt;15% (Low)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
