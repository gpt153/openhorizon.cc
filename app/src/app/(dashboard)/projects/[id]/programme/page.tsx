'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc/client'
import { useContentField } from '@/lib/hooks/useContentField'
import { ContentModeBadge } from '@/components/ui/ContentModeBadge'
import {
  Loader2,
  ArrowLeft,
  Clock,
  Users,
  Pencil,
  ListChecks,
  Lightbulb,
  Package,
  MapPin,
  Languages
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()

  const { data: project } = trpc.projects.getById.useQuery({ id: projectId })
  const { data: programme, isLoading } = trpc.programmes.getByProjectId.useQuery({ projectId })

  const [editingSession, setEditingSession] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    learningObjectives: [] as string[],
    materialsNeeded: [] as string[],
    preparationNotes: '',
  })

  const utils = trpc.useUtils()
  const updateSessionMutation = trpc.programmes.updateSession.useMutation({
    onSuccess: () => {
      utils.programmes.getByProjectId.invalidate({ projectId })
      toast.success('Session updated successfully')
      setEditingSession(null)
    },
    onError: (error) => {
      toast.error(`Failed to update session: ${error.message}`)
    },
  })

  const handleEditSession = (session: any) => {
    setEditingSession(session)
    setEditForm({
      title: session.title,
      description: session.description || '',
      learningObjectives: session.learningObjectives || [],
      materialsNeeded: session.materialsNeeded || [],
      preparationNotes: session.preparationNotes || '',
    })
  }

  const handleSaveSession = () => {
    updateSessionMutation.mutate({
      sessionId: editingSession.id,
      data: editForm,
    })
  }

  const formatTime = (timeDate: Date) => {
    return new Date(timeDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const getActivityIcon = (type: string) => {
    const iconClass = "h-4 w-4"
    switch (type?.toLowerCase()) {
      case 'icebreaker':
        return <Users className={iconClass} />
      case 'workshop':
        return <Lightbulb className={iconClass} />
      case 'reflection':
        return <ListChecks className={iconClass} />
      default:
        return <Clock className={iconClass} />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'icebreaker':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'workshop':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'reflection':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'energizer':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'meal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'free_time':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-indigo-100 text-indigo-700 border-indigo-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading programme...</p>
        </div>
      </div>
    )
  }

  if (!programme) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">No programme found</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Generate a programme from the project detail page.
          </p>
          <Button onClick={() => router.push(`/projects/${projectId}`)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Programme Schedule</h1>
            <p className="mt-2 text-lg text-zinc-600">{project?.title}</p>
          </div>
          <Badge variant="outline">{programme.days.length} Days</Badge>
        </div>
      </div>

      {/* Day Tabs */}
      <Tabs defaultValue="day-1" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto">
          {programme.days.map((day) => (
            <TabsTrigger key={day.id} value={`day-${day.dayNumber}`}>
              Day {day.dayNumber}
            </TabsTrigger>
          ))}
        </TabsList>

        {programme.days.map((day) => (
          <TabsContent key={day.id} value={`day-${day.dayNumber}`} className="space-y-6">
            {/* Day Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Day {day.dayNumber}: {day.theme}</CardTitle>
                    {day.date && (
                      <p className="text-sm text-zinc-600 mt-1">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {day.morningFocus && (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-500">Morning Focus</p>
                        <ContentModeBadge formalValue={day.morningFocusFormal} inline />
                      </div>
                      <p className="mt-1 text-sm">
                        {useContentField(day.morningFocus, day.morningFocusFormal)}
                      </p>
                    </div>
                  )}
                  {day.afternoonFocus && (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-500">Afternoon Focus</p>
                        <ContentModeBadge formalValue={day.afternoonFocusFormal} inline />
                      </div>
                      <p className="mt-1 text-sm">
                        {useContentField(day.afternoonFocus, day.afternoonFocusFormal)}
                      </p>
                    </div>
                  )}
                  {day.eveningFocus && (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-500">Evening Focus</p>
                        <ContentModeBadge formalValue={day.eveningFocusFormal} inline />
                      </div>
                      <p className="mt-1 text-sm">
                        {useContentField(day.eveningFocus, day.eveningFocusFormal)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            <div className="space-y-4">
              {day.sessions.map((session) => (
                <Card
                  key={session.id}
                  className="relative overflow-hidden border-l-4"
                  style={{ borderLeftColor: `var(--${session.activityType?.toLowerCase()}-color, #3b82f6)` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </span>
                          </div>
                          {session.activityType && (
                            <Badge
                              variant="outline"
                              className={`${getActivityColor(session.activityType)} border`}
                            >
                              <span className="mr-1">{getActivityIcon(session.activityType)}</span>
                              {session.activityType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <CardTitle>{useContentField(session.title, session.titleFormal)}</CardTitle>
                          <ContentModeBadge formalValue={session.titleFormal} inline />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSession(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {session.description && (
                      <div>
                        <p className="text-sm text-zinc-700">
                          {useContentField(session.description, session.descriptionFormal)}
                        </p>
                        <ContentModeBadge formalValue={session.descriptionFormal} inline />
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      {session.learningObjectives?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-medium">Learning Objectives</p>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
                            {session.learningObjectives.map((obj: string, i: number) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {session.materialsNeeded?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium">Materials Needed</p>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
                            {session.materialsNeeded.map((material: string, i: number) => (
                              <li key={i}>{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 text-xs text-zinc-600">
                      {session.methodology && (
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-3 w-3" />
                          <span><strong>Method:</strong> {session.methodology}</span>
                        </div>
                      )}
                      {session.groupSize && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span><strong>Group:</strong> {session.groupSize}</span>
                        </div>
                      )}
                      {session.spaceRequirements && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span><strong>Space:</strong> {session.spaceRequirements}</span>
                        </div>
                      )}
                    </div>

                    {session.preparationNotes && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-blue-900">Facilitator Notes</p>
                          <ContentModeBadge formalValue={session.preparationNotesFormal} inline />
                        </div>
                        <p className="mt-1 text-blue-800">
                          {useContentField(session.preparationNotes, session.preparationNotesFormal)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update session details for better facilitation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="objectives">Learning Objectives (one per line)</Label>
              <Textarea
                id="objectives"
                value={editForm.learningObjectives.join('\n')}
                onChange={(e) => setEditForm({
                  ...editForm,
                  learningObjectives: e.target.value.split('\n').filter(l => l.trim())
                })}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="materials">Materials Needed (one per line)</Label>
              <Textarea
                id="materials"
                value={editForm.materialsNeeded.join('\n')}
                onChange={(e) => setEditForm({
                  ...editForm,
                  materialsNeeded: e.target.value.split('\n').filter(l => l.trim())
                })}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Preparation Notes</Label>
              <Textarea
                id="notes"
                value={editForm.preparationNotes}
                onChange={(e) => setEditForm({ ...editForm, preparationNotes: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSession}
              disabled={updateSessionMutation.isPending || !editForm.title.trim()}
            >
              {updateSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
