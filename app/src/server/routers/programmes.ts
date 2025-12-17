import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { inngest } from '@/inngest/client'

export const programmesRouter = router({
  // Generate programme from project concept
  generateFromConcept: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and belongs to user's org
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found or unauthorized')
      }

      // Check if programme already exists
      const existingProgramme = await ctx.prisma.programme.findFirst({
        where: {
          projectId: input.projectId,
          status: { not: 'ARCHIVED' },
        },
      })

      if (existingProgramme) {
        throw new Error('Programme already exists. Archive it first to regenerate.')
      }

      // Trigger background generation
      await inngest.send({
        name: 'programme.generate-from-concept',
        data: {
          projectId: input.projectId,
          tenantId: ctx.orgId,
          userId: ctx.userId,
        },
      })

      return { success: true, message: 'Programme generation started' }
    }),

  // Get programme by project ID
  getByProjectId: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const programme = await ctx.prisma.programme.findFirst({
        where: {
          projectId: input.projectId,
          tenantId: ctx.orgId,
        },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              sessions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      })

      return programme
    }),

  // Update session
  updateSession: orgProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          learningObjectives: z.array(z.string()).optional(),
          materialsNeeded: z.array(z.string()).optional(),
          preparationNotes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user's org (through programme -> project -> tenant)
      const session = await ctx.prisma.programmeSession.findFirst({
        where: {
          id: input.sessionId,
          day: {
            programme: {
              tenantId: ctx.orgId,
            },
          },
        },
      })

      if (!session) {
        throw new Error('Session not found or unauthorized')
      }

      // Convert time strings to Date objects if provided
      const updateData: any = { ...input.data }
      if (input.data.startTime) {
        updateData.startTime = parseTimeString(input.data.startTime)
      }
      if (input.data.endTime) {
        updateData.endTime = parseTimeString(input.data.endTime)
      }

      return await ctx.prisma.programmeSession.update({
        where: { id: input.sessionId },
        data: updateData,
      })
    }),

  // Delete programme
  deleteProgramme: orgProcedure
    .input(
      z.object({
        programmeId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify programme belongs to user's org
      const programme = await ctx.prisma.programme.findFirst({
        where: {
          id: input.programmeId,
          tenantId: ctx.orgId,
        },
      })

      if (!programme) {
        throw new Error('Programme not found or unauthorized')
      }

      // Delete will cascade to days and sessions
      await ctx.prisma.programme.delete({
        where: { id: input.programmeId },
      })

      return { success: true }
    }),
})

/**
 * Parse time string (e.g., "09:00") to DateTime for Prisma
 */
function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}
