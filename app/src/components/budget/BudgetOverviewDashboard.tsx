'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetBreakdownChart } from './BudgetBreakdownChart'
import { BudgetTrendChart } from './BudgetTrendChart'
import { BudgetUtilizationGauge } from './BudgetUtilizationGauge'
import { BudgetHealthBadge } from './BudgetHealthBadge'
import { formatCurrency, BudgetSummary, SpendingTrendData } from '@/types/budget'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

interface BudgetOverviewDashboardProps {
  summary: BudgetSummary
  trendData: SpendingTrendData[]
}

export function BudgetOverviewDashboard({ summary, trendData }: BudgetOverviewDashboardProps) {
  const { totalBudget, totalSpent, totalRemaining, health, phases } = summary

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Allocated across all phases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {health.percentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">Available for spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <BudgetHealthBadge health={health} />
            <p className="text-xs text-muted-foreground mt-2">{health.percentage.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Overall budget consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetUtilizationGauge allocated={totalBudget} spent={totalSpent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Phase</CardTitle>
            <CardDescription>Budget allocation across project phases</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetBreakdownChart
              phases={phases.map(p => ({
                name: p.name,
                type: p.type,
                spent: p.spent,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Daily and cumulative spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
            </TabsList>
            <TabsContent value="trends" className="space-y-4">
              <BudgetTrendChart data={trendData} />
            </TabsContent>
            <TabsContent value="phases" className="space-y-4">
              <div className="space-y-4">
                {phases.map(phase => (
                  <div key={phase.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{phase.name}</p>
                      <p className="text-sm text-muted-foreground">{phase.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(phase.spent)} / {formatCurrency(phase.allocated)}</p>
                      <p className="text-sm text-muted-foreground">{phase.percentage.toFixed(1)}% used</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
