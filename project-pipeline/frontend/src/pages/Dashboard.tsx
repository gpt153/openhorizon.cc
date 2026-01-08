// Dashboard page with real project list
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/ProjectCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: projects, isLoading, error } = useProjects()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">Error loading projects</div>
        <p className="text-gray-600 mt-2">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Manage your Erasmus+ project pipeline</p>
        </div>
        <button
          onClick={() => navigate('/projects/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Create Project</span>
        </button>
      </div>

      {/* Empty State or Project Grid */}
      {projects && projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Get started by creating your first Erasmus+ project
          </p>
          <button
            onClick={() => navigate('/projects/create')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>
      ) : (
        <>
          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Stats Footer */}
          {projects && projects.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Total Projects</div>
                  <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">In Progress</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {projects.filter((p) => p.status === 'IN_PROGRESS').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-2xl font-bold text-green-600">
                    {projects.filter((p) => p.status === 'COMPLETED').length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Planning</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {projects.filter((p) => p.status === 'PLANNING').length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
