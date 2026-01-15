/**
 * Shared type definitions for project generation system
 *
 * These types are used across all generator modules to ensure
 * consistent data structures and type safety.
 */

import type { PhaseType } from '@prisma/client'

/**
 * Rich metadata extracted from elaborated seed
 */
export interface RichSeedMetadata {
  title: string
  description: string
  participants: number
  duration: number // days
  destination: string
  participantCountries: string[]
  activities: Activity[]
  startDate: Date | null
  estimatedBudget: number // EUR
  tags: string[]
  isPublicEvent: boolean
  hasWorkshops: boolean
  requiresPermits: boolean
}

/**
 * Activity definition from seed
 */
export interface Activity {
  id: string
  name: string
  type: 'workshop' | 'cultural_visit' | 'team_building' | 'reflection' | 'cooking_workshop' | 'public_event' | 'other'
  duration: number // hours
  isOutdoor: boolean
  requiresFacilitator: boolean
  description?: string
}

/**
 * Timeline generation output
 */
export interface TimelineOutput {
  preparation: {
    startDate: Date
    endDate: Date
    durationWeeks: number
  }
  exchange: {
    startDate: Date
    endDate: Date
    durationDays: number
  }
  followUp: {
    startDate: Date
    endDate: Date
    durationWeeks: number
  }
  phaseDates: Map<PhaseType, {
    startDate: Date
    endDate: Date
    deadline: Date
  }>
}

/**
 * Budget allocation output
 */
export interface BudgetOutput {
  totalBudget: number
  breakdown: {
    travel: number
    accommodation: number
    food: number
    activities: number
    staffing: number
    insurance: number
    permits: number
    application: number
    contingency: number
  }
  phaseAllocations: Map<string, number> // phaseId → budget
  justification: string
}

/**
 * Requirements analysis output
 */
export interface RequirementsOutput {
  visas: {
    required: boolean
    countries: string[]
    type: 'schengen' | 'national' | 'none'
    deadline: Date
  }
  insurance: {
    required: boolean
    type: 'group_travel' | 'individual'
    coverage: string[]
  }
  permits: {
    required: boolean
    types: Array<{
      type: 'event' | 'venue' | 'food_handling' | 'public_assembly'
      reason: string
      authority: string
    }>
  }
  accessibility: {
    wheelchairAccess: boolean
    dietaryRestrictions: boolean
    languageSupport: string[]
  }
}

/**
 * Phase template for database insertion
 */
export interface PhaseTemplate {
  name: string
  type: PhaseType
  status: 'NOT_STARTED'
  start_date: Date
  end_date: Date
  deadline: Date
  budget_allocated: number
  budget_spent: 0
  order: number
  dependencies: string[] // Phase types that must complete first
  editable: boolean
  skippable: boolean
}

/**
 * Checklist task definition
 */
export interface ChecklistTask {
  id: string
  description: string
  completed: boolean
  dueDate?: Date
  category: 'planning' | 'booking' | 'admin' | 'coordination'
  priority: 'high' | 'medium' | 'low'
}

/**
 * Checklist output structure
 */
export interface ChecklistOutput {
  tasks: ChecklistTask[]
}

/**
 * Timeline generation input
 */
export interface TimelineInput {
  exchangeStartDate: Date
  exchangeDuration: number // days
  activities: Activity[]
  requiresVisa: boolean
}

/**
 * Budget allocation input
 */
export interface BudgetInput {
  totalBudget: number
  participants: number
  duration: number // days
  destination: string
  activities: Activity[]
  hasLongDistanceTravel: boolean
  hasAccommodation: boolean
  hasWorkshops: boolean
}

/**
 * Requirements analysis input
 */
export interface RequirementsInput {
  participantCountries: string[]
  destinationCountry: string
  activities: Activity[]
  isPublicEvent: boolean
  hasFood: boolean
  participants: number
}

/**
 * Phase generation input
 */
export interface PhaseGeneratorInput {
  seed: RichSeedMetadata
  timeline: TimelineOutput
  budget: BudgetOutput
  requirements: RequirementsOutput
  projectId: string
}

/**
 * Phase generation output
 */
export interface PhaseGeneratorOutput {
  phases: PhaseTemplate[]
}

/**
 * Checklist generation input
 */
export interface ChecklistInput {
  phase: PhaseTemplate
  seed: RichSeedMetadata
  requirements: RequirementsOutput
}
