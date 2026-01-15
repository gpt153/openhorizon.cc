import type { Seed, SeedElaboration } from '@prisma/client'

// Input types
export interface BrainstormInput {
  prompt: string
  creativityTemp?: number // 0.0-1.0, default 0.9
  seedCount?: number      // 5-15, default 10
}

export interface SeedElaborationInput {
  seedId: string
  userMessage: string
}

// Output types
export interface GeneratedSeed {
  // Working mode (informal, authentic)
  title: string
  description: string
  approvalLikelihood: number // 0.0-1.0
  // Formal mode (application-ready)
  titleFormal: string
  descriptionFormal: string
  approvalLikelihoodFormal: number // 0.0-1.0
  // Shared fields
  suggestedTags?: string[]
  estimatedDuration?: number // days
  estimatedParticipants?: number
}

export interface ElaborationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  appliedChanges?: Partial<GeneratedSeed>
}

export interface ElaborationResponse {
  message: string
  suggestions: SeedSuggestion[]
  updatedSeed: GeneratedSeed
  updatedApprovalLikelihood: number
  updatedApprovalLikelihoodFormal: number
}

export interface SeedSuggestion {
  id: string
  text: string
  category: 'title' | 'description' | 'theme' | 'scope' | 'feasibility'
  rationale: string
}

// Enhanced Metadata Schema for Conversational Elaboration
export interface SeedMetadata {
  // Participant Information
  participantCount?: number // 16-60 (Erasmus+ requirement)
  participantCountries?: string[] // ISO country codes
  ageRange?: { min: number; max: number } // Typical: 18-30

  // Timeline
  duration?: number // Days (5-21 typical)
  startDate?: Date
  endDate?: Date

  // Budget
  totalBudget?: number // EUR
  budgetPerParticipant?: number // EUR (suggested: 300-500)

  // Destination
  destination?: {
    country: string // ISO country code
    city: string
    venue?: string
    accessibility?: string // Accessibility notes
  }

  // Requirements
  requirements?: {
    visas: Array<{
      country: string // Participant country
      needed: boolean
      estimatedCost?: number
    }>
    insurance: boolean
    permits: string[] // Required permits
    covidRequirements?: string
  }

  // Activities
  activities?: Array<{
    name: string
    duration: string // e.g., "2 days", "4 hours"
    budget?: number
    learningOutcomes?: string[]
  }>

  // EU Alignment
  erasmusPriorities?: string[] // e.g., ["Inclusion", "Green", "Digital"]
  learningObjectives?: string[]

  // Completeness Tracking
  completeness: number // 0-100%
  missingFields?: string[] // Fields still needed

  // Session Tracking
  sessionId?: string
  currentQuestionIndex?: number
}

// Agent Response Types
export interface StartSessionResponse {
  sessionId: string
  question: string
  suggestions?: string[]
  metadata: SeedMetadata
}

export interface ProcessAnswerResponse {
  nextQuestion?: string
  metadata: SeedMetadata
  complete: boolean
  suggestions?: string[]
  validationErrors?: string[]
}

export interface ValidationResult {
  valid: boolean
  message?: string
  suggestedValue?: any
}

// Enhanced types with relations
export type SeedWithElaboration = Seed & {
  elaborations: SeedElaboration[]
}
