import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelinePhasesRouter = router({
  // List phases for a project
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
        throw new Error('Pipeline project not found')
      }

      const phases = await ctx.prisma.pipelinePhase.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          communications: true,
          quotes: {
            include: {
              vendor: true,
            },
          },
          aiConversations: true,
        },
        orderBy: {
          order: 'asc',
        },
      })

      return phases
    }),

  // Get a single phase by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
          communications: true,
          quotes: {
            include: {
              vendor: true,
            },
          },
          aiConversations: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      return phase
    }),

  // Create new phase
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        name: z.string().min(1),
        type: z.enum([
          'ACCOMMODATION',
          'TRAVEL',
          'FOOD',
          'ACTIVITIES',
          'INSURANCE',
          'EMERGENCY',
          'CUSTOM',
        ]),
        startDate: z.string(),
        endDate: z.string(),
        budgetAllocated: z.number(),
        order: z.number().int(),
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

      const phase = await ctx.prisma.pipelinePhase.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          type: input.type,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          budgetAllocated: input.budgetAllocated,
          order: input.order,
        },
      })

      return phase
    }),

  // Update phase
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          status: z
            .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'BLOCKED'])
            .optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          budgetAllocated: z.number().optional(),
          budgetSpent: z.number().optional(),
          order: z.number().int().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through project
      const existing = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const phase = await ctx.prisma.pipelinePhase.update({
        where: { id: input.id },
        data: {
          ...input.data,
          startDate: input.data.startDate ? new Date(input.data.startDate) : undefined,
          endDate: input.data.endDate ? new Date(input.data.endDate) : undefined,
        },
      })

      return phase
    }),

  // Delete phase
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through project
      const existing = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      await ctx.prisma.pipelinePhase.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Create default phases for a project
  createDefaultPhases: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
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

      // Calculate budget split (rough allocation)
      const totalBudget = Number(project.budgetTotal)
      const defaultPhases = [
        {
          name: 'Accommodation',
          type: 'ACCOMMODATION' as const,
          budgetPercent: 0.4, // 40%
          order: 1,
        },
        {
          name: 'Travel',
          type: 'TRAVEL' as const,
          budgetPercent: 0.25, // 25%
          order: 2,
        },
        {
          name: 'Food & Catering',
          type: 'FOOD' as const,
          budgetPercent: 0.2, // 20%
          order: 3,
        },
        {
          name: 'Activities',
          type: 'ACTIVITIES' as const,
          budgetPercent: 0.1, // 10%
          order: 4,
        },
        {
          name: 'Insurance',
          type: 'INSURANCE' as const,
          budgetPercent: 0.03, // 3%
          order: 5,
        },
        {
          name: 'Emergency Planning',
          type: 'EMERGENCY' as const,
          budgetPercent: 0.02, // 2%
          order: 6,
        },
      ]

      // Calculate phase duration
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)

      const phases = await Promise.all(
        defaultPhases.map((phaseTemplate) =>
          ctx.prisma.pipelinePhase.create({
            data: {
              projectId: input.projectId,
              name: phaseTemplate.name,
              type: phaseTemplate.type,
              startDate: startDate,
              endDate: endDate,
              budgetAllocated: totalBudget * phaseTemplate.budgetPercent,
              order: phaseTemplate.order,
            },
          })
        )
      )

      return phases
    }),
})
