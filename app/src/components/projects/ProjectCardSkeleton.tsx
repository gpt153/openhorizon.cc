import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
