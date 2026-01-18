'use client'

import { trpc } from '@/lib/trpc/client'

/**
 * Status of a search job
 * Normalized to lowercase for consistent frontend usage
 */
export type SearchJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Result returned by the useSearchJob hook
 *
 * @template T - Type of the results (e.g., FoodOption[], AccommodationOption[])
 */
export interface SearchJobResult<T = unknown> {
  /** Current status of the search job */
  status: SearchJobStatus
  /** Search results (only available when status is 'completed') */
  results: T | null
  /** Error message (only available when status is 'failed') */
  error: string | null
  /** Whether the query is currently loading */
  isLoading: boolean
  /** Function to manually refetch the job status */
  refetch: () => void
}

/**
 * React Query hook for polling search job status
 *
 * Automatically polls the backend every 2 seconds while the job is in
 * PENDING or PROCESSING state. Stops polling when COMPLETED or FAILED.
 *
 * This hook is part of Epic 001: Fix API Timeout Issues.
 * It enables asynchronous search operations by polling job status instead
 * of waiting for long-running searches to complete synchronously.
 *
 * @param jobId - The search job ID to poll. If null, the hook is disabled.
 * @returns Search job status, results, error, loading state, and refetch function
 *
 * @example
 * Basic usage with typed results:
 * ```tsx
 * const [jobId, setJobId] = useState<string | null>(null)
 * const { status, results, error, isLoading } = useSearchJob<FoodOption[]>(jobId)
 *
 * if (status === 'processing') return <LoadingSpinner />
 * if (status === 'failed') return <ErrorMessage error={error} />
 * if (status === 'completed') return <SearchResults results={results} />
 * ```
 *
 * @example
 * Complete workflow with job submission:
 * ```tsx
 * const [jobId, setJobId] = useState<string | null>(null)
 * const { status, results, error } = useSearchJob<FoodOption[]>(jobId)
 *
 * const submitSearch = trpc.pipeline.searchJobs.submitFoodSearch.useMutation({
 *   onSuccess: (data) => setJobId(data.jobId)
 * })
 *
 * const handleSearch = () => {
 *   submitSearch.mutate({ projectId, destination, dates, participantCount })
 * }
 * ```
 */
export function useSearchJob<T = unknown>(
  jobId: string | null
): SearchJobResult<T> {
  // Use tRPC's useQuery with conditional polling
  // The query is only enabled when jobId is not null
  const query = trpc.pipeline.searchJobs.getJobStatus.useQuery(
    { jobId: jobId! }, // Non-null assertion is safe because enabled guards it
    {
      // Only run query if jobId exists
      enabled: !!jobId,

      // Polling configuration
      // Returns polling interval in milliseconds, or false to stop polling
      refetchInterval: (query) => {
        // If no data yet, poll immediately
        if (!query.state.data) return 2000

        const status = query.state.data.status

        // Poll every 2 seconds while job is in progress
        if (status === 'PENDING' || status === 'PROCESSING') {
          return 2000 // 2 seconds in milliseconds
        }

        // Stop polling when job is complete or failed
        return false
      },

      // Always treat data as stale to enable refetching
      // This ensures each poll fetches fresh data from the backend
      staleTime: 0,
    }
  )

  // Transform status to lowercase for consistent frontend usage
  // Backend returns UPPERCASE status (PENDING, PROCESSING, etc.)
  const normalizedStatus = query.data?.status.toLowerCase() as
    | SearchJobStatus
    | undefined

  // Return formatted result
  return {
    // Default to 'pending' if no status available yet
    status: normalizedStatus ?? 'pending',

    // Cast results to expected type T (e.g., FoodOption[])
    // Results are only present when status is COMPLETED
    results: (query.data?.results as T | null) ?? null,

    // Error message is only present when status is FAILED
    error: query.data?.error ?? null,

    // React Query's loading state
    isLoading: query.isLoading,

    // Allow manual refetch
    refetch: query.refetch,
  }
}
