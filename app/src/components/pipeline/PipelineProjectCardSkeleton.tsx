import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PipelineProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
          <div className="h-px bg-zinc-200" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
