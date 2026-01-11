// Seeds API service
import { api } from './api'
import type {
  GenerateSeedsRequest,
  GenerateSeedsResponse,
  ListSeedsResponse,
  GetSeedResponse,
  ElaborateSeedRequest,
  ElaborationResponse,
  ConvertSeedToProjectResponse,
} from '../types/seeds'

/**
 * Generate new seeds from a prompt
 */
export async function generateSeeds(
  request: GenerateSeedsRequest
): Promise<GenerateSeedsResponse> {
  const response = await api.post<GenerateSeedsResponse>(
    '/seeds/generate',
    request
  )
  return response.data
}

/**
 * List all seeds for the current user
 */
export async function listSeeds(options?: {
  saved?: boolean
  excludeDismissed?: boolean
}): Promise<ListSeedsResponse> {
  const params = new URLSearchParams()
  if (options?.saved) params.append('saved', 'true')
  if (options?.excludeDismissed === false)
    params.append('excludeDismissed', 'false')

  const response = await api.get<ListSeedsResponse>(
    `/seeds?${params.toString()}`
  )
  return response.data
}

/**
 * Get a single seed by ID
 */
export async function getSeed(seedId: string): Promise<GetSeedResponse> {
  const response = await api.get<GetSeedResponse>(`/seeds/${seedId}`)
  return response.data
}

/**
 * Elaborate on a seed through conversation
 */
export async function elaborateSeed(
  seedId: string,
  request: ElaborateSeedRequest
): Promise<ElaborationResponse> {
  const response = await api.post<ElaborationResponse>(
    `/seeds/${seedId}/elaborate`,
    request
  )
  return response.data
}

/**
 * Save a seed
 */
export async function saveSeed(seedId: string): Promise<{ success: boolean }> {
  const response = await api.patch<{ success: boolean }>(
    `/seeds/${seedId}/save`
  )
  return response.data
}

/**
 * Dismiss a seed
 */
export async function dismissSeed(
  seedId: string
): Promise<{ success: boolean }> {
  const response = await api.patch<{ success: boolean }>(
    `/seeds/${seedId}/dismiss`
  )
  return response.data
}

/**
 * Delete a seed
 */
export async function deleteSeed(seedId: string): Promise<void> {
  await api.delete(`/seeds/${seedId}`)
}

/**
 * Convert a seed to a project
 */
export async function convertSeedToProject(
  seedId: string
): Promise<ConvertSeedToProjectResponse> {
  const response = await api.post<ConvertSeedToProjectResponse>(
    `/seeds/${seedId}/convert`
  )
  return response.data
}
