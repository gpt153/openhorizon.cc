import { z } from 'zod'

/**
 * User Idea Inputs Schema
 *
 * Collects user inputs from the 5-step wizard form.
 * These inputs are then analyzed by AI to extract Project DNA.
 */

export const UserIdeaInputsSchema = z.object({
  // Step 1: Basics
  theme: z.string().min(1, 'Theme is required').max(500),
  description: z.string().optional(),

  // Step 2: Target Group
  age_group: z.enum(['13-17', '18-25', '26-30', 'mixed']),
  participant_count: z.number().int().min(16).max(60),
  target_profile: z.enum(['general', 'fewer_opportunities', 'specific_needs']),
  specific_needs_description: z.string().optional(),

  // Step 3: Duration & Logistics
  duration_days: z.number().int().min(5).max(21),
  activity_intensity: z.enum(['low', 'medium', 'high']),
  green_ambition: z.enum(['basic', 'moderate', 'high']),

  // Step 4: Partners
  partner_status: z.enum(['confirmed', 'need_suggestions', 'some_confirmed']),
  partner_experience: z.enum(['new', 'mixed', 'experienced']),
  preferred_countries: z.string().optional(),

  // Step 5: Additional Considerations
  primary_languages: z.string(),
  translation_support: z.boolean(),
  interpretation_needed: z.boolean(),
  digital_comfort: z.enum(['low', 'medium', 'high']),
  budget_flexibility: z.enum(['tight', 'moderate', 'flexible']),
  additional_notes: z.string().optional(),
})

export type UserIdeaInputs = z.infer<typeof UserIdeaInputsSchema>

/**
 * Individual step schemas for client-side validation
 */

export const BasicsStepSchema = UserIdeaInputsSchema.pick({
  theme: true,
  description: true,
})

export const TargetGroupStepSchema = UserIdeaInputsSchema.pick({
  age_group: true,
  participant_count: true,
  target_profile: true,
  specific_needs_description: true,
})

export const DurationStepSchema = UserIdeaInputsSchema.pick({
  duration_days: true,
  activity_intensity: true,
  green_ambition: true,
})

export const PartnersStepSchema = UserIdeaInputsSchema.pick({
  partner_status: true,
  partner_experience: true,
  preferred_countries: true,
})

export const AdditionalStepSchema = UserIdeaInputsSchema.pick({
  primary_languages: true,
  translation_support: true,
  interpretation_needed: true,
  digital_comfort: true,
  budget_flexibility: true,
  additional_notes: true,
})
