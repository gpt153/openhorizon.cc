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
