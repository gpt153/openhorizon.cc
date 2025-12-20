import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { generateSeeds } from '@/lib/ai/chains/seed-generation'
import type { BrainstormInput } from '@/lib/types/brainstorm'

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

      return await generateSeeds(input)
    })

    // Step 3: Save seeds to database
    await step.run('save-seeds', async () => {
      console.log(`💾 Saving ${generatedSeeds.length} seeds to database...`)

      const seedsData = generatedSeeds.map((seed) => ({
        sessionId: session.id,
        tenantId,
        userId,
        title: seed.title,
        description: seed.description,
        approvalLikelihood: seed.approvalLikelihood,
        currentVersion: seed as any, // Store full seed as JSON
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
