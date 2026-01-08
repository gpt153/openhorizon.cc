// React Query hooks for projects API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { Project } from '../types'

// GET /projects - List all user projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      return data.projects
    },
  })
}

// POST /projects - Create new project
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data } = await api.post<{ project: Project }>('/projects', project)
      return data.project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Failed to create project'
      toast.error(errorMessage)
    },
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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
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
