import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { calculateErasmusGrant, calculateProfitMargin } from '@/lib/erasmus/income-calculator'

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

      // Calculate activity days (total days minus 2 travel days)
      const totalDays = Math.ceil(
        (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const activityDays = Math.max(1, totalDays - 2)

      // Calculate Erasmus+ grant
      const grantBreakdown = calculateErasmusGrant({
        hostCountryCode: project.hostCountry || 'ES', // Default to Spain if not set
        participantCount: project.participantCount,
        activityDays,
        travelDays: 2,
        originCity: project.originCountry || 'Stockholm', // Default
        destinationCity: project.location || 'Barcelona', // Use location as city
      })

      // Calculate estimated costs from phases
      const phases = await ctx.prisma.pipelinePhase.findMany({
        where: { projectId: input.id },
      })

      const estimatedCosts = phases.reduce(
        (sum, phase) => sum + Number(phase.budgetAllocated),
        0
      )

      // Calculate profit margin
      const profitDetails = calculateProfitMargin(
        grantBreakdown.totalGrant,
        estimatedCosts
      )

      // Update project with calculations
      const updated = await ctx.prisma.pipelineProject.update({
        where: { id: input.id },
        data: {
          erasmusGrantCalculated: grantBreakdown.totalGrant,
          estimatedCosts,
          profitMargin: profitDetails.profitPercentage,
          metadata: {
            grantBreakdown: grantBreakdown as any,
            profitDetails: profitDetails as any,
          },
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

  // Get budget summary with trend data
  getBudgetSummary: orgProcedure
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
          },
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      // Get expenses for trend data
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          projectId: input.id,
        },
        orderBy: {
          date: 'asc',
        },
      })

      // Calculate budget health
      const totalBudget = Number(project.budgetTotal) || 0
      const totalSpent = Number(project.budgetSpent) || 0
      const totalRemaining = totalBudget - totalSpent
      const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OVER_BUDGET' = 'HEALTHY'
      let message = 'Budget is within healthy limits'
      let colorClass = 'text-green-600'
      let progressColor = 'bg-green-600'

      if (percentage >= 100) {
        status = 'OVER_BUDGET'
        message = 'Budget exceeded!'
        colorClass = 'text-red-600'
        progressColor = 'bg-red-600'
      } else if (percentage >= 90) {
        status = 'CRITICAL'
        message = 'Budget critically low'
        colorClass = 'text-red-600'
        progressColor = 'bg-red-600'
      } else if (percentage >= 75) {
        status = 'WARNING'
        message = 'Budget running low'
        colorClass = 'text-yellow-600'
        progressColor = 'bg-yellow-600'
      }

      // Calculate spending trend data
      const trendData = expenses.reduce((acc: any[], expense) => {
        const dateStr = new Date(expense.date).toISOString().split('T')[0]
        const existingEntry = acc.find((e) => e.date === dateStr)

        if (existingEntry) {
          existingEntry.spending += Number(expense.amount)
        } else {
          const previousCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
          acc.push({
            date: dateStr,
            spending: Number(expense.amount),
            cumulative: previousCumulative + Number(expense.amount),
          })
        }

        return acc
      }, [])

      // Update cumulative values
      let cumulative = 0
      trendData.forEach((entry) => {
        cumulative += entry.spending
        entry.cumulative = cumulative
      })

      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        health: {
          status,
          percentage,
          message,
          colorClass,
          progressColor,
        },
        phases: project.phases.map((phase) => ({
          id: phase.id,
          name: phase.name,
          type: phase.type,
          allocated: Number(phase.budgetAllocated) || 0,
          spent: Number(phase.budgetSpent) || 0,
          remaining: Number(phase.budgetAllocated) - Number(phase.budgetSpent),
          percentage:
            Number(phase.budgetAllocated) > 0
              ? (Number(phase.budgetSpent) / Number(phase.budgetAllocated)) * 100
              : 0,
        })),
        trendData,
      }
    }),
})
