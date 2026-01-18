'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PipelineProjectCard } from '@/components/pipeline/projects/PipelineProjectCard'
import { PipelineProjectCardSkeleton } from '@/components/pipeline/projects/PipelineProjectCardSkeleton'
import { PipelineProjectEmptyState } from '@/components/pipeline/projects/PipelineProjectEmptyState'
import { CreateProjectDialog } from '@/components/pipeline/projects/CreateProjectDialog'

export default function PipelineProjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: projects, isLoading, error } = trpc.pipeline.projects.list.useQuery()

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading projects</h2>
          <p className="text-sm text-zinc-600 mt-2">{error.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Projects</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage Erasmus+ applications, budgets, and vendor communications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PipelineProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <PipelineProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <PipelineProjectEmptyState onCreateClick={() => setCreateDialogOpen(true)} />
        )}
      </div>

      {/* Create Dialog */}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
