import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import {
  extractProgrammeRequirements,
  generateDailyStructure,
  generateDaySessions,
} from '@/lib/ai/chains/programme-generation'
import type { ActivityType } from '@prisma/client'

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

      // Generate programme synchronously (MVP - no background job)
      console.log('🔍 Extracting programme requirements...')
      const requirements = extractProgrammeRequirements(project as any)

      console.log('🏗️  Generating daily structure...')
      const dailyStructure = await generateDailyStructure(requirements)

      console.log('📅 Generating sessions for all days...')
      const allSessions: Array<{ dayNumber: number; sessions: any[] }> = []
      for (const day of dailyStructure) {
        const daySessions = await generateDaySessions(day, requirements)
        allSessions.push({ dayNumber: day.day_number, sessions: daySessions })
      }

      console.log('💾 Saving programme to database...')
      const programme = await ctx.prisma.programme.create({
        data: {
          projectId: input.projectId,
          tenantId: ctx.orgId,
          version: 1,
          status: 'DRAFT',
          generatedFromConcept: {
            projectTitle: project.title,
            durationDays: project.durationDays,
            generatedAt: new Date().toISOString(),
          } as any,
          aiModel: 'gpt-4-turbo-preview',

          days: {
            create: dailyStructure.map((day, dayIndex) => {
              const daySessions = allSessions.find(
                (s) => s.dayNumber === day.day_number
              )?.sessions || []

              return {
                dayNumber: day.day_number,
                theme: day.theme,
                morningFocus: day.morning_focus,
                afternoonFocus: day.afternoon_focus,
                eveningFocus: day.evening_focus,

                sessions: {
                  create: daySessions.map((session, sessionIndex) => ({
                    startTime: parseTimeString(session.start_time),
                    endTime: parseTimeString(session.end_time),
                    title: session.title,
                    description: session.description,
                    activityType: normalizeActivityType(session.activity_type),
                    learningObjectives: session.learning_objectives,
                    methodology: session.methodology,
                    materialsNeeded: session.materials_needed,
                    preparationNotes: session.preparation_notes,
                    spaceRequirements: session.space_requirements,
                    groupSize: session.group_size,
                    accessibilityNotes: session.accessibility_notes,
                    languageLevel: session.language_level,
                    orderIndex: sessionIndex,
                    isOptional: false,
                  })),
                },
              }
            }),
          },
        },
        include: {
          days: {
            include: {
              sessions: true,
            },
          },
        },
      })

      console.log(`✅ Programme generated successfully: ${programme.id}`)
      return { success: true, message: 'Programme generated successfully', programmeId: programme.id }
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
function parseTimeString(timeStr: string | undefined): Date {
  // Handle missing or invalid time strings with default 09:00
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    console.warn(`Invalid time string: ${timeStr}, using default 09:00`)
    const date = new Date()
    date.setHours(9, 0, 0, 0)
    return date
  }

  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours || 9, minutes || 0, 0, 0)
  return date
}

/**
 * Normalize activity type string to enum value
 */
function normalizeActivityType(type: string): ActivityType | undefined {
  const normalized = type.toUpperCase().replace(/[\s-]/g, '_')

  const validTypes: ActivityType[] = [
    'ICEBREAKER',
    'WORKSHOP',
    'REFLECTION',
    'ENERGIZER',
    'FREE_TIME',
    'MEAL',
    'PRESENTATION',
    'GROUP_WORK',
    'OUTDOOR',
    'CULTURAL',
    'INTERCULTURAL',
    'CREATIVE',
    'SPORTS',
    'DISCUSSION',
  ]

  return validTypes.find((t) => t === normalized)
}
