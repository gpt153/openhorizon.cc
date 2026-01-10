// Seed Garden page - List all seeds
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listSeeds, saveSeed, dismissSeed } from '../services/seeds.api'
import SeedCard from '../components/SeedCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function SeedGarden() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'saved'>('all')

  // Fetch seeds
  const { data, isLoading, error } = useQuery({
    queryKey: ['seeds', filter],
    queryFn: () =>
      listSeeds({
        saved: filter === 'saved',
        excludeDismissed: true,
      }),
  })

  // Save seed mutation
  const saveMutation = useMutation({
    mutationFn: saveSeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeds'] })
      toast.success('Seed saved!')
    },
    onError: () => {
      toast.error('Failed to save seed')
    },
  })

  // Dismiss seed mutation
  const dismissMutation = useMutation({
    mutationFn: dismissSeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeds'] })
      toast.success('Seed dismissed')
    },
    onError: () => {
      toast.error('Failed to dismiss seed')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Failed to load seeds. Please try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const seeds = data?.seeds || []

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seed Garden</h1>
              <p className="text-gray-600 mt-1">
                Browse and manage your Erasmus+ project ideas
              </p>
            </div>
            <Link
              to="/seeds/generate"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Generate New Seeds
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Seeds ({seeds.length})
            </button>
            <button
              onClick={() => setFilter('saved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'saved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Saved ({seeds.filter((s) => s.is_saved).length})
            </button>
          </div>
        </div>

        {/* Seeds Grid */}
        {seeds.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No seeds yet
            </h3>
            <p className="text-gray-600 mb-6">
              Generate your first batch of project ideas to get started
            </p>
            <Link
              to="/seeds/generate"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Generate Seeds
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seeds.map((seed) => (
              <SeedCard
                key={seed.id}
                seed={seed}
                onSave={(id) => saveMutation.mutate(id)}
                onDismiss={(id) => dismissMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
