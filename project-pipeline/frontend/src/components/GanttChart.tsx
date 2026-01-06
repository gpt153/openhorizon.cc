import { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'
import type { Phase } from '../types'

interface GanttChartProps {
  phases: Phase[]
  viewMode?: 'Day' | 'Week' | 'Month'
  onTaskClick?: (task: Phase) => void
  onDateChange?: (task: Phase, start: Date, end: Date) => void
}

export const GanttChart = ({
  phases,
  viewMode = 'Week',
  onTaskClick,
  onDateChange
}: GanttChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)

  useEffect(() => {
    if (!containerRef.current || phases.length === 0) return

    const tasks = phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      start: new Date(phase.start_date).toISOString().split('T')[0],
      end: new Date(phase.end_date).toISOString().split('T')[0],
      progress: phase.budget_spent > 0
        ? (phase.budget_spent / phase.budget_allocated) * 100
        : 0,
      dependencies: '',
      custom_class: phase.status.toLowerCase(),
    }))

    ganttRef.current = new Gantt(containerRef.current, tasks, {
      view_mode: viewMode,
      on_click: (task: { id?: string }) => {
        if (!task.id) return
        const phase = phases.find((p) => p.id === task.id)
        if (phase && onTaskClick) onTaskClick(phase)
      },
      on_date_change: (task: { id?: string }, start: Date, end: Date) => {
        if (!task.id) return
        const phase = phases.find((p) => p.id === task.id)
        if (phase && onDateChange) onDateChange(phase, start, end)
      },
    })

    return () => {
      ganttRef.current = null
    }
  }, [phases, viewMode, onTaskClick, onDateChange])

  return <div ref={containerRef} className="gantt-container"></div>
}
