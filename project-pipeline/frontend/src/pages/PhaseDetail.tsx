// Phase Detail page with budget and quotes
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { Phase, Quote } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

export default function PhaseDetail() {
  const { phaseId } = useParams<{ phaseId: string }>()
  const navigate = useNavigate()

  const { data: phase, isLoading, error } = useQuery({
    queryKey: ['phase', phaseId],
    queryFn: async () => {
      const { data } = await api.get<{ phase: Phase }>(`/phases/${phaseId}`)
      return data.phase
    },
    enabled: !!phaseId,
  })

  const { data: quotes } = useQuery({
    queryKey: ['quotes', phaseId],
    queryFn: async () => {
      const { data } = await api.get<{ quotes: Quote[] }>(`/phases/${phaseId}/quotes`)
      return data.quotes
    },
    enabled: !!phaseId,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !phase) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load phase</p>
          <p className="text-sm text-red-600 mt-2">
            {(error as Error)?.message || 'Phase not found'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const budgetPercent = phase.budget_allocated > 0
    ? (phase.budget_spent / phase.budget_allocated) * 100
    : 0

  const budgetRemaining = phase.budget_allocated - phase.budget_spent

  const statusColor = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-yellow-100 text-yellow-800',
  }[phase.status] || 'bg-gray-100 text-gray-800'

  const quoteStatusColor = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  }

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
          {phase.project && (
            <>
              <li>
                <Link
                  to={`/projects/${phase.project_id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {phase.project.name}
                </Link>
              </li>
              <li className="text-gray-400">/</li>
            </>
          )}
          <li className="text-gray-600">{phase.name}</li>
        </ol>
      </nav>

      {/* Phase Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{phase.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {phase.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-600">
                {phase.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/phases/${phaseId}/edit`)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Edit Phase
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Back
            </button>
          </div>
        </div>

        {/* Phase Info Grid */}
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
              €{phase.budget_spent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              of €{phase.budget_allocated.toLocaleString()}
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

          {/* Dates Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Timeline</span>
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-900">
              <div className="mb-1">
                <span className="text-gray-600">Start:</span>{' '}
                {format(new Date(phase.start_date), 'MMM d, yyyy')}
              </div>
              <div>
                <span className="text-gray-600">End:</span>{' '}
                {format(new Date(phase.end_date), 'MMM d, yyyy')}
              </div>
              {phase.deadline && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-600">Deadline:</span>{' '}
                  {format(new Date(phase.deadline), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>

          {/* Order Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Order</span>
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
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">#{phase.order}</div>
            <div className="text-sm text-gray-600 mt-1">in sequence</div>
          </div>

          {/* Properties Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Properties</span>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-900 space-y-1">
              <div className="flex items-center gap-2">
                {phase.editable ? (
                  <span className="text-green-600">✓ Editable</span>
                ) : (
                  <span className="text-gray-400">✗ Locked</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {phase.skippable ? (
                  <span className="text-green-600">✓ Skippable</span>
                ) : (
                  <span className="text-gray-400">✗ Required</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
          >
            Add Quote (Phase 6)
          </button>
        </div>

        {quotes && quotes.length > 0 ? (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {quote.vendor?.name || 'Unknown Vendor'}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quoteStatusColor[quote.status]
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>{' '}
                        <span className="text-gray-900 font-medium">
                          {quote.currency} {quote.amount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Received:</span>{' '}
                        <span className="text-gray-900">
                          {format(new Date(quote.received_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {quote.valid_until && (
                        <div>
                          <span className="text-gray-600">Valid Until:</span>{' '}
                          <span className="text-gray-900">
                            {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {quote.vendor && (
                        <div>
                          <span className="text-gray-600">Type:</span>{' '}
                          <span className="text-gray-900">
                            {quote.vendor.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    {quote.notes && (
                      <p className="text-sm text-gray-600 mt-2">{quote.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">No quotes yet for this phase</p>
          </div>
        )}
      </div>
    </div>
  )
}
