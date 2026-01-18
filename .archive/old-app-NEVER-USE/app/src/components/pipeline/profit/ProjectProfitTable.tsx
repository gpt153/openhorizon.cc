'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ProfitData, formatCurrency, getProfitMarginColor } from '@/types/pipeline'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type ProjectProfitTableProps = {
  projects: ProfitData[]
}

type SortField = 'name' | 'participants' | 'grant' | 'costs' | 'profit' | 'margin'
type SortDirection = 'asc' | 'desc'

export function ProjectProfitTable({ projects }: ProjectProfitTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    let compareA: any
    let compareB: any

    switch (sortField) {
      case 'name':
        compareA = a.projectName.toLowerCase()
        compareB = b.projectName.toLowerCase()
        break
      case 'participants':
        compareA = a.participantCount
        compareB = b.participantCount
        break
      case 'grant':
        compareA = a.grantAmount || 0
        compareB = b.grantAmount || 0
        break
      case 'costs':
        compareA = a.estimatedCosts || 0
        compareB = b.estimatedCosts || 0
        break
      case 'profit':
        compareA = a.profit || 0
        compareB = b.profit || 0
        break
      case 'margin':
        compareA = a.profitMargin || 0
        compareB = b.profitMargin || 0
        break
    }

    if (sortDirection === 'asc') {
      return compareA > compareB ? 1 : -1
    } else {
      return compareA < compareB ? 1 : -1
    }
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="font-semibold"
              >
                Project Name
                <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort('participants')}
                className="font-semibold"
              >
                Participants
                <SortIcon field="participants" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort('grant')}
                className="font-semibold"
              >
                Grant Amount
                <SortIcon field="grant" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort('costs')}
                className="font-semibold"
              >
                Est. Costs
                <SortIcon field="costs" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort('profit')}
                className="font-semibold"
              >
                Profit
                <SortIcon field="profit" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort('margin')}
                className="font-semibold"
              >
                Margin %
                <SortIcon field="margin" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                No projects with grant data yet
              </TableCell>
            </TableRow>
          ) : (
            sortedProjects.map((project) => (
              <TableRow
                key={project.projectId}
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={() => router.push(`/pipeline/projects/${project.projectId}`)}
              >
                <TableCell className="font-medium">{project.projectName}</TableCell>
                <TableCell className="text-right">{project.participantCount}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(project.grantAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(project.estimatedCosts)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(project.profit)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${getProfitMarginColor(project.profitMargin)}`}>
                  {project.profitMargin !== null ? `${project.profitMargin.toFixed(1)}%` : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
