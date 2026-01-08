import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

type ProfitSummaryCardProps = {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple'
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
}

export function ProfitSummaryCard({ title, value, subtitle, icon: Icon, color }: ProfitSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg bg-${color}-50 p-3`}>
            <Icon className={`h-6 w-6 ${colorClasses[color]}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
