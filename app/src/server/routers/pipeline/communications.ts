import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelineCommunicationsRouter = router({
  // List communications for a project
  list: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        phaseId: z.string().uuid().optional(),
        vendorId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      const communications = await ctx.prisma.communication.findMany({
        where: {
          projectId: input.projectId,
          ...(input.phaseId && { phaseId: input.phaseId }),
          ...(input.vendorId && { vendorId: input.vendorId }),
        },
        include: {
          vendor: true,
          phase: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return communications
    }),

  // Get a single communication by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const communication = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          project: true,
          phase: true,
          vendor: true,
        },
      })

      if (!communication) {
        throw new Error('Communication not found')
      }

      return communication
    }),

  // Create new communication (draft email)
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        phaseId: z.string().uuid().optional(),
        vendorId: z.string().uuid().optional(),
        type: z.enum(['EMAIL', 'PHONE', 'OTHER']),
        subject: z.string().optional(),
        body: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      const communication = await ctx.prisma.communication.create({
        data: {
          tenantId: ctx.orgId,
          projectId: input.projectId,
          phaseId: input.phaseId,
          vendorId: input.vendorId,
          type: input.type,
          direction: 'OUTBOUND',
          subject: input.subject,
          body: input.body,
          status: 'DRAFT',
        },
      })

      return communication
    }),

  // Update communication
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          subject: z.string().optional(),
          body: z.string().optional(),
          status: z.enum(['DRAFT', 'SENT', 'DELIVERED', 'RESPONDED', 'FAILED']).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Communication not found')
      }

      const communication = await ctx.prisma.communication.update({
        where: { id: input.id },
        data: input.data,
      })

      return communication
    }),

  // Send email
  send: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const communication = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          vendor: true,
        },
      })

      if (!communication) {
        throw new Error('Communication not found')
      }

      if (!communication.vendor?.email) {
        throw new Error('Vendor email not found')
      }

      // TODO: Implement actual email sending with Resend
      // This will be implemented when we add the email service
      console.log('Sending email to:', communication.vendor.email)
      console.log('Subject:', communication.subject)
      console.log('Body:', communication.body)

      const updated = await ctx.prisma.communication.update({
        where: { id: input.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      return updated
    }),

  // Mark as responded
  markResponded: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const communication = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!communication) {
        throw new Error('Communication not found')
      }

      const updated = await ctx.prisma.communication.update({
        where: { id: input.id },
        data: {
          status: 'RESPONDED',
          responseReceivedAt: new Date(),
        },
      })

      return updated
    }),

  // Delete communication
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Communication not found')
      }

      await ctx.prisma.communication.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
