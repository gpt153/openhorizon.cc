// Seed card component for displaying a single seed
import { Link } from 'react-router-dom'
import type { Seed } from '../types/seeds'

interface SeedCardProps {
  seed: Seed
  onSave?: (id: string) => void
  onDismiss?: (id: string) => void
  showActions?: boolean
}

export default function SeedCard({
  seed,
  onSave,
  onDismiss,
  showActions = true,
}: SeedCardProps) {
  // Approval likelihood color
  const getApprovalColor = (likelihood: number) => {
    if (likelihood >= 0.8) return 'text-green-600'
    if (likelihood >= 0.6) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Format approval percentage
  const formatApproval = (likelihood: number) => {
    return `${Math.round(likelihood * 100)}%`
  }

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 border border-gray-200"
      data-testid="seed-card"
    >
      <div className="space-y-4">
        {/* Title and Approval */}
        <div className="flex justify-between items-start gap-4">
          <Link
            to={`/seeds/${seed.id}`}
            className="flex-1 hover:text-blue-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {seed.title}
            </h3>
          </Link>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-2xl font-bold ${getApprovalColor(
                seed.approval_likelihood
              )}`}
            >
              {formatApproval(seed.approval_likelihood)}
            </span>
            <span className="text-xs text-gray-500">approval</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3">
          {seed.description}
        </p>

        {/* Tags */}
        {seed.tags && seed.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {seed.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
              >
                {tag}
              </span>
            ))}
            {seed.tags.length > 4 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{seed.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {seed.estimated_duration && (
            <span>{seed.estimated_duration} days</span>
          )}
          {seed.estimated_participants && (
            <span>{seed.estimated_participants} participants</span>
          )}
          {seed.elaboration_count > 0 && (
            <span>{seed.elaboration_count} elaborations</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Link
              to={`/seeds/${seed.id}`}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors text-center"
            >
              View Details
            </Link>
            {!seed.is_saved && onSave && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onSave(seed.id)
                }}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
              >
                Save
              </button>
            )}
            {!seed.is_dismissed && onDismiss && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onDismiss(seed.id)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
