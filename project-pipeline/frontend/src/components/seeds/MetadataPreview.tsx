// Metadata preview component with completeness indicator
import type { SeedMetadata } from '../../types/seeds'

interface MetadataPreviewProps {
  metadata: SeedMetadata | null
  completeness: number
  onConvert?: () => void
  isConvertEnabled: boolean
}

interface FieldConfig {
  key: keyof SeedMetadata
  label: string
  required: boolean
  format?: (value: any) => string
}

export default function MetadataPreview({
  metadata,
  completeness,
  onConvert,
  isConvertEnabled,
}: MetadataPreviewProps) {
  const fields: FieldConfig[] = [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'theme', label: 'Theme', required: true },
    {
      key: 'estimatedDuration',
      label: 'Duration',
      required: true,
      format: (val) => `${val} days`,
    },
    {
      key: 'estimatedParticipants',
      label: 'Participants',
      required: true,
      format: (val) => `${val} people`,
    },
    { key: 'targetAgeGroup', label: 'Age Group', required: false },
    { key: 'geographicScope', label: 'Geographic Scope', required: false },
    { key: 'projectType', label: 'Project Type', required: false },
    { key: 'budgetRange', label: 'Budget Range', required: false },
  ]

  // Circular progress indicator SVG
  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    const getStrokeColor = () => {
      if (value < 50) return '#dc2626' // red-600
      if (value < 80) return '#eab308' // yellow-500
      return '#16a34a' // green-600
    }

    return (
      <div className="relative w-24 h-24 mx-auto">
        <svg className="transform -rotate-90 w-24 h-24">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Metadata Overview
      </h3>

      {/* Circular progress */}
      <CircularProgress value={completeness} />

      {/* Field list */}
      <div className="mt-6 space-y-2">
        {fields.map((field) => {
          const value = metadata?.[field.key]
          const isComplete = value !== null && value !== undefined && value !== ''

          return (
            <div key={field.key} className="flex items-start gap-2">
              <span
                className={`mt-0.5 ${
                  isComplete ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {isComplete ? '✓' : '⚠'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
                {isComplete ? (
                  <p className="text-sm text-gray-600 truncate">
                    {field.format ? field.format(value) : value}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Missing</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Convert button */}
      <button
        onClick={onConvert}
        disabled={!isConvertEnabled}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-medium transition-colors ${
          isConvertEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isConvertEnabled ? (
          <span>✓ Convert to Project</span>
        ) : (
          <span>Complete {80 - completeness}% more to convert</span>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        {isConvertEnabled
          ? 'Your seed is ready to become a project!'
          : 'Answer more questions to unlock conversion'}
      </p>
    </div>
  )
}
