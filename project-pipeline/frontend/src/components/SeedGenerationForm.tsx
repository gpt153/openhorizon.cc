// Seed generation form component
import { useState } from 'react'
import type { GenerateSeedsRequest } from '../types/seeds'

interface SeedGenerationFormProps {
  onSubmit: (request: GenerateSeedsRequest) => void
  isLoading?: boolean
}

export default function SeedGenerationForm({
  onSubmit,
  isLoading = false,
}: SeedGenerationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [creativityTemp, setCreativityTemp] = useState(0.9)
  const [seedCount, setSeedCount] = useState(10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim().length < 10) {
      alert('Please enter a prompt with at least 10 characters')
      return
    }
    onSubmit({ prompt, creativityTemp, seedCount })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Project Idea Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your Erasmus+ project idea... e.g., 'Youth exchange about climate change and sustainability'"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          disabled={isLoading}
          required
          minLength={10}
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-500">
          {prompt.length}/1000 characters (minimum 10)
        </p>
      </div>

      {/* Creativity Temperature */}
      <div>
        <label
          htmlFor="creativityTemp"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Creativity Level: {creativityTemp.toFixed(1)}
        </label>
        <input
          type="range"
          id="creativityTemp"
          min="0"
          max="1"
          step="0.1"
          value={creativityTemp}
          onChange={(e) => setCreativityTemp(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Safe & Practical</span>
          <span>Balanced</span>
          <span>Bold & Experimental</span>
        </div>
      </div>

      {/* Seed Count */}
      <div>
        <label
          htmlFor="seedCount"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Number of Seeds: {seedCount}
        </label>
        <input
          type="range"
          id="seedCount"
          min="5"
          max="15"
          step="1"
          value={seedCount}
          onChange={(e) => setSeedCount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 seeds</span>
          <span>10 seeds</span>
          <span>15 seeds</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || prompt.trim().length < 10}
        className="w-full px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating Seeds...
          </span>
        ) : (
          'Generate Project Seeds'
        )}
      </button>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          💡 Tips for Great Seeds
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Be specific about themes, activities, or goals</li>
          <li>• Mention target age groups or participant profiles</li>
          <li>• Include keywords like sustainability, inclusion, digital, etc.</li>
          <li>• Higher creativity = more experimental ideas</li>
        </ul>
      </div>
    </form>
  )
}
