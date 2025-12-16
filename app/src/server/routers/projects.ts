import { router, orgProcedure } from '../trpc'
import { z } from 'zod'
import { UserIdeaInputsSchema } from '@/lib/schemas/project-wizard'
import { generateProjectFromIdea, getGenerationStatus } from '../services/project-generator'

export const projectsRouter = router({
  // Get all projects for the current organization
  list: orgProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.project.findMany({
      where: {
        tenantId: ctx.orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return projects
  }),

  // Get a single project by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      return project
    }),

  // Generate project from idea (triggers AI background job)
  generateFromIdea: orgProcedure
    .input(UserIdeaInputsSchema)
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = await generateProjectFromIdea(
        input,
        ctx.orgId,
        ctx.userId
      )

      return { sessionId }
    }),

  // Get generation status (poll this to check progress)
  getGenerationStatus: orgProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await getGenerationStatus(input.sessionId, ctx.orgId)
    }),

  // Update project fields
  updateProject: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          title: z.string().optional(),
          tagline: z.string().optional(),
          targetGroupDescription: z.string().optional(),
          inclusionPlanOverview: z.string().optional(),
          partnerProfile: z.string().optional(),
          sustainabilityNarrative: z.string().optional(),
          impactNarrative: z.string().optional(),
          status: z.enum(['DRAFT', 'CONCEPT', 'PLANNING', 'APPLICATION_DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId, // Multi-tenancy check
        },
        data: input.data,
      })

      if (project.count === 0) {
        throw new Error('Project not found or unauthorized')
      }

      return { success: true }
    }),

  // Delete project
  deleteProject: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.deleteMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId, // Multi-tenancy check
        },
      })

      if (project.count === 0) {
        throw new Error('Project not found or unauthorized')
      }

      return { success: true }
    }),
})
