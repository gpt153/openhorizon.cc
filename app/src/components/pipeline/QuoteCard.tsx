'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

type QuoteCardProps = {
  projectId: string
  phaseId: string
  quote: {
    id: string
    amount: number
    notes: string | null
    status: string
    vendor: {
      id: string
      name: string
      email: string
    }
  }
}

export function QuoteCard({ projectId, phaseId, quote }: QuoteCardProps) {
  const utils = trpc.useUtils()

  const acceptMutation = trpc.pipeline.quotes.accept.useMutation({
    onSuccess: () => {
      toast.success('Quote accepted')
      utils.pipeline.projects.getById.invalidate({ id: projectId })
    },
    onError: (error) => {
      toast.error(`Failed to accept quote: ${error.message}`)
    },
  })

  const rejectMutation = trpc.pipeline.quotes.reject.useMutation({
    onSuccess: () => {
      toast.success('Quote rejected')
      utils.pipeline.projects.getById.invalidate({ id: projectId })
    },
    onError: (error) => {
      toast.error(`Failed to reject quote: ${error.message}`)
    },
  })

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const isPending = quote.status === 'PENDING'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold">{quote.vendor.name}</h4>
            <p className="text-sm text-zinc-600">{quote.vendor.email}</p>
          </div>
          <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold">€{quote.amount.toLocaleString()}</p>
            {quote.notes && (
              <p className="mt-2 text-sm text-zinc-600">{quote.notes}</p>
            )}
          </div>

          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => acceptMutation.mutate({ id: quote.id })}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate({ id: quote.id })}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
