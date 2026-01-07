// Create Phase page with date validation
import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useProject } from '../hooks/useProject'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Phase, PhaseType, PhaseStatus } from '../types'

export default function PhaseCreate() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: project, isLoading: projectLoading } = useProject(projectId!)

  const [formData, setFormData] = useState({
    name: '',
    type: 'ACCOMMODATION' as PhaseType,
    status: 'NOT_STARTED' as PhaseStatus,
    start_date: '',
    end_date: '',
    deadline: '',
    budget_allocated: '',
    order: '1',
    editable: true,
    skippable: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        project_id: projectId!,
        name: data.name,
        type: data.type,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        deadline: data.deadline || undefined,
        budget_allocated: parseFloat(data.budget_allocated),
        order: parseInt(data.order, 10),
        dependencies: [],
        editable: data.editable,
        skippable: data.skippable,
      }
      const response = await api.post<{ phase: Phase }>('/phases', payload)
      return response.data.phase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Phase created successfully')
      navigate(`/projects/${projectId}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create phase')
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Phase name is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    // Validate dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)

      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date'
      }

      // Validate against project dates if available
      if (project) {
        const projectStart = new Date(project.start_date)
        const projectEnd = new Date(project.end_date)

        if (startDate < projectStart) {
          newErrors.start_date = 'Phase start date cannot be before project start date'
        }

        if (endDate > projectEnd) {
          newErrors.end_date = 'Phase end date cannot be after project end date'
        }
      }
    }

    // Validate deadline
    if (formData.deadline) {
      const deadline = new Date(formData.deadline)
      const endDate = new Date(formData.end_date)

      if (formData.end_date && deadline < endDate) {
        newErrors.deadline = 'Deadline should typically be on or after end date'
      }
    }

    if (!formData.budget_allocated) {
      newErrors.budget_allocated = 'Budget is required'
    } else if (parseFloat(formData.budget_allocated) <= 0) {
      newErrors.budget_allocated = 'Budget must be greater than 0'
    }

    if (!formData.order) {
      newErrors.order = 'Order is required'
    } else if (parseInt(formData.order, 10) < 1) {
      newErrors.order = 'Order must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate()) {
      createMutation.mutate(formData)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (projectLoading) {
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Phase</h1>
            <p className="text-sm text-gray-600 mt-1">for {project.name}</p>
          </div>
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
              Phase Name *
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
              placeholder="Accommodation Booking"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Phase Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food</option>
                <option value="ACTIVITIES">Activities</option>
                <option value="EVENTS">Events</option>
                <option value="INSURANCE">Insurance</option>
                <option value="EMERGENCY_PLANNING">Emergency Planning</option>
                <option value="PERMITS">Permits</option>
                <option value="APPLICATION">Application</option>
                <option value="REPORTING">Reporting</option>
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
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                min={project.start_date.split('T')[0]}
                max={project.end_date.split('T')[0]}
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
                min={project.start_date.split('T')[0]}
                max={project.end_date.split('T')[0]}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.end_date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline (Optional)
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.deadline
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
            </div>
          </div>

          {/* Budget and Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="budget_allocated" className="block text-sm font-medium text-gray-700">
                Budget Allocated (€) *
              </label>
              <input
                type="number"
                id="budget_allocated"
                name="budget_allocated"
                value={formData.budget_allocated}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.budget_allocated
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="5000"
              />
              {errors.budget_allocated && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_allocated}</p>
              )}
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                Order/Sequence *
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.order
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="1"
              />
              {errors.order && <p className="mt-1 text-sm text-red-600">{errors.order}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Order in which this phase should be executed
              </p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="editable"
                  name="editable"
                  type="checkbox"
                  checked={formData.editable}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="editable" className="font-medium text-gray-700">
                  Editable
                </label>
                <p className="text-gray-500">Allow editing this phase after creation</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="skippable"
                  name="skippable"
                  type="checkbox"
                  checked={formData.skippable}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="skippable" className="font-medium text-gray-700">
                  Skippable
                </label>
                <p className="text-gray-500">This phase can be skipped if needed</p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Phase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
