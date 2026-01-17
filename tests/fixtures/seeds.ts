import type { PrismaClient } from '@prisma/client'

/**
 * Seed Fixtures
 *
 * Provides test data creation functions for:
 * - Brainstorm sessions
 * - Seeds (project ideas)
 * - Seed elaborations
 */

// =============================================================================
// BRAINSTORM SESSION CREATION
// =============================================================================

export interface CreateBrainstormSessionOptions {
  prompt?: string
  userId?: string
}

/**
 * Create a test brainstorm session
 */
export async function createTestBrainstormSession(
  prisma: PrismaClient,
  tenantId: string,
  options: CreateBrainstormSessionOptions = {}
) {
  const {
    prompt = 'I want to create a youth exchange project about environmental sustainability',
    userId = 'clerk_test_admin',
  } = options

  const session = await prisma.brainstormSession.create({
    data: {
      tenantId,
      userId,
      prompt,
      conversationHistory: [],
    },
  })

  return session
}

// =============================================================================
// SEED CREATION
// =============================================================================

export interface CreateSeedOptions {
  title?: string
  description?: string
  approvalLikelihood?: number
  isSaved?: boolean
  isDismissed?: boolean
  createdByUserId?: string
}

/**
 * Create a test seed (project idea)
 */
export async function createTestSeed(
  prisma: PrismaClient,
  tenantId: string,
  options: CreateSeedOptions = {}
) {
  const {
    title = 'Eco-Warriors Youth Exchange',
    description = 'A 7-day youth exchange bringing together young environmental activists from 4 countries to share best practices in sustainability and climate action.',
    approvalLikelihood = 0.75,
    isSaved = true,
    isDismissed = false,
    createdByUserId = 'clerk_test_admin',
  } = options

  // First create a brainstorm session
  const session = await createTestBrainstormSession(prisma, tenantId, {
    userId: createdByUserId,
  })

  // Then create the seed
  const seed = await prisma.seed.create({
    data: {
      sessionId: session.id,
      tenantId,
      userId: createdByUserId,
      title,
      description,
      approvalLikelihood,
      isSaved,
      isDismissed,
      titleFormal: `${title} - Erasmus+ KA1`,
      descriptionFormal: `${description} This project aims to foster intercultural dialogue and promote active citizenship among young Europeans through experiential learning and peer-to-peer exchange.`,
    },
  })

  return seed
}

/**
 * Create a seed with elaboration
 */
export async function createSeedWithElaboration(
  prisma: PrismaClient,
  tenantId: string,
  options: CreateSeedOptions = {}
) {
  const seed = await createTestSeed(prisma, tenantId, options)

  // Create elaboration
  const elaboration = await prisma.seedElaboration.create({
    data: {
      seedId: seed.id,
      tenantId,
      conversationHistory: [
        { role: 'user', content: 'Tell me more about the activities' },
        {
          role: 'assistant',
          content:
            'The exchange will include workshops on renewable energy, waste reduction campaigns, and cultural evenings to share sustainable practices from each country.',
        },
      ],
      currentSeedState: {
        ...seed,
        activities: [
          'Renewable energy workshop',
          'Waste reduction campaign design',
          'Sustainable cooking sessions',
          'Cultural exchange evenings',
        ],
      },
    },
  })

  return { seed, elaboration }
}

// =============================================================================
// SEED SCENARIOS
// =============================================================================

/**
 * Predefined seed scenarios for common test cases
 */
export const SEED_SCENARIOS = {
  savedSeed: {
    title: 'Digital Skills for Rural Youth',
    description:
      'A training course focused on teaching digital literacy and coding basics to young people from rural areas, bridging the digital divide.',
    approvalLikelihood: 0.8,
    isSaved: true,
    isDismissed: false,
  },
  dismissedSeed: {
    title: 'Extreme Sports Exchange',
    description:
      'A youth exchange centered around extreme sports like base jumping and cliff diving.',
    approvalLikelihood: 0.2,
    isSaved: false,
    isDismissed: true,
  },
  highPotentialSeed: {
    title: 'Social Inclusion Through Art',
    description:
      'An intercultural project using theater, music, and visual arts to promote social inclusion of young people with fewer opportunities.',
    approvalLikelihood: 0.9,
    isSaved: true,
    isDismissed: false,
  },
}

/**
 * Create multiple seeds for a tenant
 */
export async function createMultipleSeeds(
  prisma: PrismaClient,
  tenantId: string,
  count: number = 5,
  createdByUserId: string = 'clerk_test_admin'
) {
  const seeds = []

  for (let i = 1; i <= count; i++) {
    const seed = await createTestSeed(prisma, tenantId, {
      title: `Test Seed ${i}`,
      description: `This is test seed number ${i} for E2E testing purposes.`,
      approvalLikelihood: 0.5 + i * 0.05,
      isSaved: i % 2 === 0,
      createdByUserId,
    })

    seeds.push(seed)
  }

  return seeds
}
