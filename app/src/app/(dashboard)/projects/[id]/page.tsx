'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, Calendar, Users, Coins, AlertCircle } from 'lucide-react'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery({ id })

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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{project.tagline}</p>
          </div>
          <Badge>{project.status}</Badge>
        </div>
      </div>

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
