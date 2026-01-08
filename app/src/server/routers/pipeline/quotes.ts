import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelineQuotesRouter = router({
  // List quotes for a phase
  list: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify phase ownership through project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const quotes = await ctx.prisma.quote.findMany({
        where: {
          phaseId: input.phaseId,
        },
        include: {
          vendor: true,
        },
        orderBy: {
          receivedAt: 'desc',
        },
      })

      return quotes
    }),

  // Get a single quote by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
        },
        include: {
          vendor: true,
          phase: {
            include: {
              project: true,
            },
          },
        },
      })

      if (!quote || quote.phase.project.tenantId !== ctx.orgId) {
        throw new Error('Quote not found')
      }

      return quote
    }),

  // Create new quote
  create: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        vendorId: z.string().uuid(),
        amount: z.number(),
        currency: z.string().default('EUR'),
        validUntil: z.string().optional(),
        details: z.any().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify phase ownership
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Verify vendor ownership
      const vendor = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.vendorId,
          tenantId: ctx.orgId,
        },
      })

      if (!vendor) {
        throw new Error('Vendor not found')
      }

      const quote = await ctx.prisma.quote.create({
        data: {
          phaseId: input.phaseId,
          vendorId: input.vendorId,
          amount: input.amount,
          currency: input.currency,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          details: input.details,
          notes: input.notes,
        },
      })

      return quote
    }),

  // Update quote
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          amount: z.number().optional(),
          currency: z.string().optional(),
          validUntil: z.string().optional(),
          status: z.enum(['PENDING', 'RECEIVED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
          details: z.any().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
        },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
      })

      if (!existing || existing.phase.project.tenantId !== ctx.orgId) {
        throw new Error('Quote not found')
      }

      const quote = await ctx.prisma.quote.update({
        where: { id: input.id },
        data: {
          ...input.data,
          validUntil: input.data.validUntil ? new Date(input.data.validUntil) : undefined,
        },
      })

      return quote
    }),

  // Accept quote (and update phase budget)
  accept: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
        },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
      })

      if (!quote || quote.phase.project.tenantId !== ctx.orgId) {
        throw new Error('Quote not found')
      }

      // Update quote status
      const updatedQuote = await ctx.prisma.quote.update({
        where: { id: input.id },
        data: {
          status: 'ACCEPTED',
        },
      })

      // Update phase budget spent
      await ctx.prisma.pipelinePhase.update({
        where: { id: quote.phaseId },
        data: {
          budgetSpent: {
            increment: Number(quote.amount),
          },
        },
      })

      // Update project budget spent
      await ctx.prisma.pipelineProject.update({
        where: { id: quote.phase.projectId },
        data: {
          budgetSpent: {
            increment: Number(quote.amount),
          },
        },
      })

      return updatedQuote
    }),

  // Reject quote
  reject: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
        },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
      })

      if (!quote || quote.phase.project.tenantId !== ctx.orgId) {
        throw new Error('Quote not found')
      }

      const updated = await ctx.prisma.quote.update({
        where: { id: input.id },
        data: {
          status: 'REJECTED',
          notes: input.reason ? `Rejected: ${input.reason}` : quote.notes,
        },
      })

      return updated
    }),

  // Delete quote
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
        },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
      })

      if (!existing || existing.phase.project.tenantId !== ctx.orgId) {
        throw new Error('Quote not found')
      }

      await ctx.prisma.quote.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
