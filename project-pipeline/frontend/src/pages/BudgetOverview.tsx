// Budget overview dashboard with comprehensive budget visualization
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBudgetSummary, useProjectBudgets } from '../hooks/useBudget'
import BudgetIndicator from '../components/BudgetIndicator'

export default function BudgetOverview() {
  const navigate = useNavigate()
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary()
  const { data: projectBudgets, isLoading: projectsLoading } = useProjectBudgets()

  const isLoading = summaryLoading || projectsLoading

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (!summary || !projectBudgets) return null

    const onTrackCount = projectBudgets.filter(
      (pb) => pb.percentage_spent < 75 && !pb.is_over_budget
    ).length
    const warningCount = projectBudgets.filter(
      (pb) => pb.percentage_spent >= 75 && pb.percentage_spent < 90 && !pb.is_over_budget
    ).length
    const criticalCount = projectBudgets.filter(
      (pb) => pb.percentage_spent >= 90 && !pb.is_over_budget
    ).length

    const averageSpending =
      projectBudgets.length > 0
        ? projectBudgets.reduce((sum, pb) => sum + pb.percentage_spent, 0) / projectBudgets.length
        : 0

    return {
      onTrackCount,
      warningCount,
      criticalCount,
      averageSpending,
    }
  }, [summary, projectBudgets])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget data...</p>
        </div>
      </div>
    )
  }

  if (!summary || !projectBudgets || !metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No budget data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track budget allocation and spending across all projects
          </p>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Reports
        </button>
      </div>

      {/* Overall Budget Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Budget</h2>
        <BudgetIndicator
          allocated={summary.totalBudget}
          spent={summary.totalSpent}
          size="lg"
          showDetails={true}
        />
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalBudget)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-8 h-8 text-blue-600"
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
          </div>
          <p className="mt-2 text-sm text-gray-500">{summary.projectCount} active projects</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {summary.percentageSpent.toFixed(1)}% of total budget
          </p>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-8 h-8 text-green-600"
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
          </div>
          <p className="mt-2 text-sm text-gray-500">Available for allocation</p>
        </div>

        {/* Projects Over Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Over Budget</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{summary.overBudgetCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">Projects requiring attention</p>
        </div>
      </div>

      {/* Budget Health Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Budget Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-3xl font-bold text-green-700">{metrics.onTrackCount}</p>
            <p className="text-sm text-green-600 mt-1">On Track</p>
            <p className="text-xs text-gray-500 mt-1">&lt; 75% spent</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <p className="text-3xl font-bold text-yellow-700">{metrics.warningCount}</p>
            <p className="text-sm text-yellow-600 mt-1">Warning</p>
            <p className="text-xs text-gray-500 mt-1">75-90% spent</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <p className="text-3xl font-bold text-orange-700">{metrics.criticalCount}</p>
            <p className="text-sm text-orange-600 mt-1">Critical</p>
            <p className="text-xs text-gray-500 mt-1">&gt; 90% spent</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="text-3xl font-bold text-red-700">{summary.overBudgetCount}</p>
            <p className="text-sm text-red-600 mt-1">Over Budget</p>
            <p className="text-xs text-gray-500 mt-1">Exceeded allocation</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Average spending across all projects:{' '}
            <span className="font-semibold text-gray-900">
              {metrics.averageSpending.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>

      {/* Project Budget Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Budget Breakdown</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sorted by spending percentage (highest first)
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {projectBudgets.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No projects found</div>
          ) : (
            projectBudgets.map((projectBudget) => (
              <div
                key={projectBudget.project.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/projects/${projectBudget.project.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {projectBudget.project.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {projectBudget.project.type}
                      </span>
                      <span>{projectBudget.phase_count} phases</span>
                      <span>
                        {new Date(projectBudget.project.start_date).toLocaleDateString()} -{' '}
                        {new Date(projectBudget.project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {projectBudget.is_over_budget && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Over Budget
                    </span>
                  )}
                </div>
                <BudgetIndicator
                  allocated={projectBudget.budget_allocated}
                  spent={projectBudget.budget_spent}
                  size="md"
                  showDetails={true}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
