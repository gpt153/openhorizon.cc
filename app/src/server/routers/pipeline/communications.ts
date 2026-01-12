import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { sendEmail, sendQuoteRequestEmail } from '@/lib/email/resend'
import { sendGridService } from '@/lib/email/sendgrid'
import { emailTemplateEngine } from '@/lib/email/templates'

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

  // Generate draft quote request emails for multiple vendors
  generateQuoteRequestDrafts: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        vendorIds: z.array(z.string().uuid()).min(1),
        requirements: z.string().optional(),
        budgetRange: z
          .object({
            min: z.number(),
            max: z.number(),
          })
          .optional(),
        deadline: z.string().datetime().optional(),
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

      // Get all vendors
      const vendors = await ctx.prisma.vendor.findMany({
        where: {
          id: { in: input.vendorIds },
          tenantId: ctx.orgId,
        },
      })

      if (vendors.length === 0) {
        throw new Error('No vendors found')
      }

      // Calculate nights
      const nights = Math.ceil(
        (phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Generate draft communications for each vendor
      const communications = await Promise.all(
        vendors.map(async (vendor) => {
          const template = emailTemplateEngine.renderQuoteRequest({
            vendorName: vendor.name,
            projectName: phase.project.name,
            phaseType: phase.type,
            location: phase.project.location,
            checkIn: phase.startDate,
            checkOut: phase.endDate,
            nights,
            participants: phase.project.participantCount,
            requirements: input.requirements,
            budgetRange: input.budgetRange,
            deadline: input.deadline ? new Date(input.deadline) : undefined,
            contactPerson: input.contactPerson,
            contactEmail: input.contactEmail,
          })

          return ctx.prisma.communication.create({
            data: {
              tenantId: ctx.orgId,
              projectId: phase.projectId,
              phaseId: input.phaseId,
              vendorId: vendor.id,
              type: 'EMAIL',
              direction: 'OUTBOUND',
              subject: template.subject,
              body: template.html,
              status: 'DRAFT',
            },
            include: {
              vendor: true,
            },
          })
        })
      )

      return {
        success: true,
        drafts: communications,
      }
    }),

  // Send quote requests (bulk) - send all draft or selected communications
  sendQuoteRequests: orgProcedure
    .input(
      z.object({
        communicationIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all communications
      const communications = await ctx.prisma.communication.findMany({
        where: {
          id: { in: input.communicationIds },
          tenantId: ctx.orgId,
          status: 'DRAFT',
          type: 'EMAIL',
        },
        include: {
          vendor: true,
          phase: true,
          project: true,
        },
      })

      if (communications.length === 0) {
        throw new Error('No draft communications found')
      }

      let sent = 0
      let failed = 0
      const results: Array<{ communicationId: string; success: boolean; error?: string }> = []

      // Send each email via SendGrid
      for (const comm of communications) {
        if (!comm.vendor?.email) {
          failed++
          results.push({
            communicationId: comm.id,
            success: false,
            error: 'Vendor has no email',
          })
          continue
        }

        if (!comm.subject || !comm.body) {
          failed++
          results.push({
            communicationId: comm.id,
            success: false,
            error: 'Communication missing subject or body',
          })
          continue
        }

        const emailResult = await sendGridService.sendQuoteRequest({
          to: comm.vendor.email,
          subject: comm.subject,
          html: comm.body,
          text: comm.body, // SendGrid service will convert HTML to text
          replyTo: comm.project.createdByUserId, // Should be actual user email
          communicationId: comm.id,
        })

        if (emailResult.success) {
          // Update communication as sent
          await ctx.prisma.communication.update({
            where: { id: comm.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              sendgridMessageId: emailResult.messageId,
            },
          })
          sent++
          results.push({
            communicationId: comm.id,
            success: true,
          })
        } else {
          // Mark as failed
          await ctx.prisma.communication.update({
            where: { id: comm.id },
            data: {
              status: 'FAILED',
            },
          })
          failed++
          results.push({
            communicationId: comm.id,
            success: false,
            error: emailResult.error,
          })
        }
      }

      return {
        success: true,
        total: communications.length,
        sent,
        failed,
        results,
      }
    }),

  // Get communication status with tracking info
  getStatus: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const communication = await ctx.prisma.communication.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!communication) {
        throw new Error('Communication not found')
      }

      return {
        ...communication,
        tracking: {
          sent: communication.sentAt,
          delivered: communication.deliveredAt,
          opened: communication.openedAt,
          openCount: communication.openCount,
          clickCount: communication.clickCount,
          bounced: communication.bouncedAt,
          bounceReason: communication.bounceReason,
          responded: communication.responseReceivedAt,
        },
      }
    }),

  // Schedule follow-up for pending communication
  scheduleFollowUp: orgProcedure
    .input(
      z.object({
        communicationId: z.string().uuid(),
        delayDays: z.number().min(1).max(30).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const communication = await ctx.prisma.communication.findFirst({
        where: {
          id: input.communicationId,
          tenantId: ctx.orgId,
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

      if (!communication) {
        throw new Error('Communication not found')
      }

      if (!communication.sentAt) {
        throw new Error('Cannot schedule follow-up for unsent communication')
      }

      if (!communication.vendor || !communication.phase) {
        throw new Error('Communication missing vendor or phase information')
      }

      // Generate follow-up template
      const template = emailTemplateEngine.renderFollowUp({
        vendorName: communication.vendor.name,
        projectName: communication.phase.project.name,
        originalDate: communication.sentAt,
        contactPerson: 'Open Horizon Team', // TODO: Get from user context
      })

      // Create follow-up communication as draft
      const followUp = await ctx.prisma.communication.create({
        data: {
          tenantId: ctx.orgId,
          projectId: communication.projectId,
          phaseId: communication.phaseId,
          vendorId: communication.vendorId,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: template.subject,
          body: template.html,
          status: 'DRAFT',
        },
      })

      return {
        success: true,
        followUpId: followUp.id,
      }
    }),
})
