// Seed Detail page with elaboration
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeed, elaborateSeed, saveSeed, deleteSeed, convertSeedToProject } from '../services/seeds.api'
import SeedElaborationChat from '../components/SeedElaborationChat'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import type {
  ElaborationMessage,
  SeedSuggestion,
  GeneratedSeed,
} from '../types/seeds'

export default function SeedDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'working' | 'formal'>('working')

  // State for chat
  const [suggestions, setSuggestions] = useState<SeedSuggestion[]>([])

  // Fetch seed
  const { data, isLoading, error } = useQuery({
    queryKey: ['seed', id],
    queryFn: () => getSeed(id!),
    enabled: !!id,
  })

  // Elaborate mutation
  const elaborateMutation = useMutation({
    mutationFn: (userMessage: string) =>
      elaborateSeed(id!, { userMessage }),
    onSuccess: (response) => {
      setSuggestions(response.suggestions)
      queryClient.invalidateQueries({ queryKey: ['seed', id] })
    },
    onError: () => {
      toast.error('Failed to elaborate seed')
    },
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => saveSeed(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed', id] })
      toast.success('Seed saved!')
    },
    onError: () => {
      toast.error('Failed to save seed')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteSeed(id!),
    onSuccess: () => {
      toast.success('Seed deleted')
      navigate('/seeds')
    },
    onError: () => {
      toast.error('Failed to delete seed')
    },
  })

  // Convert to project mutation
  const convertMutation = useMutation({
    mutationFn: () => convertSeedToProject(id!),
    onSuccess: (response) => {
      toast.success('Project created successfully!')
      navigate(`/projects/${response.project.id}`)
    },
    onError: () => {
      toast.error('Failed to convert seed to project')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !data?.seed) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Failed to load seed. Please try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { seed } = data

  // Prepare elaboration data
  const elaboration = seed.elaborations?.[0]
  const messages: ElaborationMessage[] =
    (elaboration?.conversation_history as any) || []

  const currentSeed: GeneratedSeed = seed.current_version || {
    title: seed.title,
    description: seed.description,
    approvalLikelihood: seed.approval_likelihood,
    titleFormal: seed.title_formal || seed.title,
    descriptionFormal: seed.description_formal || seed.description,
    approvalLikelihoodFormal:
      seed.approval_likelihood_formal || seed.approval_likelihood,
    suggestedTags: seed.tags,
    estimatedDuration: seed.estimated_duration || undefined,
    estimatedParticipants: seed.estimated_participants || undefined,
  }

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this seed? This action cannot be undone.'
      )
    ) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/seeds')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-1"
          >
            ← Back to Garden
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {view === 'working' ? currentSeed.title : currentSeed.titleFormal}
              </h1>
              <p className="text-gray-600 mt-2">
                {view === 'working'
                  ? currentSeed.description
                  : currentSeed.descriptionFormal}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-3xl font-bold text-green-600">
                {Math.round(
                  (view === 'working'
                    ? currentSeed.approvalLikelihood
                    : currentSeed.approvalLikelihoodFormal) * 100
                )}
                %
              </span>
              <span className="text-xs text-gray-500">approval</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('working')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'working'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Working Mode
            </button>
            <button
              onClick={() => setView('formal')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'formal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Formal Mode
            </button>
          </div>

          {/* Tags and Metadata */}
          <div className="mt-4 space-y-3">
            {currentSeed.suggestedTags &&
              currentSeed.suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentSeed.suggestedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {currentSeed.estimatedDuration && (
                <span>Duration: {currentSeed.estimatedDuration} days</span>
              )}
              {currentSeed.estimatedParticipants && (
                <span>
                  Participants: {currentSeed.estimatedParticipants}
                </span>
              )}
              {seed.elaboration_count > 0 && (
                <span>Elaborations: {seed.elaboration_count}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {convertMutation.isPending ? 'Converting...' : 'Convert to Project'}
            </button>
            {!seed.is_saved && (
              <button
                onClick={() => saveMutation.mutate()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Save Seed
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Elaboration Chat */}
        <div className="h-[600px]">
          <SeedElaborationChat
            messages={messages}
            currentSeed={currentSeed}
            suggestions={suggestions}
            onSendMessage={(message) => elaborateMutation.mutate(message)}
            isLoading={elaborateMutation.isPending}
          />
        </div>
      </div>
    </div>
  )
}
