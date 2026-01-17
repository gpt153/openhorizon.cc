import type { PrismaClient, ProjectStatus } from '@prisma/client'

/**
 * Project Fixtures
 *
 * Provides test data creation functions for projects with realistic DNA
 */

// =============================================================================
// PROJECT CREATION
// =============================================================================

export interface CreateProjectOptions {
  title?: string
  tagline?: string
  status?: ProjectStatus
  projectDna?: any
  createdByUserId?: string
  erasmusAction?: string
  durationDays?: number
  participantCount?: number
}

/**
 * Create a test project with realistic data
 */
export async function createTestProject(
  prisma: PrismaClient,
  tenantId: string,
  status: ProjectStatus = 'DRAFT',
  options: CreateProjectOptions = {}
) {
  const {
    title = `Test Project - ${status}`,
    tagline = 'A test project for E2E testing',
    projectDna = getDefaultProjectDna(),
    createdByUserId = 'clerk_test_admin',
    erasmusAction = 'KA1',
    durationDays = 7,
    participantCount = 30,
  } = options

  const project = await prisma.project.create({
    data: {
      tenantId,
      title,
      tagline,
      status,
      projectDna,
      createdByUserId,
      erasmusAction,
      durationDays,
      participantCount,
    },
  })

  return project
}

/**
 * Get default project DNA for testing
 */
function getDefaultProjectDna() {
  return {
    projectType: 'youth-exchange',
    theme: 'environmental-sustainability',
    ageRange: { min: 18, max: 25 },
    location: {
      country: 'Spain',
      city: 'Barcelona',
      type: 'urban',
    },
    duration: 7,
    participants: {
      total: 30,
      countries: ['Spain', 'Germany', 'France', 'Poland'],
    },
    activities: [
      'Workshops on sustainability',
      'Team-building exercises',
      'Cultural exchange activities',
      'Project presentations',
    ],
    objectives: [
      'Promote environmental awareness',
      'Foster intercultural dialogue',
      'Develop youth leadership skills',
    ],
    budget: {
      estimated: 15000,
      currency: 'EUR',
    },
  }
}

// =============================================================================
// PROJECT SCENARIOS
// =============================================================================

/**
 * Predefined project scenarios for common test cases
 */
export const PROJECT_SCENARIOS = {
  draftProject: {
    title: 'Draft Youth Exchange Project',
    status: 'DRAFT' as ProjectStatus,
    projectDna: {
      projectType: 'youth-exchange',
      theme: 'digital-skills',
      ageRange: { min: 16, max: 20 },
      location: { country: 'Portugal', city: 'Lisbon', type: 'urban' },
      duration: 10,
      participants: { total: 25, countries: ['Portugal', 'Italy', 'Greece'] },
    },
  },
  conceptProject: {
    title: 'Concept Training Course',
    status: 'CONCEPT' as ProjectStatus,
    projectDna: {
      projectType: 'training-course',
      theme: 'social-inclusion',
      ageRange: { min: 20, max: 30 },
      location: { country: 'Germany', city: 'Berlin', type: 'urban' },
      duration: 5,
      participants: { total: 20, countries: ['Germany', 'Poland', 'Czech Republic'] },
    },
  },
  planningProject: {
    title: 'Planning Strategic Partnership',
    status: 'PLANNING' as ProjectStatus,
    projectDna: {
      projectType: 'strategic-partnership',
      theme: 'entrepreneurship',
      ageRange: { min: 18, max: 35 },
      location: { country: 'France', city: 'Paris', type: 'urban' },
      duration: 365,
      participants: { total: 100, countries: ['France', 'Spain', 'Belgium', 'Netherlands'] },
    },
  },
}

/**
 * Create a project with full generated content (objectives, learning outcomes, etc.)
 */
export async function createFullProject(
  prisma: PrismaClient,
  tenantId: string,
  status: ProjectStatus = 'CONCEPT',
  createdByUserId: string = 'clerk_test_admin'
) {
  const project = await prisma.project.create({
    data: {
      tenantId,
      title: 'Full Featured Test Project',
      tagline: 'Complete project with all fields populated',
      status,
      createdByUserId,
      erasmusAction: 'KA1',
      durationDays: 10,
      participantCount: 30,
      projectDna: getDefaultProjectDna(),
      objectives: [
        'Develop intercultural competencies among young people',
        'Promote sustainable practices in daily life',
        'Build lasting partnerships between organizations',
      ],
      targetGroupDescription:
        'Young people aged 18-25 from urban areas interested in environmental sustainability',
      activityOutline: [
        { day: 1, title: 'Arrival and Ice-breaking', description: 'Welcome activities' },
        { day: 2, title: 'Sustainability Workshop', description: 'Interactive learning session' },
        { day: 3, title: 'City Tour', description: 'Explore local green initiatives' },
      ],
      learningOutcomes: [
        'Understand principles of environmental sustainability',
        'Ability to collaborate in multicultural teams',
        'Knowledge of Erasmus+ program opportunities',
      ],
      inclusionPlanOverview:
        'The project ensures accessibility for participants with disabilities through adapted venues and materials.',
      partnerProfile:
        'We seek organizations with experience in youth work and environmental education.',
      estimatedBudgetRange: { min: 12000, max: 18000, currency: 'EUR' },
      sustainabilityNarrative:
        'All activities promote eco-friendly practices and long-term environmental awareness.',
      impactNarrative:
        'Participants will become ambassadors of sustainability in their local communities.',
    },
  })

  return project
}

/**
 * Create multiple projects for a tenant
 */
export async function createMultipleProjects(
  prisma: PrismaClient,
  tenantId: string,
  count: number = 5,
  createdByUserId: string = 'clerk_test_admin'
) {
  const projects = []

  for (let i = 1; i <= count; i++) {
    const status: ProjectStatus =
      i % 3 === 0 ? 'CONCEPT' : i % 2 === 0 ? 'PLANNING' : 'DRAFT'

    const project = await createTestProject(prisma, tenantId, status, {
      title: `Test Project ${i}`,
      createdByUserId,
    })

    projects.push(project)
  }

  return projects
}
