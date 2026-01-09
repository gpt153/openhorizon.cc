'use client'

import { FileStack } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PipelineProjectEmptyStateProps = {
  onCreateClick: () => void
}

export function PipelineProjectEmptyState({ onCreateClick }: PipelineProjectEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
        <FileStack className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Pipeline Projects Yet</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-md">
        Create your first pipeline project to start managing Erasmus+ applications, budgets, and vendor communications.
      </p>
      <Button onClick={onCreateClick} size="lg">
        Create Your First Project
      </Button>
    </div>
  )
}
