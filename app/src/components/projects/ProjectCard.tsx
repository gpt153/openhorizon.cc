'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users } from 'lucide-react'

type Project = {
  id: string
  title: string
  tagline: string | null
  status: string
  participantCount: number
  durationDays: number
  createdAt: Date
}

export function ProjectCard({ project }: { project: Project }) {
  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    CONCEPT: 'bg-blue-100 text-blue-700',
    PLANNING: 'bg-purple-100 text-purple-700',
    APPLICATION_DRAFT: 'bg-yellow-100 text-yellow-700',
    SUBMITTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-cyan-100 text-cyan-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{project.title}</h3>
              {project.tagline && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {project.tagline}
                </p>
              )}
            </div>
            <Badge
              className={statusColors[project.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.participantCount} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{project.durationDays} days</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
