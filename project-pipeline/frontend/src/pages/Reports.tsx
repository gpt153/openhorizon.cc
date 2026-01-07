// Reports page with multiple export options
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useBudgetSummary, useProjectBudgets } from '../hooks/useBudget'
import {
  exportProjectsCSV,
  exportPhasesCSV,
  exportProjectBudgetsCSV,
  exportBudgetSummaryCSV,
} from '../utils/exportCSV'
import type { Project, Phase } from '../types'

type ReportType = 'projects' | 'phases' | 'budget' | 'budget-summary'

export default function Reports() {
  const navigate = useNavigate()
  const [selectedReport, setSelectedReport] = useState<ReportType>('projects')
  const [selectedProject, setSelectedProject] = useState<string>('')

  // Fetch data
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      return data.projects
    },
  })

  const { data: phasesData } = useQuery({
    queryKey: ['phases', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return []
      const { data } = await api.get<{ phases: Phase[] }>(`/projects/${selectedProject}/phases`)
      return data.phases
    },
    enabled: selectedReport === 'phases' && !!selectedProject,
  })

  const { data: budgetSummary } = useBudgetSummary()
  const { data: projectBudgets } = useProjectBudgets()

  const handleExport = () => {
    try {
      switch (selectedReport) {
        case 'projects':
          if (!projectsData || projectsData.length === 0) {
            toast.error('No projects available to export')
            return
          }
          exportProjectsCSV(projectsData)
          toast.success('Projects exported successfully')
          break

        case 'phases':
          if (!selectedProject) {
            toast.error('Please select a project first')
            return
          }
          if (!phasesData || phasesData.length === 0) {
            toast.error('No phases available for this project')
            return
          }
          const project = projectsData?.find((p) => p.id === selectedProject)
          exportPhasesCSV(phasesData, project?.name)
          toast.success('Phases exported successfully')
          break

        case 'budget':
          if (!projectBudgets || projectBudgets.length === 0) {
            toast.error('No budget data available to export')
            return
          }
          exportProjectBudgetsCSV(projectBudgets)
          toast.success('Budget report exported successfully')
          break

        case 'budget-summary':
          if (!budgetSummary || !projectBudgets) {
            toast.error('Budget data not loaded')
            return
          }
          exportBudgetSummaryCSV(
            projectBudgets,
            budgetSummary.totalBudget,
            budgetSummary.totalSpent,
            budgetSummary.totalRemaining
          )
          toast.success('Budget summary exported successfully')
          break

        default:
          toast.error('Invalid report type selected')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  const reportOptions = [
    {
      id: 'projects' as ReportType,
      name: 'Projects Report',
      description: 'Export all projects with budget, status, and timeline information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: 'phases' as ReportType,
      name: 'Phase Report',
      description: 'Export phases for a specific project with budget and timeline details',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      requiresProject: true,
    },
    {
      id: 'budget' as ReportType,
      name: 'Budget Report',
      description: 'Export detailed budget breakdown for all projects with health status',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'budget-summary' as ReportType,
      name: 'Budget Summary',
      description: 'Export comprehensive budget summary with totals and project breakdown',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ]

  const selectedReportOption = reportOptions.find((opt) => opt.id === selectedReport)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export reports in CSV format
          </p>
        </div>
        <button
          onClick={() => navigate('/budget')}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Back to Budget
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedReport(option.id)
                if (!option.requiresProject) {
                  setSelectedProject('')
                }
              }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedReport === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedReport === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{option.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>

        {/* Project Selection (for phase reports) */}
        {selectedReportOption?.requiresProject && (
          <div className="mb-6">
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project <span className="text-red-500">*</span>
            </label>
            <select
              id="project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a project --</option>
              {projectsData?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Report Preview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Report Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Report Type:</dt>
              <dd className="font-medium text-gray-900">{selectedReportOption?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Format:</dt>
              <dd className="font-medium text-gray-900">CSV</dd>
            </div>
            {selectedReport === 'projects' && projectsData && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Records:</dt>
                <dd className="font-medium text-gray-900">{projectsData.length} projects</dd>
              </div>
            )}
            {selectedReport === 'phases' && phasesData && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Records:</dt>
                <dd className="font-medium text-gray-900">{phasesData.length} phases</dd>
              </div>
            )}
            {selectedReport === 'budget' && projectBudgets && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Records:</dt>
                <dd className="font-medium text-gray-900">{projectBudgets.length} projects</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">Filename:</dt>
              <dd className="font-mono text-xs text-gray-700">
                {selectedReport}-export-{new Date().toISOString().split('T')[0]}.csv
              </dd>
            </div>
          </dl>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={selectedReportOption?.requiresProject && !selectedProject}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export Report
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">About CSV Exports</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All reports are exported in CSV format for easy analysis in Excel or Google Sheets</li>
              <li>• Reports include current data from the database at the time of export</li>
              <li>• Budget reports include health status indicators (On Track, Warning, Critical, Over Budget)</li>
              <li>• Phase reports require project selection to filter relevant data</li>
              <li>• Filenames include the current date for easy tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
