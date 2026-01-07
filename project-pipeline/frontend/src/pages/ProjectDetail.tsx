// Project Detail page with Gantt timeline
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useProject } from '../hooks/useProject'
import { usePhases, useUpdatePhase } from '../hooks/usePhases'
import GanttChart from '../components/GanttChart'
import LoadingSpinner from '../components/LoadingSpinner'

type ViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('Day')

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId!)
  const { data: phases, isLoading: phasesLoading } = usePhases(projectId!)
  const updatePhase = useUpdatePhase()

  const isLoading = projectLoading || phasesLoading

  const handleTaskChange = (phaseId: string, startDate: string, endDate: string) => {
    updatePhase.mutate({
      phaseId,
      updates: {
        start_date: startDate,
        end_date: endDate,
        project_id: projectId!,
      },
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (projectError || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load project</p>
          <p className="text-sm text-red-600 mt-2">
            {(projectError as Error)?.message || 'Project not found'}
          </p>
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

  const budgetPercent = project.budget_total > 0
    ? (project.budget_spent / project.budget_total) * 100
    : 0

  const budgetRemaining = project.budget_total - project.budget_spent

  const statusColor = {
    PLANNING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }[project.status] || 'bg-gray-100 text-gray-800'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
              Dashboard
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{project.name}</li>
        </ol>
      </nav>

      {/* Project Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {project.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-600">
                {project.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Back
          </button>
        </div>

        {/* Project Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Budget Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Budget</span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              €{project.budget_spent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              of €{project.budget_total.toLocaleString()}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  budgetPercent > 90
                    ? 'bg-red-500'
                    : budgetPercent > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              €{budgetRemaining.toLocaleString()} remaining
            </div>
          </div>

          {/* Phases Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Phases</span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {phases?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">total phases</div>
          </div>

          {/* Participants Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Participants</span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {project.participants_count}
            </div>
            <div className="text-sm text-gray-600 mt-1">participants</div>
          </div>

          {/* Location Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Location</span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="text-lg font-bold text-gray-900">{project.location}</div>
            <div className="text-sm text-gray-600 mt-1">
              {format(new Date(project.start_date), 'MMM d')} - {format(new Date(project.end_date), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector and Create Phase */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
            <button
              onClick={() => navigate(`/projects/${projectId}/phases/create`)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Phase
            </button>
          </div>
          <div className="flex gap-2">
            {(['Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <GanttChart
        phases={phases || []}
        onTaskChange={handleTaskChange}
        viewMode={viewMode}
      />

      {/* Phase List */}
      {phases && phases.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phase Details</h2>
          <div className="space-y-4">
            {phases.map((phase) => {
              const phaseStatusColor = {
                NOT_STARTED: 'bg-gray-100 text-gray-800',
                IN_PROGRESS: 'bg-blue-100 text-blue-800',
                COMPLETED: 'bg-green-100 text-green-800',
                BLOCKED: 'bg-red-100 text-red-800',
                SKIPPED: 'bg-yellow-100 text-yellow-800',
              }[phase.status] || 'bg-gray-100 text-gray-800'

              return (
                <div
                  key={phase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseStatusColor}`}>
                          {phase.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>{' '}
                          <span className="text-gray-900">{phase.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Budget:</span>{' '}
                          <span className="text-gray-900">€{phase.budget_allocated.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Start:</span>{' '}
                          <span className="text-gray-900">{format(new Date(phase.start_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">End:</span>{' '}
                          <span className="text-gray-900">{format(new Date(phase.end_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
