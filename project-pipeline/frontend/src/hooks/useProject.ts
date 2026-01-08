// React Query hooks for single project
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { Project } from '../types'

// GET /projects/:id - Get single project with phases
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/projects/${projectId}`)
      return data.project
    },
    enabled: !!projectId,
  })
}

// PATCH /projects/:id - Update project
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      const { data } = await api.patch<{ project: Project }>(`/projects/${projectId}`, updates)
      return data.project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to update project'
      toast.error(errorMessage)
    },
  })
}

// DELETE /projects/:id - Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`)
      return projectId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to delete project'
      toast.error(errorMessage)
    },
  })
}
