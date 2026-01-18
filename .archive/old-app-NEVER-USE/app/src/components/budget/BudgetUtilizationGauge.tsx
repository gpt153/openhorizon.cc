'use client'

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart'

interface BudgetUtilizationGaugeProps {
  allocated: number
  spent: number
}

const chartConfig = {
  budget: {
    label: 'Budget Utilized',
  },
} satisfies ChartConfig

export function BudgetUtilizationGauge({ allocated, spent }: BudgetUtilizationGaugeProps) {
  const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return 'hsl(var(--destructive))' // red
    if (percentage >= 90) return '#f59e0b' // orange
    if (percentage >= 75) return '#eab308' // yellow
    return '#16a34a' // green
  }

  const chartData = [
    {
      category: 'budget',
      value: Math.min(percentage, 100), // Cap at 100 for visual
      fill: getColor(),
    },
  ]

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={0}
        endAngle={Math.min(percentage, 100) * 3.6}
        innerRadius={80}
        outerRadius={140}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {percentage}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Utilized
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  )
}
