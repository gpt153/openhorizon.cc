// React Query hooks for project phases
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { Phase } from '../types'

// GET /projects/:projectId/phases - Get phases for a project
export function usePhases(projectId: string) {
  return useQuery({
    queryKey: ['phases', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ phases: Phase[] }>(`/projects/${projectId}/phases`)
      return data.phases
    },
    enabled: !!projectId,
  })
}

// PATCH /phases/:id - Update phase (for drag-and-drop date changes)
export function useUpdatePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ phaseId, updates }: { phaseId: string; updates: Partial<Phase> }) => {
      const { data } = await api.patch<{ phase: Phase }>(`/phases/${phaseId}`, updates)
      return data.phase
    },
    onSuccess: (_, variables) => {
      // Get the phase to find its project_id
      const phase = variables.updates
      if (phase.project_id) {
        queryClient.invalidateQueries({ queryKey: ['phases', phase.project_id] })
        queryClient.invalidateQueries({ queryKey: ['project', phase.project_id] })
      }
      // Also invalidate all phases queries
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
      toast.success('Phase updated')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to update phase'
      toast.error(errorMessage)
    },
  })
}

// POST /phases - Create new phase
export function useCreatePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (phase: Partial<Phase>) => {
      const { data } = await api.post<{ phase: Phase }>('/phases', phase)
      return data.phase
    },
    onSuccess: (phase) => {
      queryClient.invalidateQueries({ queryKey: ['phases', phase.project_id] })
      queryClient.invalidateQueries({ queryKey: ['project', phase.project_id] })
      toast.success('Phase created')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to create phase'
      toast.error(errorMessage)
    },
  })
}

// DELETE /phases/:id - Delete phase
export function useDeletePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ phaseId, projectId }: { phaseId: string; projectId: string }) => {
      await api.delete(`/phases/${phaseId}`)
      return { phaseId, projectId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phases', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
      toast.success('Phase deleted')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to delete phase'
      toast.error(errorMessage)
    },
  })
}
