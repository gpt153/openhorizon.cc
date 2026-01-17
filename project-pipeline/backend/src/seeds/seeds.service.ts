import { prisma } from '../config/database.js'
import { generateSeeds } from '../ai/chains/seed-generation.js'
import { elaborateSeed } from '../ai/chains/seed-elaboration.js'
import { SeedElaborationAgent } from '../ai/agents/seed-elaboration-agent.js'
import type {
  BrainstormInput,
  GeneratedSeed,
  ElaborationMessage,
  ElaborationResponse,
  SeedMetadata,
  StartSessionResponse,
  ProcessAnswerResponse
} from './seeds.types.js'
import { generateTimeline } from './generators/timeline-generator.js'
import { allocateBudget } from './generators/budget-allocator.js'
import { analyzeRequirements } from './generators/requirements-analyzer.js'
import { generatePhases } from './generators/phase-generator.js'
import { generateChecklist } from './generators/checklist-generator.js'
import type { RichSeedMetadata, Activity } from './generators/types.js'
import type { Seed } from '@prisma/client'

/**
 * Generate new seeds from user prompt
 * Note: Seeds are NOT saved to database automatically.
 * User must explicitly save or dismiss them.
 */
export async function generateAndSaveSeeds(
  userId: string,
  input: BrainstormInput
): Promise<GeneratedSeed[]> {
  // Generate seeds using AI (but don't save them yet)
  const generatedSeeds = await generateSeeds(input)

  // Return generated seeds without saving
  // User will choose which ones to save via frontend
  return generatedSeeds
}

/**
 * List all seeds for a user
 */
export async function listUserSeeds(
  userId: string,
  options?: {
    savedOnly?: boolean
    excludeDismissed?: boolean
  }
) {
  const where: any = { user_id: userId }

  if (options?.savedOnly) {
    where.is_saved = true
  }

  if (options?.excludeDismissed) {
    where.is_dismissed = false
  }

  return await prisma.seed.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      elaborations: true,
    },
  })
}

/**
 * Get single seed by ID
 */
export async function getSeedById(seedId: string, userId: string) {
  const seed = await prisma.seed.findFirst({
    where: {
      id: seedId,
      user_id: userId,
    },
    include: {
      elaborations: true,
    },
  })

  if (!seed) {
    throw new Error('Seed not found')
  }

  return seed
}

/**
 * Elaborate seed through conversation
 */
export async function elaborateSeedConversation(
  seedId: string,
  userId: string,
  userMessage: string
): Promise<ElaborationResponse> {
  // Load seed
  const seed = await getSeedById(seedId, userId)

  // Get or create elaboration
  let elaboration = seed.elaborations[0]
  if (!elaboration) {
    const currentSeedState = {
      title: seed.title,
      description: seed.description,
      approvalLikelihood: seed.approval_likelihood,
      titleFormal: seed.title_formal || seed.title,
      descriptionFormal: seed.description_formal || seed.description,
      approvalLikelihoodFormal: seed.approval_likelihood_formal || seed.approval_likelihood,
      suggestedTags: seed.tags,
      estimatedDuration: seed.estimated_duration,
      estimatedParticipants: seed.estimated_participants,
    }

    elaboration = await prisma.seedElaboration.create({
      data: {
        seed_id: seed.id,
        conversation_history: [],
        current_seed_state: currentSeedState as any,
      },
    })
  }

  // Run AI elaboration
  const currentSeed = elaboration.current_seed_state as any as GeneratedSeed
  const history = elaboration.conversation_history as unknown as ElaborationMessage[]

  const response = await elaborateSeed(currentSeed, history, userMessage)

  // Update conversation history
  const updatedHistory = [
    ...history,
    {
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date(),
    },
    {
      role: 'assistant' as const,
      content: response.message,
      timestamp: new Date(),
      appliedChanges: response.updatedSeed,
    },
  ]

  // Save updated elaboration
  await prisma.seedElaboration.update({
    where: { id: elaboration.id },
    data: {
      conversation_history: updatedHistory as any,
      current_seed_state: response.updatedSeed as any,
    },
  })

  // Update seed with new version
  await prisma.seed.update({
    where: { id: seed.id },
    data: {
      current_version: response.updatedSeed as any,
      title: response.updatedSeed.title,
      description: response.updatedSeed.description,
      approval_likelihood: response.updatedApprovalLikelihood,
      title_formal: response.updatedSeed.titleFormal,
      description_formal: response.updatedSeed.descriptionFormal,
      approval_likelihood_formal: response.updatedApprovalLikelihoodFormal,
      elaboration_count: { increment: 1 },
    },
  })

  return response
}

/**
 * Create and save a generated seed to database
 */
export async function createGeneratedSeed(
  userId: string,
  seed: GeneratedSeed
) {
  const savedSeed = await prisma.seed.create({
    data: {
      user_id: userId,
      title: seed.title,
      description: seed.description,
      approval_likelihood: seed.approvalLikelihood,
      title_formal: seed.titleFormal,
      description_formal: seed.descriptionFormal,
      approval_likelihood_formal: seed.approvalLikelihoodFormal,
      tags: seed.suggestedTags || [],
      estimated_duration: seed.estimatedDuration,
      estimated_participants: seed.estimatedParticipants,
      current_version: seed as any,
      is_saved: true, // Mark as saved when explicitly created by user
      is_dismissed: false,
    },
  })

  return savedSeed
}

/**
 * Save a seed (mark existing seed as saved)
 */
export async function saveSeed(seedId: string, userId: string) {
  const updated = await prisma.seed.updateMany({
    where: {
      id: seedId,
      user_id: userId,
    },
    data: {
      is_saved: true,
    },
  })

  if (updated.count === 0) {
    throw new Error('Seed not found or unauthorized')
  }

  return { success: true }
}

/**
 * Dismiss a seed
 */
export async function dismissSeed(seedId: string, userId: string) {
  const updated = await prisma.seed.updateMany({
    where: {
      id: seedId,
      user_id: userId,
    },
    data: {
      is_dismissed: true,
    },
  })

  if (updated.count === 0) {
    throw new Error('Seed not found or unauthorized')
  }

  return { success: true }
}

/**
 * Delete a seed
 */
export async function deleteSeed(seedId: string, userId: string) {
  const deleted = await prisma.seed.deleteMany({
    where: {
      id: seedId,
      user_id: userId,
    },
  })

  if (deleted.count === 0) {
    throw new Error('Seed not found or unauthorized')
  }

  return { success: true }
}

/**
 * Start conversational elaboration session
 */
export async function startElaborationSession(
  seedId: string,
  userId: string
): Promise<StartSessionResponse> {
  const seed = await getSeedById(seedId, userId)
  const agent = new SeedElaborationAgent()

  // Convert database seed to GeneratedSeed format
  const generatedSeed: GeneratedSeed = {
    title: seed.title,
    description: seed.description,
    approvalLikelihood: seed.approval_likelihood,
    titleFormal: seed.title_formal || seed.title,
    descriptionFormal: seed.description_formal || seed.description,
    approvalLikelihoodFormal: seed.approval_likelihood_formal || seed.approval_likelihood,
    suggestedTags: seed.tags,
    estimatedDuration: seed.estimated_duration,
    estimatedParticipants: seed.estimated_participants
  }

  // Get or create elaboration record
  let elaboration = seed.elaborations[0]
  if (!elaboration) {
    const initialMetadata: Partial<SeedMetadata> = {
      completeness: 0,
      estimatedParticipants: seed.estimated_participants,
      duration: seed.estimated_duration
    }

    elaboration = await prisma.seedElaboration.create({
      data: {
        seed_id: seed.id,
        conversation_history: [],
        current_seed_state: generatedSeed as any
      }
    })

    // Start session with agent
    const response = await agent.startSession(generatedSeed, initialMetadata)

    // Update elaboration with metadata
    await prisma.seedElaboration.update({
      where: { id: elaboration.id },
      data: {
        conversation_history: [
          {
            role: 'assistant',
            content: response.question,
            timestamp: new Date()
          }
        ] as any
      }
    })

    return response
  }

  // Existing elaboration - resume session
  const metadata = (elaboration as any).metadata as SeedMetadata | undefined
  const response = await agent.startSession(generatedSeed, metadata)

  return response
}

/**
 * Process user answer and get next question
 */
export async function processElaborationAnswer(
  seedId: string,
  userId: string,
  sessionId: string,
  answer: string
): Promise<ProcessAnswerResponse> {
  const seed = await getSeedById(seedId, userId)
  const elaboration = seed.elaborations[0]

  if (!elaboration) {
    throw new Error('No elaboration session found. Please start a session first.')
  }

  const agent = new SeedElaborationAgent()

  // Convert database seed to GeneratedSeed format
  const generatedSeed: GeneratedSeed = {
    title: seed.title,
    description: seed.description,
    approvalLikelihood: seed.approval_likelihood,
    titleFormal: seed.title_formal || seed.title,
    descriptionFormal: seed.description_formal || seed.description,
    approvalLikelihoodFormal: seed.approval_likelihood_formal || seed.approval_likelihood,
    suggestedTags: seed.tags,
    estimatedDuration: seed.estimated_duration,
    estimatedParticipants: seed.estimated_participants
  }

  // Get current metadata
  const currentMetadata: SeedMetadata = (elaboration as any).metadata || {
    completeness: 0,
    sessionId
  }

  // Validate session ID
  if (currentMetadata.sessionId && currentMetadata.sessionId !== sessionId) {
    throw new Error('Invalid session ID')
  }

  // Ensure session ID is set
  currentMetadata.sessionId = sessionId

  // Process answer
  const response = await agent.processAnswer(sessionId, answer, currentMetadata, generatedSeed)

  // Update conversation history
  const conversationHistory = (elaboration.conversation_history as any[]) || []
  conversationHistory.push(
    {
      role: 'user',
      content: answer,
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: response.nextQuestion || 'Session complete!',
      timestamp: new Date()
    }
  )

  // Update elaboration
  await prisma.seedElaboration.update({
    where: { id: elaboration.id },
    data: {
      conversation_history: conversationHistory as any,
      current_seed_state: {
        ...generatedSeed,
        metadata: response.metadata
      } as any
    }
  })

  // Update seed with metadata
  await prisma.seed.update({
    where: { id: seed.id },
    data: {
      current_version: {
        ...generatedSeed,
        metadata: response.metadata
      } as any,
      estimated_duration: response.metadata.duration || seed.estimated_duration,
      estimated_participants: response.metadata.participantCount || seed.estimated_participants
    }
  })

  return response
}

/**
 * Get elaboration status and progress
 */
export async function getElaborationStatus(
  seedId: string,
  userId: string
): Promise<{
  completeness: number
  metadata: SeedMetadata
  missingFields: string[]
}> {
  const seed = await getSeedById(seedId, userId)
  const elaboration = seed.elaborations[0]

  if (!elaboration) {
    return {
      completeness: 0,
      metadata: { completeness: 0 } as SeedMetadata,
      missingFields: ['all']
    }
  }

  const agent = new SeedElaborationAgent()
  const metadata: SeedMetadata = (elaboration as any).metadata || { completeness: 0 }

  return {
    completeness: agent.calculateCompleteness(metadata),
    metadata,
    missingFields: agent.identifyMissingFields(metadata)
  }
}

/**
 * Extract rich metadata from seed for generators
 */
function extractSeedMetadata(seed: Seed): RichSeedMetadata {
  const currentVersion = seed.current_version as any

  // Extract activities from current version or default to empty
  const activities: Activity[] = (currentVersion?.activities || []).map((a: any, index: number) => ({
    id: `activity-${index}`,
    name: a.name || `Activity ${index + 1}`,
    type: a.type || 'other',
    duration: a.duration || 2,
    isOutdoor: a.isOutdoor || false,
    requiresFacilitator: a.requiresFacilitator || false,
    description: a.description
  }))

  // Determine start date: from current_version or default to 60 days in future
  let startDate: Date
  if (currentVersion?.startDate) {
    startDate = new Date(currentVersion.startDate)
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() + 60) // Default: 60 days in future
  }

  return {
    title: seed.title_formal || seed.title,
    description: seed.description_formal || seed.description,
    participants: seed.estimated_participants || 20,
    duration: seed.estimated_duration || 7,
    destination: currentVersion?.destination || 'Barcelona, Spain',
    participantCountries: currentVersion?.participantCountries || ['TR'],
    activities,
    startDate,
    estimatedBudget: currentVersion?.estimatedBudget || 50000,
    tags: seed.tags || [],
    isPublicEvent: currentVersion?.isPublicEvent || false,
    hasWorkshops: activities.some(a => a.type === 'workshop'),
    requiresPermits: currentVersion?.requiresPermits || false
  }
}

/**
 * Determine project type from tags
 */
function determineProjectType(tags: string[]): 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM' {
  const lowerTags = tags.map(t => t.toLowerCase())

  if (lowerTags.some(t => t.includes('exchange') || t.includes('mobility'))) {
    return 'STUDENT_EXCHANGE'
  }
  if (lowerTags.some(t => t.includes('training') || t.includes('course'))) {
    return 'TRAINING'
  }
  if (lowerTags.some(t => t.includes('conference') || t.includes('seminar'))) {
    return 'CONFERENCE'
  }
  return 'CUSTOM'
}

/**
 * Convert seed to complete project with intelligent phase generation
 *
 * Uses generator modules to create timeline, allocate budget, analyze requirements,
 * generate phases, and populate checklists.
 */
export async function convertSeedToProject(seedId: string, userId: string) {
  // 1. Load seed with authorization check
  const seed = await getSeedById(seedId, userId)

  // 2. Extract metadata from seed
  const metadata = extractSeedMetadata(seed)

  // 3. Run generators in parallel (independent operations)
  const [timeline, budget, requirements] = await Promise.all([
    generateTimeline(metadata),
    allocateBudget(metadata),
    analyzeRequirements(metadata)
  ])

  // 4. Generate phase templates (depends on timeline, budget, requirements)
  const { phases: phaseTemplates } = generatePhases({
    seed: metadata,
    timeline,
    budget,
    requirements,
    projectId: '' // Will be filled after project creation
  })

  // 5. Create project and phases in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create project
    const newProject = await tx.project.create({
      data: {
        name: metadata.title,
        type: determineProjectType(metadata.tags),
        status: 'PLANNING',
        description: metadata.description,
        start_date: timeline.preparation.startDate,
        end_date: timeline.followUp.endDate,
        budget_total: budget.totalBudget,
        budget_spent: 0,
        participants_count: metadata.participants,
        location: metadata.destination,
        created_by: userId,
        metadata: {
          converted_from_seed_id: seed.id,
          original_approval_likelihood: seed.approval_likelihood_formal || seed.approval_likelihood,
          timeline_summary: {
            preparation: {
              startDate: timeline.preparation.startDate.toISOString(),
              endDate: timeline.preparation.endDate.toISOString(),
              durationWeeks: timeline.preparation.durationWeeks
            },
            exchange: {
              startDate: timeline.exchange.startDate.toISOString(),
              endDate: timeline.exchange.endDate.toISOString(),
              durationDays: timeline.exchange.durationDays
            },
            followUp: {
              startDate: timeline.followUp.startDate.toISOString(),
              endDate: timeline.followUp.endDate.toISOString(),
              durationWeeks: timeline.followUp.durationWeeks
            }
          },
          budget_breakdown: budget.breakdown,
          budget_justification: budget.justification,
          requirements_summary: {
            visas: {
              required: requirements.visas.required,
              countries: requirements.visas.countries,
              type: requirements.visas.type
            },
            insurance: {
              required: requirements.insurance.required,
              type: requirements.insurance.type,
              coverage: requirements.insurance.coverage
            },
            permits: {
              required: requirements.permits.required,
              count: requirements.permits.types.length
            }
          },
          generation_timestamp: new Date().toISOString()
        }
      }
    })

    // Create phases with checklists
    const createdPhases = []
    for (const phaseTemplate of phaseTemplates) {
      // Generate checklist for this phase
      const checklist = generateChecklist({
        phase: phaseTemplate,
        seed: metadata,
        requirements
      })

      const phase = await tx.phase.create({
        data: {
          project_id: newProject.id,
          name: phaseTemplate.name,
          type: phaseTemplate.type,
          status: phaseTemplate.status,
          start_date: phaseTemplate.start_date,
          end_date: phaseTemplate.end_date,
          deadline: phaseTemplate.deadline,
          budget_allocated: phaseTemplate.budget_allocated,
          budget_spent: 0,
          order: phaseTemplate.order,
          dependencies: phaseTemplate.dependencies,
          checklist: checklist as any, // JSON field
          editable: phaseTemplate.editable,
          skippable: phaseTemplate.skippable
        }
      })

      createdPhases.push(phase)
    }

    return { project: newProject, phases: createdPhases }
  }, { timeout: 10000 })

  // 6. Return complete project data with metadata
  return {
    project: result.project,
    phases: result.phases,
    timeline: {
      preparation: {
        startDate: timeline.preparation.startDate.toISOString(),
        endDate: timeline.preparation.endDate.toISOString(),
        durationWeeks: timeline.preparation.durationWeeks
      },
      exchange: {
        startDate: timeline.exchange.startDate.toISOString(),
        endDate: timeline.exchange.endDate.toISOString(),
        durationDays: timeline.exchange.durationDays
      },
      followUp: {
        startDate: timeline.followUp.startDate.toISOString(),
        endDate: timeline.followUp.endDate.toISOString(),
        durationWeeks: timeline.followUp.durationWeeks
      }
    },
    budget: {
      totalBudget: budget.totalBudget,
      breakdown: budget.breakdown,
      justification: budget.justification
    },
    requirements: {
      visas: requirements.visas,
      insurance: requirements.insurance,
      permits: requirements.permits
    }
  }
}
