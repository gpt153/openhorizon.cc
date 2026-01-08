// Project card component for dashboard
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Status badge colors
  const statusColors = {
    PLANNING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  // Calculate budget percentage
  const budgetPercent = project.budget_total > 0
    ? (project.budget_spent / project.budget_total) * 100
    : 0

  // Budget health color
  const budgetHealthColor =
    budgetPercent > 90
      ? 'bg-red-500'
      : budgetPercent > 75
      ? 'bg-yellow-500'
      : 'bg-green-500'

  return (
    <Link
      to={`/projects/${project.id}`}
      data-testid="project-card"
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6"
    >
      <div className="space-y-4">
        {/* Header - Title and Status */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {project.type.replace(/_/g, ' ')}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-3 ${
              statusColors[project.status]
            }`}
          >
            {project.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
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
              <span>{project._count?.phases || 0} phases</span>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
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
              <span>{project.participants_count} participants</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">{project.location}</div>
        </div>

        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Budget</span>
            <span className="font-medium text-gray-900">
              €{project.budget_spent.toLocaleString()} / €
              {project.budget_total.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${budgetHealthColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{budgetPercent.toFixed(1)}% used</span>
            <span>
              €{(project.budget_total - project.budget_spent).toLocaleString()} remaining
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center text-sm text-gray-500 pt-2 border-t border-gray-100">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {format(new Date(project.start_date), 'MMM d, yyyy')} -{' '}
            {format(new Date(project.end_date), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </Link>
  )
}
