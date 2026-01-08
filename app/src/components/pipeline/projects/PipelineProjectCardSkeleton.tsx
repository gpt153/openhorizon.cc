'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PipelineProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </CardContent>
    </Card>
  )
}
