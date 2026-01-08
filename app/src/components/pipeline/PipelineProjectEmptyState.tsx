import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Workflow } from 'lucide-react'

export function PipelineProjectEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-12 text-center">
      <Workflow className="h-12 w-12 text-zinc-400" />
      <h3 className="mt-4 text-lg font-semibold">No pipeline projects yet</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Create your first pipeline project to start managing vendors and calculating profit margins.
      </p>
      <Button asChild className="mt-6">
        <Link href="/pipeline/projects?create=true">Create Pipeline Project</Link>
      </Button>
    </div>
  )
}
