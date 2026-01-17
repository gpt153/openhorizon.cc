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
  QuickReply,
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
 * Create and save a generated seed to database
 */
export async function createSeed(
  seed: any
): Promise<{ seed: any }> {
  const response = await api.post<{ seed: any }>(
    '/seeds/create',
    seed
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

// ============================================================================
// Utility Functions for Conversational Elaboration
// ============================================================================

/**
 * Generate a unique ID for messages
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate quick reply buttons based on AI question content
 */
export function generateQuickReplies(question: string): QuickReply[] {
  const lowerQuestion = question.toLowerCase()

  // Pattern: Participants count
  if (
    lowerQuestion.includes('participants') ||
    lowerQuestion.includes('how many people')
  ) {
    return [
      { id: '1', text: '16-20', value: '16-20 participants' },
      { id: '2', text: '21-30', value: '21-30 participants' },
      { id: '3', text: '31-40', value: '31-40 participants' },
      { id: '4', text: 'Custom', value: '' },
    ]
  }

  // Pattern: Duration
  if (lowerQuestion.includes('duration') || lowerQuestion.includes('how long')) {
    return [
      { id: '1', text: '1 week', value: '1 week (7 days)' },
      { id: '2', text: '2 weeks', value: '2 weeks (14 days)' },
      { id: '3', text: '1 month', value: '1 month (30 days)' },
      { id: '4', text: 'Custom', value: '' },
    ]
  }

  // Pattern: Age group
  if (lowerQuestion.includes('age') || lowerQuestion.includes('target group')) {
    return [
      { id: '1', text: 'Youth (13-17)', value: 'Youth aged 13-17' },
      { id: '2', text: 'Young Adults (18-25)', value: 'Young adults aged 18-25' },
      { id: '3', text: 'Adults (26-60)', value: 'Adults aged 26-60' },
      { id: '4', text: 'Mixed Ages', value: 'Mixed age groups' },
    ]
  }

  // Pattern: Geographic scope
  if (
    lowerQuestion.includes('where') ||
    lowerQuestion.includes('location') ||
    lowerQuestion.includes('country') ||
    lowerQuestion.includes('countries')
  ) {
    return [
      { id: '1', text: 'Europe', value: 'European countries' },
      { id: '2', text: 'Mediterranean', value: 'Mediterranean region' },
      { id: '3', text: 'Global', value: 'Global/International' },
      { id: '4', text: 'Other', value: '' },
    ]
  }

  // Pattern: Budget
  if (lowerQuestion.includes('budget') || lowerQuestion.includes('cost')) {
    return [
      { id: '1', text: '€10k-50k', value: 'Budget: €10,000 - €50,000' },
      { id: '2', text: '€50k-100k', value: 'Budget: €50,000 - €100,000' },
      { id: '3', text: '€100k-200k', value: 'Budget: €100,000 - €200,000' },
      { id: '4', text: 'Custom', value: '' },
    ]
  }

  // Pattern: Yes/No questions
  if (
    lowerQuestion.includes('do you') ||
    lowerQuestion.includes('will you') ||
    lowerQuestion.includes('are you')
  ) {
    return [
      { id: '1', text: 'Yes', value: 'Yes' },
      { id: '2', text: 'No', value: 'No' },
      { id: '3', text: 'Maybe', value: 'Maybe, need to discuss' },
    ]
  }

  // No pattern matched - return empty array
  return []
}

/**
 * Detect if user message shows uncertainty
 */
export function detectUncertainty(message: string): boolean {
  const uncertainPhrases = [
    "i don't know",
    "i'm not sure",
    'not sure',
    'unsure',
    'maybe',
    'i guess',
    'probably',
    'dunno',
    'no idea',
    "can't say",
  ]

  const lowerMessage = message.toLowerCase()
  return uncertainPhrases.some((phrase) => lowerMessage.includes(phrase))
}
