import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

const statusColors = {
  PLANNING: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const budgetPercent = (project.budget_spent / project.budget_total) * 100

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow hover:shadow-md cursor-pointer transition"
    >
      <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{project.type.replace('_', ' ')}</p>

      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>
        {project.status.replace('_', ' ')}
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div>💰 €{project.budget_total.toLocaleString()} ({budgetPercent.toFixed(0)}% spent)</div>
        <div>👥 {project.participants_count} students</div>
        <div>📅 {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</div>
      </div>

      <div className="mt-4">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View →
        </button>
      </div>
    </div>
  )
}
