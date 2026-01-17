// Seed Generation page
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { generateSeeds, createSeed } from '../services/seeds.api'
import SeedGenerationForm from '../components/SeedGenerationForm'
import toast from 'react-hot-toast'
import type { GeneratedSeed } from '../types/seeds'

type SeedWithState = GeneratedSeed & {
  tempId: string
  saved?: boolean
  dismissed?: boolean
}

export default function SeedGeneration() {
  const navigate = useNavigate()
  const [generatedSeeds, setGeneratedSeeds] = useState<SeedWithState[]>([])

  const generateMutation = useMutation({
    mutationFn: generateSeeds,
    onSuccess: (data) => {
      // Add temporary IDs to track seeds before they're saved
      const seedsWithIds = data.seeds.map((seed, index) => ({
        ...seed,
        tempId: `temp-${Date.now()}-${index}`,
        saved: false,
        dismissed: false,
      }))
      setGeneratedSeeds(seedsWithIds)
      toast.success(`Generated ${data.seeds.length} seeds!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate seeds')
    },
  })

  const saveMutation = useMutation({
    mutationFn: createSeed,
    onSuccess: () => {
      toast.success('Seed saved to garden!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save seed')
    },
  })

  const handleSubmit = (request: any) => {
    generateMutation.mutate(request)
  }

  const handleSaveSeed = (tempId: string) => {
    const seed = generatedSeeds.find((s) => s.tempId === tempId)
    if (!seed) return

    // Save to backend
    saveMutation.mutate(seed)

    // Mark as saved in UI
    setGeneratedSeeds((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, saved: true } : s))
    )
  }

  const handleDismissSeed = (tempId: string) => {
    // Just mark as dismissed in UI (no backend call needed)
    setGeneratedSeeds((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, dismissed: true } : s))
    )
    toast.success('Seed dismissed')
  }

  const handleViewGarden = () => {
    navigate('/seeds')
  }

  // Filter out dismissed seeds
  const visibleSeeds = generatedSeeds.filter((s) => !s.dismissed)

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
        {visibleSeeds.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Generated Seeds ({visibleSeeds.length})
              </h2>
              <button
                onClick={handleViewGarden}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                View All in Garden →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleSeeds.map((seed) => (
                <div
                  key={seed.tempId}
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

                    {/* Save/Dismiss Actions */}
                    {!seed.saved && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleSaveSeed(seed.tempId)}
                          disabled={saveMutation.isPending}
                          className="flex-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                        >
                          Save to Garden
                        </button>
                        <button
                          onClick={() => handleDismissSeed(seed.tempId)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {seed.saved && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded text-center">
                          ✓ Saved to Garden
                        </div>
                      </div>
                    )}
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
