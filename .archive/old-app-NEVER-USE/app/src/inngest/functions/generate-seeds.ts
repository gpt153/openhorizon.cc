import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { generateSeeds } from '@/lib/ai/chains/seed-generation'
import type { BrainstormInput } from '@/lib/types/brainstorm'
import { validateSeedBatch } from '@/lib/utils/seed-quality-validator'

/**
 * Generate Seeds - Background Job
 *
 * Runs AI generation in background to avoid blocking the API.
 */
export const generateSeedsJob = inngest.createFunction(
  {
    id: 'brainstorm.generate-seeds',
    name: 'Generate Brainstorm Seeds',
  },
  { event: 'brainstorm.generate-seeds' },
  async ({ event, step }) => {
    const { sessionId, tenantId, userId } = event.data

    // Step 1: Load session
    const session = await step.run('load-session', async () => {
      const session = await prisma.brainstormSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        throw new Error(`Session ${sessionId} not found`)
      }

      return session
    })

    // Step 2: Generate seeds with AI
    const generatedSeeds = await step.run('generate-seeds', async () => {
      console.log('🌱 Generating seeds for session:', sessionId)

      const input: BrainstormInput = {
        prompt: session.prompt,
        creativityTemp: session.creativityTemp,
        seedCount: session.seedCount,
      }

      const seeds = await generateSeeds(input)

      // Validate seed quality (working vs formal mode contrast)
      const validation = validateSeedBatch(seeds)

      if (!validation.isValid) {
        console.warn('⚠️  Generated seeds have quality issues (see validation report above)')
      }

      return seeds
    })

    // Step 3: Save seeds to database
    await step.run('save-seeds', async () => {
      console.log(`💾 Saving ${generatedSeeds.length} seeds to database...`)

      const seedsData = generatedSeeds.map((seed) => ({
        sessionId: session.id,
        tenantId,
        userId,
        // Working mode
        title: seed.title,
        description: seed.description,
        approvalLikelihood: seed.approvalLikelihood,
        // Formal mode
        titleFormal: seed.titleFormal,
        descriptionFormal: seed.descriptionFormal,
        approvalLikelihoodFormal: seed.approvalLikelihoodFormal,
        // Store full seed as JSON
        currentVersion: seed as any,
      }))

      await prisma.seed.createMany({
        data: seedsData,
      })
    })

    // Step 4: Update session status
    await step.run('update-session', async () => {
      console.log('✅ Seeds generated successfully')

      await prisma.brainstormSession.update({
        where: { id: sessionId },
        data: {
          generationStatus: 'COMPLETED',
        },
      })
    })

    return { success: true, sessionId }
  }
)
