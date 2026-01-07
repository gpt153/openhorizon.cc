// Frappe Gantt wrapper component
import { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'
import type { Phase } from '../types'

interface GanttChartProps {
  phases: Phase[]
  onTaskChange: (phaseId: string, startDate: string, endDate: string) => void
  viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
}

export default function GanttChart({ phases, onTaskChange, viewMode = 'Day' }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null)
  const ganttInstance = useRef<any>(null)

  useEffect(() => {
    if (!ganttRef.current || !phases || phases.length === 0) return

    // Convert phases to Gantt tasks
    const tasks = phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      start: new Date(phase.start_date).toISOString().split('T')[0],
      end: new Date(phase.end_date).toISOString().split('T')[0],
      progress: calculateProgress(phase.status),
      dependencies: phase.dependencies.filter(Boolean).join(','),
      custom_class: getPhaseColorClass(phase.type),
    }))

    // Cleanup previous instance
    if (ganttInstance.current) {
      try {
        ganttInstance.current.$destroy?.()
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    try {
      // Create new Gantt instance
      ganttInstance.current = new Gantt(ganttRef.current, tasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: function (task: any) {
          const phase = phases.find((p) => p.id === task.id)
          if (!phase) return ''

          return `
            <div class="gantt-popup">
              <h3>${task.name}</h3>
              <p><strong>Type:</strong> ${phase.type.replace(/_/g, ' ')}</p>
              <p><strong>Status:</strong> ${phase.status.replace(/_/g, ' ')}</p>
              <p><strong>Budget:</strong> €${phase.budget_allocated.toLocaleString()}</p>
              <p><strong>Dates:</strong> ${new Date(phase.start_date).toLocaleDateString()} - ${new Date(phase.end_date).toLocaleDateString()}</p>
            </div>
          `
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          // Call the update callback
          onTaskChange(task.id, start.toISOString(), end.toISOString())
        },
        on_click: (task: any) => {
          console.log('Clicked task:', task)
          // Could open a phase detail modal here in the future
        },
        on_view_change: (mode: string) => {
          console.log('View mode changed to:', mode)
        },
      })
    } catch (error) {
      console.error('Error creating Gantt chart:', error)
    }

    return () => {
      if (ganttInstance.current) {
        try {
          ganttInstance.current.$destroy?.()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [phases, viewMode, onTaskChange])

  if (!phases || phases.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600">No phases to display</p>
        <p className="text-sm text-gray-500 mt-2">Add phases to see them on the timeline</p>
      </div>
    )
  }

  return (
    <div className="gantt-container bg-white p-4 rounded-lg shadow overflow-x-auto">
      <div ref={ganttRef} />
    </div>
  )
}

// Calculate progress percentage based on status
function calculateProgress(status: string): number {
  switch (status) {
    case 'COMPLETED':
      return 100
    case 'IN_PROGRESS':
      return 50
    case 'NOT_STARTED':
      return 0
    case 'SKIPPED':
      return 100
    case 'BLOCKED':
      return 0
    default:
      return 0
  }
}

// Get CSS class for phase type color
function getPhaseColorClass(type: string): string {
  const colorMap: Record<string, string> = {
    ACCOMMODATION: 'bar-blue',
    TRAVEL: 'bar-green',
    FOOD: 'bar-yellow',
    ACTIVITIES: 'bar-purple',
    EVENTS: 'bar-orange',
    INSURANCE: 'bar-red',
    EMERGENCY_PLANNING: 'bar-pink',
    PERMITS: 'bar-cyan',
    APPLICATION: 'bar-indigo',
    REPORTING: 'bar-gray',
    CUSTOM: 'bar-default',
  }
  return colorMap[type] || 'bar-default'
}
