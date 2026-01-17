import type { PrismaClient, ProgrammeStatus } from '@prisma/client'

/**
 * Programme & Phase Fixtures
 *
 * Provides test data creation functions for:
 * - Programmes (detailed project timelines)
 * - Pipeline phases
 * - Programme days and sessions
 */

// =============================================================================
// PROGRAMME CREATION
// =============================================================================

export interface CreateProgrammeOptions {
  name?: string
  status?: ProgrammeStatus
  startDate?: Date
  endDate?: Date
}

/**
 * Create a test programme with days and sessions
 */
export async function createTestProgramme(
  prisma: PrismaClient,
  tenantId: string,
  projectId: string,
  options: CreateProgrammeOptions = {}
) {
  const {
    name = 'Test Programme',
    status = 'DRAFT',
    startDate = new Date('2024-06-01'),
    endDate = new Date('2024-06-07'),
  } = options

  // Create programme
  const programme = await prisma.programme.create({
    data: {
      tenantId,
      projectId,
      name,
      status,
      startDate,
      endDate,
      overallDescription: 'A comprehensive programme for the test project',
    },
  })

  // Create programme days (7-day programme)
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  for (let day = 1; day <= Math.min(durationDays + 1, 7); day++) {
    const programmeDay = await prisma.programmeDay.create({
      data: {
        programmeId: programme.id,
        dayNumber: day,
        date: new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000),
        theme: getDayTheme(day),
        morningFocus: `Morning activities for day ${day}`,
        afternoonFocus: `Afternoon activities for day ${day}`,
        eveningFocus: `Evening activities for day ${day}`,
      },
    })

    // Create sample sessions for each day
    await createDaySessions(prisma, programmeDay.id, day)
  }

  return programme
}

/**
 * Get theme for a programme day
 */
function getDayTheme(dayNumber: number): string {
  const themes = [
    'Arrival & Ice-breaking',
    'Getting to know each other',
    'Core Activities',
    'Workshops & Learning',
    'Cultural Exchange',
    'Project Work',
    'Reflection & Departure',
  ]
  return themes[dayNumber - 1] || 'Programme Activities'
}

/**
 * Create sessions for a programme day
 */
async function createDaySessions(
  prisma: PrismaClient,
  programmeDayId: string,
  dayNumber: number
) {
  const sessions = [
    {
      startTime: new Date('1970-01-01T09:00:00Z'),
      endTime: new Date('1970-01-01T10:30:00Z'),
      title: 'Morning Energizer',
      description: 'Wake-up activity to energize the group',
      activityType: 'ENERGIZER',
      orderIndex: 1,
    },
    {
      startTime: new Date('1970-01-01T11:00:00Z'),
      endTime: new Date('1970-01-01T13:00:00Z'),
      title: 'Main Workshop',
      description: 'Interactive learning workshop',
      activityType: 'WORKSHOP',
      orderIndex: 2,
    },
    {
      startTime: new Date('1970-01-01T14:00:00Z'),
      endTime: new Date('1970-01-01T16:00:00Z'),
      title: 'Group Work Session',
      description: 'Collaborative project work',
      activityType: 'GROUP_WORK',
      orderIndex: 3,
    },
    {
      startTime: new Date('1970-01-01T19:00:00Z'),
      endTime: new Date('1970-01-01T21:00:00Z'),
      title: 'Evening Reflection',
      description: 'Daily reflection and sharing circle',
      activityType: 'REFLECTION',
      orderIndex: 4,
    },
  ]

  for (const session of sessions) {
    await prisma.programmeSession.create({
      data: {
        programmeDayId,
        ...session,
        learningObjectives: ['Engage participants', 'Foster collaboration', 'Build skills'],
        materialsNeeded: ['Flipchart', 'Markers', 'Projector'],
        methodology: 'Non-formal education',
        groupSize: '20-30 participants',
      },
    })
  }
}

// =============================================================================
// PROGRAMME SCENARIOS
// =============================================================================

/**
 * Predefined programme scenarios
 */
export const PROGRAMME_SCENARIOS = {
  draftProgramme: {
    name: 'Draft Youth Exchange Programme',
    status: 'DRAFT' as ProgrammeStatus,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-10'),
  },
  publishedProgramme: {
    name: 'Published Training Course Programme',
    status: 'PUBLISHED' as ProgrammeStatus,
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-08-20'),
  },
}

// =============================================================================
// PIPELINE PROJECT & PHASES
// =============================================================================

/**
 * Create a pipeline project with phases (for vendor search tests)
 */
export async function createTestPipelineProject(
  prisma: PrismaClient,
  tenantId: string,
  createdByUserId: string = 'clerk_test_admin'
) {
  const project = await prisma.pipelineProject.create({
    data: {
      tenantId,
      createdByUserId,
      name: 'Test Pipeline Project',
      type: 'YOUTH_EXCHANGE',
      status: 'PLANNING',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-10'),
      description: 'Test project for pipeline and vendor search E2E tests',
    },
  })

  // Create phases
  const foodPhase = await prisma.pipelinePhase.create({
    data: {
      projectId: project.id,
      name: 'Food Planning',
      type: 'FOOD',
      startDate: new Date('2024-09-02'),
      endDate: new Date('2024-09-09'),
      budget: 3000,
      participants: 30,
      notes: 'Plan meals for 30 participants over 7 days',
    },
  })

  const accommodationPhase = await prisma.pipelinePhase.create({
    data: {
      projectId: project.id,
      name: 'Accommodation Planning',
      type: 'ACCOMMODATION',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-10'),
      budget: 5000,
      participants: 30,
      notes: 'Find accommodation for 30 participants',
    },
  })

  return { project, phases: { food: foodPhase, accommodation: accommodationPhase } }
}
