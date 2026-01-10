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

// Enhanced types with relations
export type SeedWithElaboration = Seed & {
  elaborations: SeedElaboration[]
}
