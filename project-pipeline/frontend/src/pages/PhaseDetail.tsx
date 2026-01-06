import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import type { Phase } from '../types'
import { ChatBox } from '../components/ChatBox'
import { BudgetIndicator } from '../components/BudgetIndicator'

export const PhaseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: phase, isLoading } = useQuery({
    queryKey: ['phase', id],
    queryFn: async () => {
      const response = await api.get<{ phase: Phase }>(`/phases/${id}`)
      return response.data.phase
    },
  })

  if (isLoading) return <div>Loading phase...</div>
  if (!phase) return <div>Phase not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-blue-600">← Back</button>
            <h1 className="text-xl font-semibold">{phase.name}</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Phase Info</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Budget</div>
                <div className="font-medium">€{phase.budget_allocated.toLocaleString()}</div>
                <BudgetIndicator allocated={phase.budget_allocated} spent={phase.budget_spent} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Dates</div>
                <div className="text-sm">
                  {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-sm">{phase.status.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ChatBox phaseId={phase.id} projectId={phase.project_id} />
        </div>
      </div>
    </div>
  )
}
