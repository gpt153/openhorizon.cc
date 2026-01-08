'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ProfitSummaryCard } from '@/components/profit/ProfitSummaryCard'
import { ProjectProfitTable } from '@/components/profit/ProjectProfitTable'
import { trpc } from '@/lib/trpc/client'
import { Loader2, TrendingUp, DollarSign, PiggyBank } from 'lucide-react'

export default function ProfitDashboardPage() {
  const { data: summary, isLoading } = trpc.pipeline.projects.getProfitSummary.useQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading profit data...</p>
        </div>
      </div>
    )
  }

  const totalGrants = summary?.totalGrantsCalculated || 0
  const totalCosts = summary?.totalEstimatedCosts || 0
  const totalProfit = summary?.estimatedProfit || 0
  const avgMargin = totalGrants > 0 ? ((totalProfit / totalGrants) * 100).toFixed(1) : '0'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profit Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track accumulated profit across all pipeline projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <ProfitSummaryCard
          title="Total Grants"
          value={`€${totalGrants.toLocaleString()}`}
          subtitle="Erasmus+ income"
          icon={DollarSign}
          color="blue"
        />
        <ProfitSummaryCard
          title="Total Costs"
          value={`€${totalCosts.toLocaleString()}`}
          subtitle="Vendor expenses"
          icon={TrendingUp}
          color="purple"
        />
        <ProfitSummaryCard
          title="Accumulated Profit"
          value={`€${totalProfit.toLocaleString()}`}
          subtitle={`${avgMargin}% average margin`}
          icon={PiggyBank}
          color="green"
        />
      </div>

      {/* Projects Table */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Projects Breakdown</h2>
        <ProjectProfitTable
          projects={(summary?.projects || []).map((project) => ({
            ...project,
            erasmusGrantCalculated: project.erasmusGrantCalculated ? Number(project.erasmusGrantCalculated) : null,
            estimatedCosts: project.estimatedCosts ? Number(project.estimatedCosts) : null,
            profitMargin: project.profitMargin ? Number(project.profitMargin) : null,
          }))}
        />
      </div>

      {/* Empty State */}
      {(!summary || summary.projects.length === 0) && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No profit data yet</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create pipeline projects and calculate Erasmus+ grants to see profit analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
