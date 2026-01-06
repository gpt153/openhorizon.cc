import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import GanttTimeline from '../components/GanttTimeline';
import AIChat from '../components/AIChat';
import type { Phase } from '../types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id!),
    enabled: !!id,
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({
      phaseId,
      updates,
    }: {
      phaseId: string;
      updates: Partial<Phase>;
    }) => apiClient.updatePhase(id!, phaseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const handlePhaseUpdate = (
    phaseId: string,
    startDate: string,
    endDate: string
  ) => {
    updatePhaseMutation.mutate({
      phaseId,
      updates: { start_date: startDate, end_date: endDate },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (error || !data?.project) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">
          Error loading project
        </h3>
      </div>
    );
  }

  const project = data.project;
  const selectedPhase = project.phases?.find((p) => p.id === selectedPhaseId);
  const budgetPercentage = (project.budget_spent / project.budget_total) * 100;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link
              to="/dashboard"
              className="text-gray-400 hover:text-gray-500"
            >
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
              <span className="ml-4 text-sm font-medium text-gray-500">
                {project.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Project Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {project.description || 'No description'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                to={`/projects/${id}/budget`}
                className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Budget
              </Link>
              <button
                onClick={() => setShowChat(!showChat)}
                className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              >
                AI Chat
              </button>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  project.status === 'PLANNING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : project.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : project.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Project Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {project.type.replace('_', ' ')}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Participants</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {project.participants_count}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {project.location}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {new Date(project.start_date).toLocaleDateString()} -{' '}
                {new Date(project.end_date).toLocaleDateString()}
              </dd>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 font-medium">Budget</span>
              <span className="text-gray-900 font-semibold">
                €{project.budget_spent.toLocaleString()} / €
                {project.budget_total.toLocaleString()} ({budgetPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  budgetPercentage > 90
                    ? 'bg-red-500'
                    : budgetPercentage > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <TimelineAndPhases
              project={project}
              selectedPhaseId={selectedPhaseId}
              onPhaseClick={setSelectedPhaseId}
              onPhaseUpdate={handlePhaseUpdate}
            />
          </div>
          <div>
            <AIChat projectId={id!} phaseId={selectedPhaseId || undefined} />
          </div>
        </div>
      )}

      {!showChat && (
        <TimelineAndPhases
          project={project}
          selectedPhaseId={selectedPhaseId}
          onPhaseClick={setSelectedPhaseId}
          onPhaseUpdate={handlePhaseUpdate}
        />
      )}

      {/* Phase Detail Modal */}
      {selectedPhase && (
        <PhaseDetailModal
          phase={selectedPhase}
          onClose={() => setSelectedPhaseId(null)}
        />
      )}
    </div>
  );
}

function TimelineAndPhases({
  project,
  selectedPhaseId,
  onPhaseClick,
  onPhaseUpdate,
}: {
  project: any;
  selectedPhaseId: string | null;
  onPhaseClick: (id: string) => void;
  onPhaseUpdate: (id: string, start: string, end: string) => void;
}) {
  return (
    <>
      {/* Timeline */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Project Timeline
        </h2>
        {project.phases && project.phases.length > 0 ? (
          <GanttTimeline
            phases={project.phases}
            onPhaseClick={onPhaseClick}
            onPhaseUpdate={onPhaseUpdate}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No phases yet</p>
          </div>
        )}
      </div>

      {/* Phases List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Phases</h2>
        {project.phases && project.phases.length > 0 ? (
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {project.phases.map((phase: Phase) => (
              <PhaseItem
                key={phase.id}
                phase={phase}
                isSelected={phase.id === selectedPhaseId}
                onClick={() => onPhaseClick(phase.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No phases created yet</p>
          </div>
        )}
      </div>
    </>
  );
}

function PhaseItem({
  phase,
  isSelected,
  onClick,
}: {
  phase: Phase;
  isSelected: boolean;
  onClick: () => void;
}) {
  const budgetPercentage = (phase.budget_spent / phase.budget_allocated) * 100;

  return (
    <div
      onClick={onClick}
      className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-indigo-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">{phase.name}</h3>
            <span
              className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${
                phase.status === 'NOT_STARTED'
                  ? 'bg-gray-100 text-gray-800'
                  : phase.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : phase.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : phase.status === 'SKIPPED'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {phase.status.replace('_', ' ')}
            </span>
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {phase.type.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>
              {new Date(phase.start_date).toLocaleDateString()} -{' '}
              {new Date(phase.end_date).toLocaleDateString()}
            </span>
            <span className="mx-2">•</span>
            <span>
              €{phase.budget_spent.toLocaleString()} / €
              {phase.budget_allocated.toLocaleString()}
            </span>
            <span className="mx-2">•</span>
            <span>{phase._count?.communications || 0} communications</span>
          </div>
          <div className="mt-2 w-64 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                budgetPercentage > 90
                  ? 'bg-red-500'
                  : budgetPercentage > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
        <div className="ml-4">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PhaseDetailModal({
  phase,
  onClose,
}: {
  phase: Phase;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{phase.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Phase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">
                {phase.status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Type</h3>
              <p className="mt-1 text-sm text-gray-900">
                {phase.type.replace('_', ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(phase.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(phase.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget Allocated</h3>
              <p className="mt-1 text-sm text-gray-900">
                €{phase.budget_allocated.toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget Spent</h3>
              <p className="mt-1 text-sm text-gray-900">
                €{phase.budget_spent.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Quotes */}
          {phase.quotes && phase.quotes.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quotes</h3>
              <div className="space-y-3">
                {phase.quotes.map((quote) => (
                  <div key={quote.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {quote.vendor?.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {quote.vendor?.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {quote.currency} {quote.amount.toLocaleString()}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
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
                    </div>
                    {quote.notes && (
                      <p className="mt-2 text-sm text-gray-600">{quote.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {phase.assignments && phase.assignments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Assigned Team Members
              </h3>
              <div className="space-y-2">
                {phase.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                        {assignment.user?.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.user?.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
