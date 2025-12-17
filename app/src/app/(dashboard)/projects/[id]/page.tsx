'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, Calendar, Users, Coins, AlertCircle, Pencil, Trash2, Download, Sparkles, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery({ id })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedTagline, setEditedTagline] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Programme queries and mutations
  const { data: programme } = trpc.programmes.getByProjectId.useQuery({ projectId: id })
  const generateProgrammeMutation = trpc.programmes.generateFromConcept.useMutation({
    onSuccess: () => {
      toast.success('Programme generation started! This may take 1-2 minutes.')
      // Refetch programme to show loading state
      utils.programmes.getByProjectId.invalidate({ projectId: id })
    },
    onError: (error) => {
      toast.error(`Failed to generate programme: ${error.message}`)
    },
  })

  // Update page title when project loads
  useEffect(() => {
    if (project) {
      document.title = `${project.title} | Open Horizon`
    }
  }, [project])

  const utils = trpc.useUtils()
  const updateMutation = trpc.projects.updateProject.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id })
      toast.success('Project updated successfully')
      setIsEditingTitle(false)
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`)
    },
  })

  const deleteMutation = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      toast.success('Project deleted successfully')
      router.push('/projects')
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`)
    },
  })

  const handleEditTitle = () => {
    if (project) {
      setEditedTitle(project.title)
      setEditedTagline(project.tagline || '')
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = () => {
    updateMutation.mutate({
      id,
      data: {
        title: editedTitle,
        tagline: editedTagline,
      },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id })
  }

  const handleGenerateProgramme = () => {
    generateProgrammeMutation.mutate({ projectId: id })
  }

  const handleViewProgramme = () => {
    router.push(`/projects/${id}/programme`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Error loading project</h2>
          <p className="mt-2 text-sm text-zinc-600">{error.message}</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const objectives = project.objectives as any[]
  const activities = project.activityOutline as any[]
  const outcomes = project.learningOutcomes as any[]
  const budget = project.estimatedBudgetRange as any

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditTitle}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{project.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{project.status}</Badge>
            {programme ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleViewProgramme}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                View Programme
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateProgramme}
                disabled={generateProgrammeMutation.isPending}
              >
                {generateProgrammeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Build Programme
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Export feature coming soon!')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Title Dialog */}
      <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>
              Update your project title and tagline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={editedTagline}
                onChange={(e) => setEditedTagline(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTitle(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTitle}
              disabled={updateMutation.isPending || !editedTitle.trim()}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-2xl font-bold">{project.participantCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold">{project.durationDays} days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Est. Budget</p>
                <p className="text-2xl font-bold">
                  {budget ? `€${budget.min.toLocaleString()} - €${budget.max.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objectives?.map((obj, i) => (
              <div key={i}>
                <p className="font-medium">{obj.text}</p>
                <p className="text-sm text-zinc-600">→ Erasmus+ Priority: {obj.erasmus_priority}</p>
                {i < objectives.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Group */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Target Group</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{project.targetGroupDescription}</p>
        </CardContent>
      </Card>

      {/* Activity Outline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activity Outline ({activities?.length} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.slice(0, 5).map((day) => (
              <div key={day.day} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium">Day {day.day}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Morning:</span> {day.morning}</p>
                  <p><span className="font-medium">Afternoon:</span> {day.afternoon}</p>
                  <p><span className="font-medium">Evening:</span> {day.evening}</p>
                </div>
              </div>
            ))}
            {activities?.length > 5 && (
              <p className="text-sm text-zinc-500">+ {activities.length - 5} more days...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {outcomes?.map((outcome, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-blue-600">{outcome.category}</p>
                <p>{outcome.outcome}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inclusion Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inclusion & Accessibility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{project.inclusionPlanOverview}</p>
        </CardContent>
      </Card>

      {/* Partner Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Partner Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{project.partnerProfile}</p>
        </CardContent>
      </Card>

      {/* Sustainability & Impact */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sustainability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{project.sustainabilityNarrative}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{project.impactNarrative}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
