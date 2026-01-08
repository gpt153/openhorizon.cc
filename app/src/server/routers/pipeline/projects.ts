import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelineProjectsRouter = router({
  // List all pipeline projects for the organization
  list: orgProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.pipelineProject.findMany({
      where: {
        tenantId: ctx.orgId,
      },
      include: {
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return projects
  }),

  // Get a single pipeline project by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phases: {
            orderBy: {
              order: 'asc',
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
          },
          communications: true,
          aiConversations: true,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      return project
    }),

  // Create new pipeline project
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(['STUDENT_EXCHANGE', 'TRAINING', 'CONFERENCE', 'CUSTOM']),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        budgetTotal: z.number(),
        participantCount: z.number().int().positive(),
        location: z.string(),
        originCountry: z.string().optional(),
        hostCountry: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.pipelineProject.create({
        data: {
          tenantId: ctx.orgId,
          createdByUserId: ctx.userId,
          name: input.name,
          type: input.type,
          description: input.description,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          budgetTotal: input.budgetTotal,
          participantCount: input.participantCount,
          location: input.location,
          originCountry: input.originCountry,
          hostCountry: input.hostCountry,
        },
      })

      return project
    }),

  // Update pipeline project
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          budgetTotal: z.number().optional(),
          budgetSpent: z.number().optional(),
          participantCount: z.number().int().positive().optional(),
          location: z.string().optional(),
          originCountry: z.string().optional(),
          hostCountry: z.string().optional(),
          erasmusGrantCalculated: z.number().optional(),
          erasmusGrantActual: z.number().optional(),
          estimatedCosts: z.number().optional(),
          profitMargin: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Pipeline project not found')
      }

      const project = await ctx.prisma.pipelineProject.update({
        where: { id: input.id },
        data: {
          ...input.data,
          startDate: input.data.startDate ? new Date(input.data.startDate) : undefined,
          endDate: input.data.endDate ? new Date(input.data.endDate) : undefined,
        },
      })

      return project
    }),

  // Delete pipeline project
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Pipeline project not found')
      }

      await ctx.prisma.pipelineProject.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Calculate Erasmus+ grant for a project
  calculateGrant: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      // TODO: Implement Erasmus+ grant calculation logic
      // This will be implemented in Phase 3
      const calculatedGrant = 0

      const updated = await ctx.prisma.pipelineProject.update({
        where: { id: input.id },
        data: {
          erasmusGrantCalculated: calculatedGrant,
        },
      })

      return updated
    }),

  // Get profit summary for all projects
  getProfitSummary: orgProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.pipelineProject.findMany({
      where: {
        tenantId: ctx.orgId,
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        id: true,
        name: true,
        erasmusGrantCalculated: true,
        erasmusGrantActual: true,
        estimatedCosts: true,
        budgetSpent: true,
        profitMargin: true,
        status: true,
      },
    })

    const summary = {
      totalProjects: projects.length,
      totalGrantsCalculated: projects.reduce(
        (sum, p) => sum + (Number(p.erasmusGrantCalculated) || 0),
        0
      ),
      totalGrantsActual: projects.reduce(
        (sum, p) => sum + (Number(p.erasmusGrantActual) || 0),
        0
      ),
      totalEstimatedCosts: projects.reduce(
        (sum, p) => sum + (Number(p.estimatedCosts) || 0),
        0
      ),
      totalActualCosts: projects.reduce(
        (sum, p) => sum + (Number(p.budgetSpent) || 0),
        0
      ),
      estimatedProfit: 0,
      actualProfit: 0,
      projects,
    }

    summary.estimatedProfit = summary.totalGrantsCalculated - summary.totalEstimatedCosts
    summary.actualProfit = summary.totalGrantsActual - summary.totalActualCosts

    return summary
  }),
})
