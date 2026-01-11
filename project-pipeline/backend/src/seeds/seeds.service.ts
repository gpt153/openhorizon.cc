import { prisma } from '../config/database.js'
import { generateSeeds } from '../ai/chains/seed-generation.js'
import { elaborateSeed } from '../ai/chains/seed-elaboration.js'
import type {
  BrainstormInput,
  GeneratedSeed,
  ElaborationMessage,
  ElaborationResponse
} from './seeds.types.js'

/**
 * Generate new seeds from user prompt
 */
export async function generateAndSaveSeeds(
  userId: string,
  input: BrainstormInput
): Promise<GeneratedSeed[]> {
  // Generate seeds using AI
  const generatedSeeds = await generateSeeds(input)

  // Save seeds to database
  const savedSeeds = await Promise.all(
    generatedSeeds.map(async (seed) => {
      return await prisma.seed.create({
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
        },
      })
    })
  )

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
 * Save a seed
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
 * Convert seed to project with default phases
 */
export async function convertSeedToProject(seedId: string, userId: string) {
  // Load seed with authorization check
  const seed = await getSeedById(seedId, userId)

  // Calculate project dates from estimated duration
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30) // Default: 30 days in future

  const estimatedDays = seed.estimated_duration || 14 // Default: 14 days
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + estimatedDays)

  // Determine project type from seed tags
  const tags = seed.tags || []
  let projectType: 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM' = 'CUSTOM'
  if (tags.some((t: string) => t.toLowerCase().includes('exchange') || t.toLowerCase().includes('mobility'))) {
    projectType = 'STUDENT_EXCHANGE'
  } else if (tags.some((t: string) => t.toLowerCase().includes('training') || t.toLowerCase().includes('course'))) {
    projectType = 'TRAINING'
  } else if (tags.some((t: string) => t.toLowerCase().includes('conference') || t.toLowerCase().includes('seminar'))) {
    projectType = 'CONFERENCE'
  }

  // Use transaction to create project and phases atomically
  const project = await prisma.$transaction(async (tx) => {
    // Create project from seed data
    const newProject = await tx.project.create({
      data: {
        name: seed.title_formal || seed.title,
        type: projectType,
        status: 'PLANNING',
        description: seed.description_formal || seed.description,
        start_date: startDate,
        end_date: endDate,
        budget_total: 50000, // Default budget (EUR)
        participants_count: seed.estimated_participants || 20,
        location: 'TBD', // User will update
        created_by: userId,
        metadata: {
          converted_from_seed_id: seed.id,
          original_approval_likelihood: seed.approval_likelihood_formal || seed.approval_likelihood,
        },
      },
    })

    // Generate default phases
    const defaultPhases: Array<{ name: string; type: 'APPLICATION' | 'ACCOMMODATION' | 'TRAVEL' | 'ACTIVITIES' | 'REPORTING'; order: number; duration: number }> = [
      { name: 'Application Phase', type: 'APPLICATION', order: 1, duration: 7 },
      { name: 'Accommodation Booking', type: 'ACCOMMODATION', order: 2, duration: 3 },
      { name: 'Travel Arrangements', type: 'TRAVEL', order: 3, duration: 2 },
      { name: 'Activities Planning', type: 'ACTIVITIES', order: 4, duration: 1 },
      { name: 'Final Reporting', type: 'REPORTING', order: 5, duration: 1 },
    ]

    // Calculate phase dates
    let phaseStartDate = new Date(startDate)
    for (const phaseTemplate of defaultPhases) {
      const phaseEndDate = new Date(phaseStartDate)
      phaseEndDate.setDate(phaseEndDate.getDate() + phaseTemplate.duration)

      await tx.phase.create({
        data: {
          project_id: newProject.id,
          name: phaseTemplate.name,
          type: phaseTemplate.type,
          status: 'NOT_STARTED',
          start_date: phaseStartDate,
          end_date: phaseEndDate,
          deadline: phaseEndDate,
          budget_allocated: 0, // User will allocate budget
          budget_spent: 0,
          order: phaseTemplate.order,
          dependencies: [],
          editable: true,
          skippable: true,
        },
      })

      // Next phase starts after previous ends
      phaseStartDate = new Date(phaseEndDate)
    }

    return newProject
  })

  return { project }
}
