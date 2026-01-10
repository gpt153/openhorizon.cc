// Seed Generation page
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { generateSeeds } from '../services/seeds.api'
import SeedGenerationForm from '../components/SeedGenerationForm'
import toast from 'react-hot-toast'
import type { GeneratedSeed } from '../types/seeds'

export default function SeedGeneration() {
  const navigate = useNavigate()
  const [generatedSeeds, setGeneratedSeeds] = useState<GeneratedSeed[]>([])

  const generateMutation = useMutation({
    mutationFn: generateSeeds,
    onSuccess: (data) => {
      setGeneratedSeeds(data.seeds)
      toast.success(`Generated ${data.seeds.length} seeds!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate seeds')
    },
  })

  const handleSubmit = (request: any) => {
    generateMutation.mutate(request)
  }

  const handleViewGarden = () => {
    navigate('/seeds')
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Generate Project Seeds
          </h1>
          <p className="text-gray-600 mt-1">
            Describe your project idea and AI will generate diverse seed
            concepts
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <SeedGenerationForm
            onSubmit={handleSubmit}
            isLoading={generateMutation.isPending}
          />
        </div>

        {/* Results */}
        {generatedSeeds.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Generated Seeds ({generatedSeeds.length})
              </h2>
              <button
                onClick={handleViewGarden}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                View All in Garden →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedSeeds.map((seed, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <div className="space-y-4">
                    {/* Title and Approval */}
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {seed.title}
                      </h3>
                      <span className="text-xl font-bold text-green-600">
                        {Math.round(seed.approvalLikelihood * 100)}%
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600">{seed.description}</p>

                    {/* Tags */}
                    {seed.suggestedTags && seed.suggestedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {seed.suggestedTags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {seed.estimatedDuration && (
                        <span>{seed.estimatedDuration} days</span>
                      )}
                      {seed.estimatedParticipants && (
                        <span>{seed.estimatedParticipants} participants</span>
                      )}
                    </div>

                    {/* Formal Version Toggle */}
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-700">
                        View Formal Version
                      </summary>
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {seed.titleFormal}
                        </h4>
                        <p className="text-gray-600 text-xs">
                          {seed.descriptionFormal}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Approval: {Math.round(seed.approvalLikelihoodFormal * 100)}%
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-6">
              <button
                onClick={() => setGeneratedSeeds([])}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Generate More
              </button>
              <button
                onClick={handleViewGarden}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                View All Seeds
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
