import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

const createAlertSchema = z.object({
  projectId: z.string().uuid(),
  threshold: z.number().min(1).max(200),
  emailRecipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
})

const updateAlertSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    threshold: z.number().min(1).max(200).optional(),
    emailRecipients: z.array(z.string().email()).optional(),
    enabled: z.boolean().optional(),
  }),
})

export const alertsRouter = router({
  // List alerts for a project
  list: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      const alerts = await ctx.prisma.budgetAlert.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          threshold: 'asc',
        },
      })

      return alerts
    }),

  // Get single alert
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!alert || alert.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      return alert
    }),

  // Create alert
  create: orgProcedure
    .input(createAlertSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      const alert = await ctx.prisma.budgetAlert.create({
        data: {
          projectId: input.projectId,
          threshold: input.threshold,
          emailRecipients: input.emailRecipients,
        },
      })

      return alert
    }),

  // Update alert
  update: orgProcedure
    .input(updateAlertSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      const alert = await ctx.prisma.budgetAlert.update({
        where: { id: input.id },
        data: input.data,
      })

      return alert
    }),

  // Delete alert
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      await ctx.prisma.budgetAlert.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
