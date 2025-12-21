import { router, orgProcedure } from '../trpc'
import { z } from 'zod'
import { BrainstormInputSchema, SeedElaborationInputSchema } from '@/lib/schemas/brainstorm'
import { generateBrainstormSession, getBrainstormStatus } from '../services/brainstorm-generator'
import { elaborateSeed } from '@/lib/ai/chains/seed-elaboration'
import type { ElaborationMessage } from '@/lib/types/brainstorm'

export const brainstormRouter = router({
  // Generate new brainstorm session
  generate: orgProcedure
    .input(BrainstormInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = await generateBrainstormSession(
        input,
        ctx.orgId,
        ctx.userId
      )

      return { sessionId }
    }),

  // Get generation status (for polling)
  getStatus: orgProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await getBrainstormStatus(input.sessionId, ctx.orgId)
    }),

  // List all saved seeds
  listSavedSeeds: orgProcedure.query(async ({ ctx }) => {
    const seeds = await ctx.prisma.seed.findMany({
      where: {
        tenantId: ctx.orgId,
        userId: ctx.userId,
        isSaved: true,
        isDismissed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return seeds
  }),

  // Get single seed by ID
  getSeedById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const seed = await ctx.prisma.seed.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          elaborations: true,
        },
      })

      if (!seed) {
        throw new Error('Seed not found')
      }

      return seed
    }),

  // Save a seed
  saveSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.seed.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: {
          isSaved: true,
        },
      })

      if (updated.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),

  // Dismiss a seed
  dismissSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.seed.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: {
          isDismissed: true,
        },
      })

      if (updated.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),

  // Elaborate seed with conversation
  elaborate: orgProcedure
    .input(SeedElaborationInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Load seed
      const seed = await ctx.prisma.seed.findFirst({
        where: {
          id: input.seedId,
          tenantId: ctx.orgId,
        },
        include: {
          elaborations: true,
        },
      })

      if (!seed) {
        throw new Error('Seed not found')
      }

      // Get or create elaboration
      let elaboration = seed.elaborations[0]
      if (!elaboration) {
        elaboration = await ctx.prisma.seedElaboration.create({
          data: {
            seedId: seed.id,
            tenantId: ctx.orgId,
            conversationHistory: [],
            currentSeedState: seed.currentVersion || {
              title: seed.title,
              description: seed.description,
              approvalLikelihood: seed.approvalLikelihood,
            },
          },
        })
      }

      // Run AI elaboration
      const currentSeed = elaboration.currentSeedState as any
      const history = elaboration.conversationHistory as unknown as ElaborationMessage[]

      const response = await elaborateSeed(
        currentSeed,
        history,
        input.userMessage
      )

      // Update conversation history
      const updatedHistory = [
        ...history,
        {
          role: 'user' as const,
          content: input.userMessage,
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
      await ctx.prisma.seedElaboration.update({
        where: { id: elaboration.id },
        data: {
          conversationHistory: updatedHistory as any,
          currentSeedState: response.updatedSeed as any,
        },
      })

      // Update seed with both working and formal versions
      await ctx.prisma.seed.update({
        where: { id: seed.id },
        data: {
          currentVersion: response.updatedSeed as any,
          // Working mode
          title: response.updatedSeed.title,
          description: response.updatedSeed.description,
          approvalLikelihood: response.updatedApprovalLikelihood,
          // Formal mode
          titleFormal: response.updatedSeed.titleFormal,
          descriptionFormal: response.updatedSeed.descriptionFormal,
          approvalLikelihoodFormal: response.updatedApprovalLikelihoodFormal,
          elaborationCount: { increment: 1 },
        },
      })

      return response
    }),

  // Delete a seed
  deleteSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.seed.deleteMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (deleted.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),
})
