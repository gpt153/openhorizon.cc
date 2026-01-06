import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export default function BudgetOverview() {
  const { id } = useParams<{ id: string }>();

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id!),
    enabled: !!id,
  });

  const { isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => apiClient.getBudgetOverview(id!),
    enabled: !!id,
  });

  if (projectLoading || budgetLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading budget overview...</div>
      </div>
    );
  }

  const project = projectData?.project;
  if (!project) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Project not found</h3>
      </div>
    );
  }

  const totalBudget = project.budget_total;
  const totalSpent = project.budget_spent;
  const remaining = totalBudget - totalSpent;
  const percentSpent = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-500">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 h-5 w-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <Link
                to={`/projects/${id}`}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {project.name}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 h-5 w-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-500">
                Budget
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Budget Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Budget Overview
          </h1>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total Budget</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                €{totalBudget.toLocaleString()}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total Spent</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                €{totalSpent.toLocaleString()}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Remaining</dt>
              <dd
                className={`mt-1 text-2xl font-semibold ${
                  remaining < 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                €{remaining.toLocaleString()}
              </dd>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 font-medium">Budget Usage</span>
              <span className="text-gray-900 font-semibold">
                {percentSpent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  percentSpent > 100
                    ? 'bg-red-600'
                    : percentSpent > 90
                    ? 'bg-red-500'
                    : percentSpent > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
          </div>

          {percentSpent > 90 && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Budget Warning
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    You have used over {percentSpent.toFixed(0)}% of your budget. Please
                    review your expenses.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phase Budget Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Budget by Phase
          </h2>

          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-4">
              {project.phases.map((phase) => {
                const phasePercent =
                  (phase.budget_spent / phase.budget_allocated) * 100;
                const phaseRemaining = phase.budget_allocated - phase.budget_spent;

                return (
                  <div key={phase.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{phase.name}</h3>
                        <p className="text-sm text-gray-500">
                          {phase.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          €{phase.budget_spent.toLocaleString()} / €
                          {phase.budget_allocated.toLocaleString()}
                        </p>
                        <p
                          className={`text-xs ${
                            phaseRemaining < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}
                        >
                          {phaseRemaining < 0 ? 'Over by ' : 'Remaining: '}€
                          {Math.abs(phaseRemaining).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              phasePercent > 100
                                ? 'bg-red-600'
                                : phasePercent > 90
                                ? 'bg-red-500'
                                : phasePercent > 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(phasePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        {phasePercent.toFixed(0)}%
                      </span>
                    </div>

                    {/* Quotes for this phase */}
                    {phase.quotes && phase.quotes.length > 0 && (
                      <div className="mt-3 ml-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Quotes ({phase.quotes.length})
                        </h4>
                        <div className="space-y-2">
                          {phase.quotes.map((quote) => (
                            <div
                              key={quote.id}
                              className="flex justify-between items-center text-sm bg-gray-50 rounded p-2"
                            >
                              <div>
                                <span className="font-medium text-gray-900">
                                  {quote.vendor?.name}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    quote.status === 'ACCEPTED'
                                      ? 'bg-green-100 text-green-800'
                                      : quote.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : quote.status === 'REJECTED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {quote.status}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900">
                                {quote.currency} {quote.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No phases created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
