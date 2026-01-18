'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/types/pipeline'
import { LucideIcon } from 'lucide-react'

type ProfitSummaryCardProps = {
  title: string
  value: number | null
  icon: LucideIcon
  iconColor: string
  valueColor?: string
  suffix?: string
}

export function ProfitSummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  valueColor = 'text-zinc-900 dark:text-zinc-100',
  suffix,
}: ProfitSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>
          {value !== null ? (
            suffix ? `${value.toFixed(1)}${suffix}` : formatCurrency(value)
          ) : (
            'N/A'
          )}
        </div>
      </CardContent>
    </Card>
  )
}
