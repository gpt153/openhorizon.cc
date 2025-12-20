import { z } from 'zod'

export const BrainstormInputSchema = z.object({
  prompt: z.string().min(10).max(1000),
  creativityTemp: z.number().min(0.0).max(1.0).optional().default(0.9),
  seedCount: z.number().int().min(5).max(15).optional().default(10),
})

export const SeedElaborationInputSchema = z.object({
  seedId: z.string().uuid(),
  userMessage: z.string().min(1).max(2000),
})

export const ApplySuggestionInputSchema = z.object({
  seedId: z.string().uuid(),
  suggestionText: z.string().min(1),
  fieldToUpdate: z.enum(['title', 'description', 'tags']),
})

export const GeneratedSeedSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(2000),
  approvalLikelihood: z.number().min(0.0).max(1.0),
  suggestedTags: z.array(z.string()).optional(),
  estimatedDuration: z.number().int().min(5).max(21).optional(),
  estimatedParticipants: z.number().int().min(16).max(60).optional(),
})

export const SeedsArraySchema = z.object({
  seeds: z.array(GeneratedSeedSchema),
})

export const SeedSuggestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(['title', 'description', 'theme', 'scope', 'feasibility']),
  rationale: z.string(),
})

export const ElaborationResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(SeedSuggestionSchema),
  updatedSeed: GeneratedSeedSchema,
  updatedApprovalLikelihood: z.number().min(0.0).max(1.0),
})

// Type inference
export type BrainstormInput = z.infer<typeof BrainstormInputSchema>
export type SeedElaborationInput = z.infer<typeof SeedElaborationInputSchema>
export type ApplySuggestionInput = z.infer<typeof ApplySuggestionInputSchema>
export type GeneratedSeed = z.infer<typeof GeneratedSeedSchema>
export type SeedsArray = z.infer<typeof SeedsArraySchema>
export type ElaborationResponse = z.infer<typeof ElaborationResponseSchema>
