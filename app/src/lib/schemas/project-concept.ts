import { z } from 'zod'

/**
 * Project Concept Schema
 *
 * Defines the structure of AI-generated project concepts.
 * Matches the Prisma Project model fields.
 */

export const ObjectiveSchema = z.object({
  text: z.string(),
  erasmus_priority: z.string(),
})

export const ActivityDaySchema = z.object({
  day: z.number(),
  morning: z.string(),
  afternoon: z.string(),
  evening: z.string(),
})

export const LearningOutcomeSchema = z.object({
  category: z.string(), // e.g., "Digital Competence", "Intercultural Awareness"
  outcome: z.string(),
})

export const BudgetBreakdownSchema = z.object({
  organizational: z.number(),
  travel_min: z.number(),
  travel_max: z.number(),
  individual_min: z.number(),
  individual_max: z.number(),
  inclusion: z.number(),
  exceptional: z.number().optional(),
})

export const ProjectConceptSchema = z.object({
  // Basic Info
  title: z.string().min(5).max(200),
  tagline: z.string().min(10).max(300),

  // Generated Content
  objectives: z.array(ObjectiveSchema).min(3).max(5),
  targetGroupDescription: z.string().min(100).max(2000),
  activityOutline: z.array(ActivityDaySchema).min(5).max(21),
  learningOutcomes: z.array(LearningOutcomeSchema).min(5).max(10),
  inclusionPlanOverview: z.string().min(100).max(2000),
  partnerProfile: z.string().min(100).max(2000),

  // Budget
  estimatedBudgetRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.literal('EUR'),
    breakdown: BudgetBreakdownSchema,
  }),

  // Narratives
  sustainabilityNarrative: z.string().min(80).max(1000),
  impactNarrative: z.string().min(80).max(1000),
})

export type ProjectConcept = z.infer<typeof ProjectConceptSchema>
export type Objective = z.infer<typeof ObjectiveSchema>
export type ActivityDay = z.infer<typeof ActivityDaySchema>
export type LearningOutcome = z.infer<typeof LearningOutcomeSchema>
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>
