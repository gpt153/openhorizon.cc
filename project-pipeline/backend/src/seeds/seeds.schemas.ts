import { z } from 'zod'

export const BrainstormInputSchema = z.object({
  prompt: z.string().min(10).max(1000),
  creativityTemp: z.number().min(0.0).max(1.0).optional().default(0.9),
  seedCount: z.number().int().min(5).max(15).optional().default(10),
})

export const SeedElaborationInputSchema = z.object({
  seedId: z.string().cuid(),
  userMessage: z.string().min(1).max(2000),
})

export const GeneratedSeedSchema = z.object({
  // Working mode (informal, authentic)
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(2000),
  approvalLikelihood: z.number().min(0.0).max(1.0),

  // Formal mode (application-ready)
  titleFormal: z.string().min(5).max(200),
  descriptionFormal: z.string().min(50).max(2000),
  approvalLikelihoodFormal: z.number().min(0.0).max(1.0),

  // Shared fields
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
  updatedApprovalLikelihoodFormal: z.number().min(0.0).max(1.0),
})

// Conversational Elaboration Schemas
export const SeedMetadataSchema = z.object({
  // Participant Information
  participantCount: z.number().int().min(16).max(60).optional(),
  participantCountries: z.array(z.string()).optional(),
  ageRange: z.object({
    min: z.number().int().min(14).max(100),
    max: z.number().int().min(14).max(100)
  }).optional(),

  // Timeline
  duration: z.number().int().min(1).max(30).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Budget
  totalBudget: z.number().positive().optional(),
  budgetPerParticipant: z.number().positive().optional(),

  // Destination
  destination: z.object({
    country: z.string().length(2), // ISO country code
    city: z.string(),
    venue: z.string().optional(),
    accessibility: z.string().optional()
  }).optional(),

  // Requirements
  requirements: z.object({
    visas: z.array(z.object({
      country: z.string(),
      needed: z.boolean(),
      estimatedCost: z.number().optional()
    })),
    insurance: z.boolean(),
    permits: z.array(z.string()),
    covidRequirements: z.string().optional()
  }).optional(),

  // Activities
  activities: z.array(z.object({
    name: z.string(),
    duration: z.string(),
    budget: z.number().optional(),
    learningOutcomes: z.array(z.string()).optional()
  })).optional(),

  // EU Alignment
  erasmusPriorities: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),

  // Completeness Tracking
  completeness: z.number().min(0).max(100),
  missingFields: z.array(z.string()).optional(),

  // Session Tracking
  sessionId: z.string().optional(),
  currentQuestionIndex: z.number().int().optional()
})

export const StartSessionResponseSchema = z.object({
  sessionId: z.string(),
  question: z.string(),
  suggestions: z.array(z.string()).optional(),
  metadata: SeedMetadataSchema
})

export const ProcessAnswerRequestSchema = z.object({
  sessionId: z.string(),
  answer: z.string().min(1).max(5000)
})

export const ProcessAnswerResponseSchema = z.object({
  nextQuestion: z.string().optional(),
  metadata: SeedMetadataSchema,
  complete: z.boolean(),
  suggestions: z.array(z.string()).optional(),
  validationErrors: z.array(z.string()).optional()
})
