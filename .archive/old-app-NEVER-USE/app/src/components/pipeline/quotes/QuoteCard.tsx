'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Quote } from '@/types/pipeline'
import { formatCurrency } from '@/types/pipeline'
import { Building2, Calendar } from 'lucide-react'

type QuoteCardProps = {
  quote: Quote
}

const quoteStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  RECEIVED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  EXPIRED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export function QuoteCard({ quote }: QuoteCardProps) {
  const amount = Number(quote.amount)
  const receivedDate = new Date(quote.receivedAt)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Building2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold">{quote.vendor.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {quote.vendor.type.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Badge className={quoteStatusColors[quote.status] || quoteStatusColors.PENDING}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Amount */}
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Quote Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(amount, quote.currency)}</p>
        </div>

        {/* Valid Until */}
        {quote.validUntil && (
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Calendar className="h-4 w-4" />
            <span>Valid until {new Date(quote.validUntil).toLocaleDateString()}</span>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">Notes:</p>
            <p className="mt-1 line-clamp-2">{quote.notes}</p>
          </div>
        )}

        {/* Received Date */}
        <div className="text-xs text-zinc-500 pt-2 border-t">
          Received {receivedDate.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
}
