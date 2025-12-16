import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import type { UserIdeaInputs } from '@/lib/types/project'

/**
 * Project Generation Service
 *
 * Orchestrates the project generation flow:
 * 1. Creates a generation session record
 * 2. Triggers Inngest background job for AI processing
 * 3. Returns session ID for status polling
 */

export async function generateProjectFromIdea(
  userInputs: UserIdeaInputs,
  tenantId: string,
  userId: string
): Promise<{ sessionId: string }> {
  // Create generation session record
  const session = await prisma.projectGenerationSession.create({
    data: {
      tenantId,
      userId,
      sessionData: userInputs as any, // Prisma Json type
      aiModel: 'gpt-4-turbo-preview',
      generationStatus: 'IN_PROGRESS',
    },
  })

  // Trigger background job
  await inngest.send({
    name: 'project.generate-from-idea',
    data: {
      sessionId: session.id,
      tenantId,
      userId,
    },
  })

  return { sessionId: session.id }
}

/**
 * Get generation status
 *
 * Polls the generation session to check progress and retrieve
 * the completed project if generation succeeded.
 */

export async function getGenerationStatus(
  sessionId: string,
  tenantId: string
): Promise<{
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  project?: any
  error?: string
}> {
  const session = await prisma.projectGenerationSession.findFirst({
    where: {
      id: sessionId,
      tenantId, // Multi-tenancy check
    },
    include: {
      project: true,
    },
  })

  if (!session) {
    throw new Error('Generation session not found')
  }

  return {
    status: session.generationStatus as 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    project: session.project || undefined,
    error: undefined, // TODO: Store error messages in session
  }
}
