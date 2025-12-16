'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FolderPlus } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
        <FolderPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>

      <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Get started by creating your first Erasmus+ Youth Exchange project. Our AI will help you transform your idea into a complete project concept.
      </p>

      <Button asChild className="mt-6">
        <Link href="/dashboard/projects/new">Create Your First Project</Link>
      </Button>
    </div>
  )
}
