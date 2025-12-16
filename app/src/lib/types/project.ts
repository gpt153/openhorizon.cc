/**
 * Project-related TypeScript types
 *
 * Re-exports Zod-inferred types and adds additional utility types
 */

export type { UserIdeaInputs } from '../schemas/project-wizard'
export type { ProjectDNA } from '../schemas/project-dna'
export type {
  ProjectConcept,
  Objective,
  ActivityDay,
  LearningOutcome,
  BudgetBreakdown,
} from '../schemas/project-concept'

/**
 * Generation Status Types
 */
export type GenerationStatus = 'in_progress' | 'completed' | 'failed'

/**
 * Similar Project (for RAG)
 */
export type SimilarProject = {
  title: string
  objectives: string[]
  activities: string[]
  outcomes: string[]
}

/**
 * Generation Session Response
 */
export type GenerationSessionResponse = {
  sessionId: string
  status: GenerationStatus
  projectId?: string
  error?: string
}

/**
 * Wizard Step Names
 */
export type WizardStep = 'basics' | 'target_group' | 'duration' | 'partners' | 'additional'

/**
 * Wizard Navigation
 */
export type WizardNavigation = {
  current: number
  total: number
  canGoBack: boolean
  canGoNext: boolean
  isFirstStep: boolean
  isLastStep: boolean
}
