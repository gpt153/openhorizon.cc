// Progress indicator component for seed elaboration
interface ProgressIndicatorProps {
  completeness: number // 0-100
}

export default function ProgressIndicator({ completeness }: ProgressIndicatorProps) {
  const getColor = () => {
    if (completeness < 50) return 'bg-red-600'
    if (completeness < 80) return 'bg-yellow-500'
    return 'bg-green-600'
  }

  const getMessage = () => {
    if (completeness < 30) return "Let's get started!"
    if (completeness < 60) return "You're making progress!"
    if (completeness < 80) return "Almost there!"
    return "Great work! Ready to convert!"
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Elaboration Progress
        </span>
        <span className="text-lg font-bold text-gray-900">
          {completeness}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      <p className="text-xs text-gray-600 mt-2 text-center">
        {getMessage()}
      </p>
    </div>
  )
}
