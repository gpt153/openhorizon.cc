'use client'

import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/types/budget'

interface BudgetBreakdownChartProps {
  phases: Array<{
    name: string
    type: string
    spent: number
  }>
}

const chartConfig = {
  spent: {
    label: 'Spent',
  },
  ACCOMMODATION: {
    label: 'Accommodation',
    color: 'hsl(var(--chart-1))',
  },
  TRAVEL: {
    label: 'Travel',
    color: 'hsl(var(--chart-2))',
  },
  FOOD: {
    label: 'Food',
    color: 'hsl(var(--chart-3))',
  },
  ACTIVITIES: {
    label: 'Activities',
    color: 'hsl(var(--chart-4))',
  },
  INSURANCE: {
    label: 'Insurance',
    color: 'hsl(var(--chart-5))',
  },
  EMERGENCY: {
    label: 'Emergency',
    color: 'hsl(var(--destructive))',
  },
  CUSTOM: {
    label: 'Other',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig

export function BudgetBreakdownChart({ phases }: BudgetBreakdownChartProps) {
  const chartData = phases
    .filter(phase => phase.spent > 0)
    .map((phase, index) => ({
      phase: phase.type,
      name: phase.name,
      spent: phase.spent,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const totalSpent = phases.reduce((sum, p) => sum + p.spent, 0)

  if (totalSpent === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <p>No expenses recorded yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.name
                  }
                  return ''
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="spent"
            nameKey="phase"
            innerRadius={60}
            strokeWidth={5}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent />}
            className="flex-wrap gap-2"
          />
        </PieChart>
      </ChartContainer>
      <div className="text-center">
        <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        <p className="text-sm text-muted-foreground">Total Spent</p>
      </div>
    </div>
  )
}
