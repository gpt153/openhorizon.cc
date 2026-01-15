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

// Seed Metadata Types (Issue #96 - Part 4)
export interface SeedMetadata {
  participantCount?: number
  participantCountries?: string[]
  ageRange?: { min: number; max: number }
  duration?: number
  startDate?: Date | string
  endDate?: Date | string
  totalBudget?: number
  destination?: {
    country: string
    city: string
    venue?: string
  }
  requirements?: {
    visas: { country: string; needed: boolean }[]
    insurance: boolean
    permits: string[]
    accessibility?: string[]
  }
  activities?: {
    name: string
    duration: string
    budget?: number
  }[]
  erasmusPriorities?: string[]
  completeness: number // 0-100
}

// Phase Checklist Types (Issue #96 - Part 4)
export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  deadline?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  type?: 'task' | 'warning' | 'requirement'
}

export interface PhaseChecklist {
  items: ChecklistItem[]
}

// Generation Context Types
export interface GenerationContext {
  generatedBy: 'ai' | 'template' | 'user'
  generatedAt: Date | string
  sourceType?: 'seed' | 'project' | 'custom'
  sourceId?: string
  aiModel?: string
  prompt?: string
}
