'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { SpendingTrendData, formatCurrency } from '@/types/budget'

interface BudgetTrendChartProps {
  data: SpendingTrendData[]
}

const chartConfig = {
  spending: {
    label: 'Daily Spending',
    color: 'hsl(var(--chart-1))',
  },
  cumulative: {
    label: 'Cumulative',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function BudgetTrendChart({ data }: BudgetTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>No expense data available</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            return new Date(value).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString('sv-SE', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
          }
        />
        <Area
          dataKey="cumulative"
          type="monotone"
          fill="hsl(var(--chart-2))"
          fillOpacity={0.4}
          stroke="hsl(var(--chart-2))"
          stackId="a"
        />
        <Area
          dataKey="spending"
          type="monotone"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.2}
          stroke="hsl(var(--chart-1))"
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  )
}
