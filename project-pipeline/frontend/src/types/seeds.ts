// Seeds types for frontend

export interface Seed {
  id: string
  user_id: string
  title: string
  description: string
  approval_likelihood: number
  title_formal: string | null
  description_formal: string | null
  approval_likelihood_formal: number | null
  tags: string[]
  estimated_duration: number | null
  estimated_participants: number | null
  is_saved: boolean
  is_dismissed: boolean
  elaboration_count: number
  current_version: GeneratedSeed | null
  created_at: string
  updated_at: string
  elaborations?: SeedElaboration[]
}

export interface SeedElaboration {
  id: string
  seed_id: string
  conversation_history: ElaborationMessage[]
  current_seed_state: GeneratedSeed
  created_at: string
  updated_at: string
}

export interface GeneratedSeed {
  title: string
  description: string
  approvalLikelihood: number
  titleFormal: string
  descriptionFormal: string
  approvalLikelihoodFormal: number
  suggestedTags?: string[]
  estimatedDuration?: number
  estimatedParticipants?: number
}

export interface ElaborationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  appliedChanges?: Partial<GeneratedSeed>
}

// Extended message type with edit capability
export interface ElaborationMessageExtended extends ElaborationMessage {
  id: string // Unique message ID for editing
  isEdited?: boolean
  originalContent?: string
}

export interface SeedSuggestion {
  id: string
  text: string
  category: 'title' | 'description' | 'theme' | 'scope' | 'feasibility'
  rationale: string
}

export interface ElaborationResponse {
  message: string
  suggestions: SeedSuggestion[]
  updatedSeed: GeneratedSeed
  updatedApprovalLikelihood: number
  updatedApprovalLikelihoodFormal: number
}

// API Request types
export interface GenerateSeedsRequest {
  prompt: string
  creativityTemp?: number // 0.0-1.0
  seedCount?: number // 5-15
}

export interface ElaborateSeedRequest {
  userMessage: string
}

// API Response types
export interface GenerateSeedsResponse {
  seeds: GeneratedSeed[]
}

export interface ListSeedsResponse {
  seeds: Seed[]
}

export interface GetSeedResponse {
  seed: Seed
}

export interface ConvertSeedToProjectResponse {
  project: {
    id: string
    name: string
    type: string
    status: string
    description: string | null
    start_date: string
    end_date: string
    budget_total: number
    participants_count: number
    location: string
    created_at: string
  }
}

// Quick reply option for chat interface
export interface QuickReply {
  id: string
  text: string
  value: string
  category?: string
}

// Metadata tracking for completeness
export interface SeedMetadata {
  // Core fields
  title: string
  description: string
  theme?: string

  // Project details
  estimatedDuration?: number
  estimatedParticipants?: number
  targetAgeGroup?: string

  // Scope
  geographicScope?: string
  projectType?: string

  // Feasibility
  budgetRange?: string
  requiredResources?: string[]

  // Completeness tracking
  completedFields: string[]
  totalFields: string[]
  completenessPercentage: number
}
