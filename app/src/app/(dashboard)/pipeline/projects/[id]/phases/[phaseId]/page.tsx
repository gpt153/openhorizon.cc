'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuoteCard } from '@/components/pipeline/quotes/QuoteCard'
import { PhaseChat } from '@/components/pipeline/PhaseChat'
import { TravelSearchPanel } from '@/components/pipeline/TravelSearchPanel'
import { FoodSearchPanel } from '@/components/pipeline/FoodSearchPanel'
import { AccommodationSearchPanel } from '@/components/pipeline/AccommodationSearchPanel'
import { formatCurrency } from '@/types/pipeline'
import { ArrowLeft, Calendar, Loader2, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form state for edit dialog
  const [editForm, setEditForm] = useState({
    name: '',
    status: '',
    budgetAllocated: '',
    startDate: '',
    endDate: '',
  })

  const { data: phase, isLoading, error, refetch } = trpc.pipeline.phases.getById.useQuery({
    id: resolvedParams.phaseId,
  })

  const updateMutation = trpc.pipeline.phases.update.useMutation({
    onSuccess: () => {
      toast.success('Phase updated successfully')
      setEditDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to update phase: ${error.message}`)
    },
  })

  const deleteMutation = trpc.pipeline.phases.delete.useMutation({
    onSuccess: () => {
      toast.success('Phase deleted successfully')
      router.push(`/pipeline/projects/${resolvedParams.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to delete phase: ${error.message}`)
    },
  })

  const handleEditClick = () => {
    if (phase) {
      setEditForm({
        name: phase.name,
        status: phase.status,
        budgetAllocated: phase.budgetAllocated.toString(),
        startDate: new Date(phase.startDate).toISOString().split('T')[0],
        endDate: new Date(phase.endDate).toISOString().split('T')[0],
      })
      setEditDialogOpen(true)
    }
  }

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id: resolvedParams.phaseId,
      data: {
        name: editForm.name,
        status: editForm.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'BLOCKED',
        budgetAllocated: parseFloat(editForm.budgetAllocated),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id: resolvedParams.phaseId })
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading phase</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{error.message}</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/pipeline/projects/${resolvedParams.id}`)}
          >
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !phase) {
    return <PhaseDetailSkeleton />
  }

  const phaseStatusColors: Record<string, string> = {
    NOT_STARTED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    SKIPPED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  }

  const budgetAllocated = Number(phase.budgetAllocated)
  const budgetSpent = Number(phase.budgetSpent)
  const budgetRemaining = budgetAllocated - budgetSpent
  const budgetPercentage = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0

  // Color-coded budget progress
  const getBudgetProgressColor = () => {
    if (budgetPercentage > 90) return 'bg-red-500'
    if (budgetPercentage > 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const startDate = new Date(phase.startDate)
  const endDate = new Date(phase.endDate)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 text-sm">
          <ol className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/pipeline/projects" className="hover:text-blue-600 dark:hover:text-blue-400">
                Projects
              </Link>
            </li>
            <li className="text-zinc-400">/</li>
            <li>
              <Link
                href={`/pipeline/projects/${resolvedParams.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {phase.project.name}
              </Link>
            </li>
            <li className="text-zinc-400">/</li>
            <li className="text-zinc-900 dark:text-zinc-100 font-medium">{phase.name}</li>
          </ol>
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pipeline/projects/${resolvedParams.id}`)}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{phase.name}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {phase.type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={phaseStatusColors[phase.status]}>
              {phase.status.replace('_', ' ')}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Phase Meta */}
        <div className="flex items-center gap-4 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Budget Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Budget Status</h3>
                    {budgetPercentage > 90 && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(budgetSpent)} / {formatCurrency(budgetAllocated)}
                  </p>
                </div>
                <Progress value={budgetPercentage} className={`h-2 ${getBudgetProgressColor()}`} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {budgetPercentage.toFixed(1)}% spent
                  </span>
                  {budgetPercentage > 90 && (
                    <span className="text-red-600 font-medium">Over budget warning!</span>
                  )}
                  {budgetPercentage > 75 && budgetPercentage <= 90 && (
                    <span className="text-yellow-600 font-medium">Approaching budget limit</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Allocated</p>
                    <p className="text-lg font-semibold">{formatCurrency(budgetAllocated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Spent</p>
                    <p className="text-lg font-semibold">{formatCurrency(budgetSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Remaining</p>
                    <p className={`text-lg font-semibold ${budgetRemaining < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(budgetRemaining)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Phase: Special UI */}
          {phase.type === 'TRAVEL' ? (
            <div className="space-y-6">
              <TravelSearchPanel
                phaseId={resolvedParams.phaseId}
                defaultOrigin={phase.project.location}
                defaultDestination=""
                defaultPassengers={phase.project.participantCount}
              />

              {/* AI Chat for Travel */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Travel Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <PhaseChat
                    phaseId={resolvedParams.phaseId}
                    phaseType={phase.type}
                    phaseName={phase.name}
                  />
                </CardContent>
              </Card>
            </div>
          ) : phase.type === 'FOOD' ? (
            <div className="space-y-6">
              <FoodSearchPanel
                phaseId={resolvedParams.phaseId}
                defaultLocation={phase.project.location}
                defaultParticipants={phase.project.participantCount}
              />

              {/* AI Chat for Food */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Food Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <PhaseChat
                    phaseId={resolvedParams.phaseId}
                    phaseType={phase.type}
                    phaseName={phase.name}
                  />
                </CardContent>
              </Card>
            </div>
          ) : phase.type === 'ACCOMMODATION' ? (
            <div className="space-y-6">
              <AccommodationSearchPanel
                phaseId={resolvedParams.phaseId}
                defaultLocation={phase.project.location}
                defaultParticipants={phase.project.participantCount}
              />

              {/* AI Chat for Accommodation */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Accommodation Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <PhaseChat
                    phaseId={resolvedParams.phaseId}
                    phaseType={phase.type}
                    phaseName={phase.name}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Two Column Layout: Quotes and Chat (for other phase types) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Quotes</h2>
                  <Button size="sm" disabled>
                    Request Quotes (Disabled)
                  </Button>
                </div>

                {phase.quotes && phase.quotes.length > 0 ? (
                  <div className="space-y-4">
                    {phase.quotes.map((quote: any) => (
                      <QuoteCard key={quote.id} quote={quote} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-zinc-500">No quotes yet</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Request quotes from vendors to get pricing estimates
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* AI Chat Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
                <PhaseChat
                  phaseId={resolvedParams.phaseId}
                  phaseType={phase.type}
                  phaseName={phase.name}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phase</DialogTitle>
            <DialogDescription>
              Update the details of this phase. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Phase Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter phase name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SKIPPED">Skipped</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Allocated</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={editForm.budgetAllocated}
                onChange={(e) => setEditForm({ ...editForm, budgetAllocated: e.target.value })}
                placeholder="Enter budget amount"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{phase.name}"? This action cannot be undone.
              All associated quotes, communications, and AI conversations will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Phase'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Loading Skeleton Component
function PhaseDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="border-b px-6 py-4">
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-48 mt-4" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Budget Card Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
