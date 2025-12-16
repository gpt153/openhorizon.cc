import { z } from 'zod'

/**
 * Project DNA Schema
 *
 * Defines the core characteristics of an Erasmus+ Youth Exchange project.
 * Used by AI to understand project requirements and generate appropriate content.
 */

export const ProjectDNASchema = z.object({
  target_group: z.object({
    age_range: z.enum(['13-17', '18-25', '26-30', 'mixed']),
    size: z.number().int().min(16).max(60),
    profile: z.enum(['general', 'fewer_opportunities', 'specific_needs']),
    specific_needs: z.array(z.string()).optional(),
  }),

  theme: z.string().min(1).max(500),

  inclusion_complexity: z.enum(['low', 'medium', 'high']),
  // low: general group, standard activities
  // medium: some participants with fewer opportunities
  // high: majority participants with complex support needs

  risk_level: z.enum(['low', 'medium', 'high']),
  // Based on activities, locations, participant needs

  digital_comfort: z.enum(['low', 'medium', 'high']),
  // Participant familiarity with digital tools

  language_needs: z.object({
    primary: z.array(z.string()),
    translation_required: z.boolean(),
    interpretation_needed: z.boolean(),
  }),

  green_ambition: z.enum(['basic', 'moderate', 'high']),
  // basic: follow minimum requirements
  // moderate: active green practices
  // high: green theme integrated throughout

  budget_flexibility: z.enum(['tight', 'moderate', 'flexible']),
  // Informs travel choices, venue selection

  partner_maturity: z.enum(['new', 'experienced', 'mixed']),
  // new: first Erasmus+ project
  // experienced: multiple successful projects
  // mixed: combination

  duration_preference: z.number().int().min(5).max(21),
  // Days (excluding travel)

  activity_intensity: z.enum(['low', 'medium', 'high']),
  // Hours per day, pacing, breaks needed
})

export type ProjectDNA = z.infer<typeof ProjectDNASchema>
