// Edit Project page with pre-populated form
import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useProject } from '../hooks/useProject'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Project, ProjectType, ProjectStatus } from '../types'

export default function ProjectEdit() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: project, isLoading } = useProject(projectId!)

  const [formData, setFormData] = useState({
    name: '',
    type: 'STUDENT_EXCHANGE' as ProjectType,
    status: 'PLANNING' as ProjectStatus,
    description: '',
    start_date: '',
    end_date: '',
    budget_total: '',
    participants_count: '',
    location: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Populate form when project loads
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        type: project.type,
        status: project.status,
        description: project.description || '',
        start_date: project.start_date.split('T')[0],
        end_date: project.end_date.split('T')[0],
        budget_total: project.budget_total.toString(),
        participants_count: project.participants_count.toString(),
        location: project.location,
      })
    }
  }, [project])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        budget_total: parseFloat(data.budget_total),
        participants_count: parseInt(data.participants_count, 10),
        description: data.description || undefined,
      }
      const response = await api.patch<{ project: Project }>(`/projects/${projectId}`, payload)
      return response.data.project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Project updated successfully')
      navigate(`/projects/${projectId}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update project')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete project')
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (!formData.budget_total) {
      newErrors.budget_total = 'Budget is required'
    } else if (parseFloat(formData.budget_total) <= 0) {
      newErrors.budget_total = 'Budget must be greater than 0'
    }

    if (!formData.participants_count) {
      newErrors.participants_count = 'Number of participants is required'
    } else if (parseInt(formData.participants_count, 10) <= 0) {
      newErrors.participants_count = 'Must have at least 1 participant'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate()) {
      updateMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Project not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Project Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="STUDENT_EXCHANGE">Student Exchange</option>
                <option value="TRAINING">Training</option>
                <option value="CONFERENCE">Conference</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.start_date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.end_date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
            </div>
          </div>

          {/* Budget and Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="budget_total" className="block text-sm font-medium text-gray-700">
                Total Budget (€) *
              </label>
              <input
                type="number"
                id="budget_total"
                name="budget_total"
                value={formData.budget_total}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.budget_total
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.budget_total && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_total}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="participants_count"
                className="block text-sm font-medium text-gray-700"
              >
                Number of Participants *
              </label>
              <input
                type="number"
                id="participants_count"
                name="participants_count"
                value={formData.participants_count}
                onChange={handleChange}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.participants_count
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.participants_count && (
                <p className="mt-1 text-sm text-red-600">{errors.participants_count}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.location
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Project
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{project.name}"? This action cannot be undone and
              will also delete all associated phases and data.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
