import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { sendEmail, sendQuoteRequestEmail } from '@/lib/email/resend'

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

      if (!communication.subject || !communication.body) {
        throw new Error('Email must have subject and body')
      }

      // Send email via Resend
      const emailResult = await sendEmail({
        to: communication.vendor.email,
        subject: communication.subject,
        html: communication.body,
      })

      if (!emailResult.success) {
        // Mark as failed
        await ctx.prisma.communication.update({
          where: { id: input.id },
          data: {
            status: 'FAILED',
          },
        })
        throw new Error(emailResult.error || 'Failed to send email')
      }

      // Mark as sent
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

  // Compose and send quote request in one step
  sendQuoteRequest: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        vendorId: z.string().uuid(),
        requirements: z.string().optional(),
        contactPerson: z.string(),
        contactEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get phase with project
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

      // Get vendor
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.vendorId },
      })

      if (!vendor || !vendor.email) {
        throw new Error('Vendor not found or has no email')
      }

      // Send email
      const emailResult = await sendQuoteRequestEmail({
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        projectName: phase.project.name,
        phaseType: phase.type,
        location: phase.project.location,
        checkIn: phase.startDate,
        checkOut: phase.endDate,
        participants: phase.project.participantCount,
        requirements: input.requirements,
        contactPerson: input.contactPerson,
        contactEmail: input.contactEmail,
      })

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email')
      }

      // Store communication record
      const communication = await ctx.prisma.communication.create({
        data: {
          tenantId: ctx.orgId,
          projectId: phase.projectId,
          phaseId: input.phaseId,
          vendorId: input.vendorId,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: `Quote Request: ${phase.project.name} - ${phase.type}`,
          body: `Quote request sent to ${vendor.name} for ${phase.type}${
            input.requirements ? `\n\nRequirements: ${input.requirements}` : ''
          }\n\nContact: ${input.contactPerson} (${input.contactEmail})`,
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      return {
        success: true,
        communicationId: communication.id,
        messageId: emailResult.messageId,
      }
    }),
})
