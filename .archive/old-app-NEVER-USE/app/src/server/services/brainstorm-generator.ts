import prisma from '@/lib/prisma'
import { inngest } from '@/inngest/client'
import type { BrainstormInput } from '@/lib/types/brainstorm'

/**
 * Create brainstorm session and trigger background generation
 */
export async function generateBrainstormSession(
  input: BrainstormInput,
  tenantId: string,
  userId: string
) {
  // Create session record
  const session = await prisma.brainstormSession.create({
    data: {
      tenantId,
      userId,
      prompt: input.prompt,
      creativityTemp: input.creativityTemp || 0.9,
      seedCount: input.seedCount || 10,
      generationStatus: 'IN_PROGRESS',
      aiModel: 'gpt-4-turbo-preview',
    },
  })

  // Trigger Inngest background job
  await inngest.send({
    name: 'brainstorm.generate-seeds',
    data: {
      sessionId: session.id,
      tenantId,
      userId,
    },
  })

  return { sessionId: session.id }
}

/**
 * Get generation status for polling
 */
export async function getBrainstormStatus(
  sessionId: string,
  tenantId: string
) {
  const session = await prisma.brainstormSession.findFirst({
    where: {
      id: sessionId,
      tenantId, // Multi-tenancy check
    },
    include: {
      seeds: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!session) {
    throw new Error('Session not found')
  }

  return {
    status: session.generationStatus,
    seeds: session.seeds,
    sessionId: session.id,
  }
}
