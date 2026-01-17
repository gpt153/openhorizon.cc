import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import {
  extractProgrammeRequirements,
  generateDailyStructure,
  generateDaySessions,
} from '@/lib/ai/chains/programme-generation'
// Removed invalid Prisma type import from '@prisma/client'

// ActivityType enum from Prisma schema
// Defined locally to avoid Prisma client generation issues
enum ActivityType {
  ICEBREAKER = 'ICEBREAKER',
  WORKSHOP = 'WORKSHOP',
  REFLECTION = 'REFLECTION',
  ENERGIZER = 'ENERGIZER',
  FREE_TIME = 'FREE_TIME',
  MEAL = 'MEAL',
  PRESENTATION = 'PRESENTATION',
  GROUP_WORK = 'GROUP_WORK',
  OUTDOOR = 'OUTDOOR',
  CULTURAL = 'CULTURAL',
}

/**
 * Generate Programme from Project Concept - Background Job
 *
 * This Inngest function runs in the background to generate detailed
 * day-by-day programmes with sessions, activities, and materials.
 */

export const generateProgramme = inngest.createFunction(
  {
    id: 'programme.generate-from-concept',
    name: 'Generate Programme from Project Concept',
  },
  { event: 'programme.generate-from-concept' },
  async ({ event, step }) => {
    const { projectId, tenantId, userId } = event.data

    // Step 1: Load project and concept
    const project = await step.run('load-project', async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      console.log(`📋 Loaded project: ${project.title}`)
      return project
    })

    // Step 2: Extract programme requirements from project DNA
    const requirements = await step.run('extract-requirements', async () => {
      console.log('🔍 Extracting programme requirements...')
      return extractProgrammeRequirements(project as any)
    })

    // Step 3: Generate daily themes and structure
    const dailyStructure = await step.run('generate-daily-structure', async () => {
      console.log('🏗️  Generating daily structure...')
      return await generateDailyStructure(requirements as any)
    })

    // Step 4: Generate detailed sessions for each day
    const allSessions = await step.run('generate-all-sessions', async () => {
      console.log('📅 Generating sessions for all days...')
      const sessions = []

      for (const day of dailyStructure) {
        const daySessions = await generateDaySessions(day, requirements as any)
        sessions.push({ dayNumber: day.day_number, sessions: daySessions })
      }

      return sessions
    })

    // Step 5: Save to database
    const programme = await step.run('save-programme', async () => {
      console.log('💾 Saving programme to database...')

      // Create programme with nested days and sessions
      return await prisma.programme.create({
        data: {
          projectId,
          tenantId,
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
    })

    console.log(`✅ Programme generated successfully: ${programme.id}`)
    return { programmeId: programme.id }
  }
)

/**
 * Parse time string from AI (e.g., "09:00") to DateTime for Prisma
 */
function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

/**
 * Normalize activity type string to enum value
 */
function normalizeActivityType(type: string): ActivityType | undefined {
  const normalized = type.toUpperCase().replace(/[\s-]/g, '_')

  const validTypes: ActivityType[] = [
    ActivityType.ICEBREAKER,
    ActivityType.WORKSHOP,
    ActivityType.REFLECTION,
    ActivityType.ENERGIZER,
    ActivityType.FREE_TIME,
    ActivityType.MEAL,
    ActivityType.PRESENTATION,
    ActivityType.GROUP_WORK,
    ActivityType.OUTDOOR,
    ActivityType.CULTURAL,
  ]

  return validTypes.find((t) => t === normalized)
}
