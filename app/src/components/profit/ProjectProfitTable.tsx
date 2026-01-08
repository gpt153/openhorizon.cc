'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

type ProjectProfitData = {
  id: string
  name: string
  erasmusGrantCalculated: number | null
  estimatedCosts: number | null
  profitMargin: number | null
  status: string
}

type ProjectProfitTableProps = {
  projects: ProjectProfitData[]
}

export function ProjectProfitTable({ projects }: ProjectProfitTableProps) {
  const router = useRouter()

  const getProfitColor = (margin: number | null) => {
    if (!margin) return 'text-zinc-600'
    if (margin >= 30) return 'text-green-600'
    if (margin >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginBadgeColor = (margin: number | null) => {
    if (!margin) return 'bg-zinc-100 text-zinc-700'
    if (margin >= 30) return 'bg-green-100 text-green-700'
    if (margin >= 15) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    PLANNING: 'bg-blue-100 text-blue-700',
    VENDOR_RESEARCH: 'bg-purple-100 text-purple-700',
    QUOTES_PENDING: 'bg-yellow-100 text-yellow-700',
    READY_TO_SUBMIT: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-zinc-600">No projects with calculated grants yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-zinc-50 dark:bg-zinc-900">
                <th className="p-4 text-left text-sm font-semibold">Project Name</th>
                <th className="p-4 text-right text-sm font-semibold">Grant</th>
                <th className="p-4 text-right text-sm font-semibold">Costs</th>
                <th className="p-4 text-right text-sm font-semibold">Profit</th>
                <th className="p-4 text-center text-sm font-semibold">Margin</th>
                <th className="p-4 text-center text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const profitAmount = project.erasmusGrantCalculated && project.estimatedCosts
                  ? project.erasmusGrantCalculated - project.estimatedCosts
                  : null

                return (
                  <tr
                    key={project.id}
                    onClick={() => router.push(`/pipeline/projects/${project.id}`)}
                    className="border-b cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4 text-right">
                      {project.erasmusGrantCalculated
                        ? `€${project.erasmusGrantCalculated.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {project.estimatedCosts
                        ? `€${project.estimatedCosts.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className={`p-4 text-right font-medium ${getProfitColor(project.profitMargin)}`}>
                      {profitAmount !== null ? `€${profitAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {project.profitMargin !== null ? (
                        <Badge className={getMarginBadgeColor(project.profitMargin)}>
                          {project.profitMargin}%
                        </Badge>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                        {project.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
