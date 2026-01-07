// React Query hooks for budget data and calculations
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Project, Phase } from '../types'

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  percentageSpent: number
  projectCount: number
  phaseCount: number
  overBudgetCount: number
}

export interface ProjectBudget {
  project: Project
  budget_allocated: number
  budget_spent: number
  budget_remaining: number
  percentage_spent: number
  phase_count: number
  is_over_budget: boolean
}

export interface PhaseBudget {
  phase: Phase
  budget_allocated: number
  budget_spent: number
  budget_remaining: number
  percentage_spent: number
  is_over_budget: boolean
}

/**
 * Get overall budget summary across all projects
 */
export function useBudgetSummary() {
  return useQuery({
    queryKey: ['budget', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      const projects = data.projects

      const summary: BudgetSummary = {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        percentageSpent: 0,
        projectCount: projects.length,
        phaseCount: 0,
        overBudgetCount: 0,
      }

      projects.forEach((project) => {
        summary.totalBudget += project.budget_total
        summary.totalSpent += project.budget_spent
        summary.phaseCount += project._count?.phases || 0

        if (project.budget_spent > project.budget_total) {
          summary.overBudgetCount++
        }
      })

      summary.totalRemaining = summary.totalBudget - summary.totalSpent
      summary.percentageSpent =
        summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0

      return summary
    },
  })
}

/**
 * Get budget breakdown by project
 */
export function useProjectBudgets() {
  return useQuery({
    queryKey: ['budget', 'projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      const projects = data.projects

      const projectBudgets: ProjectBudget[] = projects.map((project) => {
        const budget_allocated = project.budget_total
        const budget_spent = project.budget_spent
        const budget_remaining = budget_allocated - budget_spent
        const percentage_spent =
          budget_allocated > 0 ? (budget_spent / budget_allocated) * 100 : 0
        const is_over_budget = budget_spent > budget_allocated

        return {
          project,
          budget_allocated,
          budget_spent,
          budget_remaining,
          percentage_spent,
          phase_count: project._count?.phases || 0,
          is_over_budget,
        }
      })

      // Sort by percentage spent (descending) - most critical first
      return projectBudgets.sort((a, b) => b.percentage_spent - a.percentage_spent)
    },
  })
}

/**
 * Get budget breakdown for a specific project's phases
 */
export function useProjectPhaseBudgets(projectId: string) {
  return useQuery({
    queryKey: ['budget', 'project', projectId, 'phases'],
    queryFn: async () => {
      const { data } = await api.get<{ phases: Phase[] }>(`/projects/${projectId}/phases`)
      const phases = data.phases

      const phaseBudgets: PhaseBudget[] = phases.map((phase) => {
        const budget_allocated = phase.budget_allocated
        const budget_spent = phase.budget_spent
        const budget_remaining = budget_allocated - budget_spent
        const percentage_spent =
          budget_allocated > 0 ? (budget_spent / budget_allocated) * 100 : 0
        const is_over_budget = budget_spent > budget_allocated

        return {
          phase,
          budget_allocated,
          budget_spent,
          budget_remaining,
          percentage_spent,
          is_over_budget,
        }
      })

      // Sort by percentage spent (descending)
      return phaseBudgets.sort((a, b) => b.percentage_spent - a.percentage_spent)
    },
    enabled: !!projectId,
  })
}

/**
 * Get spending trend data (mock for now, would be real endpoint in production)
 */
export function useSpendingTrend(projectId?: string) {
  return useQuery({
    queryKey: ['budget', 'trend', projectId],
    queryFn: async () => {
      // In a real app, this would call an endpoint that provides historical spending data
      // For now, we'll calculate a simple trend based on current data
      const endpoint = projectId ? `/projects/${projectId}` : '/projects'
      const { data } = await api.get(endpoint)

      const project = projectId ? data.project : null
      const projects = projectId ? [project] : data.projects

      // Simple trend: assume linear spending over time
      const currentDate = new Date()
      const trend = projects.map((p: Project) => {
        const startDate = new Date(p.start_date)
        const endDate = new Date(p.end_date)
        const totalDays = Math.max(
          1,
          Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        )
        const daysPassed = Math.max(
          0,
          Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        )

        const expectedSpent = (p.budget_total * daysPassed) / totalDays
        const variance = p.budget_spent - expectedSpent

        return {
          projectId: p.id,
          projectName: p.name,
          expectedSpent,
          actualSpent: p.budget_spent,
          variance,
          isAheadOfSchedule: variance > 0,
        }
      })

      return trend
    },
    enabled: true,
  })
}
