'use client'

import { Button } from '@/components/ui/button'
import { PipelineProjectCard } from '@/components/pipeline/PipelineProjectCard'
import { PipelineProjectCardSkeleton } from '@/components/pipeline/PipelineProjectCardSkeleton'
import { PipelineProjectEmptyState } from '@/components/pipeline/PipelineProjectEmptyState'
import { trpc } from '@/lib/trpc/client'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateProjectDialog } from '@/components/pipeline/CreateProjectDialog'

export default function PipelineProjectsPage() {
  const { data: projects, isLoading } = trpc.pipeline.projects.list.useQuery()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Projects</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage vendor coordination and track profit margins for your Erasmus+ projects
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Pipeline Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PipelineProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <PipelineProjectEmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PipelineProjectCard
              key={project.id}
              project={{
                ...project,
                erasmusGrantCalculated: project.erasmusGrantCalculated ? Number(project.erasmusGrantCalculated) : null,
                estimatedCosts: project.estimatedCosts ? Number(project.estimatedCosts) : null,
                profitMargin: project.profitMargin ? Number(project.profitMargin) : null,
              }}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
