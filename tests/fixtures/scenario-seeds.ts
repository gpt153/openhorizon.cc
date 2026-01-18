import type { PrismaClient } from '@prisma/client'

/**
 * Test Fixtures: E2E Scenario Seeds
 *
 * Provides complete seed data for 5 different Erasmus+ project scenarios
 * to test the full seed elaboration → project generation flow.
 *
 * Part of Epic 001: Seed Elaboration Validation
 * Related: Issue #177 (E2E Testing - Various Project Scenarios)
 */

export interface Activity {
  id: string
  name: string
  type: 'workshop' | 'cultural_visit' | 'team_building' | 'reflection' | 'cooking_workshop' | 'public_event' | 'other'
  duration: number // hours
  isOutdoor: boolean
  requiresFacilitator: boolean
  description?: string
}

export interface ScenarioSeedData {
  title: string
  description: string
  participants: number
  duration: number
  budget: number
  destination: string
  destinationCountry: string
  participantCountries: string[]
  activities: Activity[]
  hasWorkshops: boolean
  tags: string[]
}

// =============================================================================
// SCENARIO 1: SMALL PROJECT (Germany)
// =============================================================================

export const SCENARIO_SMALL_PROJECT: ScenarioSeedData = {
  title: 'Youth Leadership Weekend',
  description: 'A short youth exchange focused on leadership skills development for young people from neighboring European countries',
  participants: 20,
  duration: 5,
  budget: 10000,
  destination: 'Berlin, Germany',
  destinationCountry: 'DE',
  participantCountries: ['FR', 'NL', 'BE'],
  activities: [
    {
      id: 'act-1',
      name: 'Leadership Workshop',
      type: 'workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Interactive leadership training session'
    },
    {
      id: 'act-2',
      name: 'Team Building Activities',
      type: 'team_building',
      duration: 2,
      isOutdoor: true,
      requiresFacilitator: true,
      description: 'Outdoor team challenges and trust exercises'
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'leadership', 'erasmus+']
}

// =============================================================================
// SCENARIO 2: LARGE PROJECT (Spain)
// =============================================================================

export const SCENARIO_LARGE_PROJECT: ScenarioSeedData = {
  title: 'Mediterranean Cultural Exchange',
  description: 'A comprehensive two-week exchange exploring Mediterranean cultures, traditions, and contemporary challenges',
  participants: 60,
  duration: 14,
  budget: 50000,
  destination: 'Barcelona, Spain',
  destinationCountry: 'ES',
  participantCountries: ['IT', 'GR', 'FR', 'PT', 'HR'],
  activities: [
    {
      id: 'act-1',
      name: 'Cultural Workshops',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Deep dive into Mediterranean cultural heritage'
    },
    {
      id: 'act-2',
      name: 'Mediterranean Cooking Class',
      type: 'cooking_workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Traditional cooking from different Mediterranean countries'
    },
    {
      id: 'act-3',
      name: 'Historical City Tour',
      type: 'cultural_visit',
      duration: 4,
      isOutdoor: true,
      requiresFacilitator: false,
      description: 'Guided tour of Barcelona historical sites'
    },
    {
      id: 'act-4',
      name: 'Public Cultural Evening',
      type: 'public_event',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Public showcase of participants cultural presentations'
    },
    {
      id: 'act-5',
      name: 'Beach Team Building',
      type: 'team_building',
      duration: 3,
      isOutdoor: true,
      requiresFacilitator: true,
      description: 'Beach activities and team challenges'
    },
    {
      id: 'act-6',
      name: 'Reflection Sessions',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Group reflection on learning outcomes'
    },
    {
      id: 'act-7',
      name: 'Final Presentation',
      type: 'public_event',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: false,
      description: 'Final presentation of project results'
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'culture', 'mediterranean', 'erasmus+']
}

// =============================================================================
// SCENARIO 3: LONG-DISTANCE TRAVEL (Morocco)
// =============================================================================

export const SCENARIO_LONG_DISTANCE: ScenarioSeedData = {
  title: 'Euro-Mediterranean Dialogue',
  description: 'Cross-cultural exchange between European and Moroccan youth focusing on intercultural dialogue and understanding',
  participants: 30,
  duration: 10,
  budget: 35000,
  destination: 'Marrakech, Morocco',
  destinationCountry: 'MA',
  participantCountries: ['ES', 'FR', 'IT', 'DE'],
  activities: [
    {
      id: 'act-1',
      name: 'Intercultural Workshop',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Exploring cultural differences and similarities'
    },
    {
      id: 'act-2',
      name: 'Medina Cultural Visit',
      type: 'cultural_visit',
      duration: 3,
      isOutdoor: true,
      requiresFacilitator: true,
      description: 'Guided tour of Marrakech Medina'
    },
    {
      id: 'act-3',
      name: 'Traditional Cooking Workshop',
      type: 'cooking_workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Learning traditional Moroccan cooking'
    },
    {
      id: 'act-4',
      name: 'Reflection Circle',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Reflecting on intercultural learning'
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'intercultural', 'morocco', 'erasmus+']
}

// =============================================================================
// SCENARIO 4: WORKSHOP-HEAVY PROGRAM (Netherlands)
// =============================================================================

export const SCENARIO_WORKSHOP_HEAVY: ScenarioSeedData = {
  title: 'Digital Skills Training Course',
  description: 'Intensive training program on digital competencies with multiple workshop sessions covering web development, marketing, and data skills',
  participants: 40,
  duration: 7,
  budget: 25000,
  destination: 'Amsterdam, Netherlands',
  destinationCountry: 'NL',
  participantCountries: ['DE', 'BE', 'FR', 'PL'],
  activities: [
    {
      id: 'act-1',
      name: 'Web Development Workshop',
      type: 'workshop',
      duration: 6,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Hands-on web development training'
    },
    {
      id: 'act-2',
      name: 'Digital Marketing Training',
      type: 'workshop',
      duration: 5,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Social media and digital marketing strategies'
    },
    {
      id: 'act-3',
      name: 'Data Visualization Workshop',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Creating effective data visualizations'
    },
    {
      id: 'act-4',
      name: 'Social Media Strategy Workshop',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Building social media presence'
    },
    {
      id: 'act-5',
      name: 'Coding Bootcamp',
      type: 'workshop',
      duration: 6,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Intensive coding training session'
    },
    {
      id: 'act-6',
      name: 'Team Reflection Session',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Reflecting on learning outcomes'
    }
  ],
  hasWorkshops: true,
  tags: ['training', 'digital', 'skills', 'workshop', 'erasmus+']
}

// =============================================================================
// SCENARIO 5: SHORT DURATION (France)
// =============================================================================

export const SCENARIO_SHORT_DURATION: ScenarioSeedData = {
  title: 'Environmental Awareness Weekend',
  description: 'A quick-impact exchange focused on environmental sustainability and climate action for youth activists',
  participants: 25,
  duration: 3,
  budget: 8000,
  destination: 'Lyon, France',
  destinationCountry: 'FR',
  participantCountries: ['DE', 'BE', 'CH'],
  activities: [
    {
      id: 'act-1',
      name: 'Sustainability Workshop',
      type: 'workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Interactive workshop on sustainable practices'
    },
    {
      id: 'act-2',
      name: 'Eco-Trail Visit',
      type: 'cultural_visit',
      duration: 2,
      isOutdoor: true,
      requiresFacilitator: false,
      description: 'Guided eco-trail and nature observation'
    },
    {
      id: 'act-3',
      name: 'Action Planning Session',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true,
      description: 'Planning follow-up environmental actions'
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'environment', 'sustainability', 'erasmus+']
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a scenario seed in the database
 */
export async function createScenarioSeed(
  prisma: PrismaClient,
  userId: string,
  tenantId: string,
  scenario: ScenarioSeedData
) {
  // Create brainstorm session first
  const session = await prisma.brainstormSession.create({
    data: {
      userId,
      tenantId,
      prompt: `Create a project: ${scenario.description}`
    }
  })

  // Calculate start date (60 days from now - standard preparation period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 60)

  // Create seed with rich metadata
  const seed = await prisma.seed.create({
    data: {
      sessionId: session.id,
      userId,
      tenantId,
      title: scenario.title,
      description: scenario.description,
      titleFormal: `${scenario.title} - Erasmus+ KA1`,
      descriptionFormal: `${scenario.description}. This project promotes intercultural learning and European values through non-formal education.`,
      approvalLikelihood: 0.75,
      approvalLikelihoodFormal: 0.85,
      estimatedParticipants: scenario.participants,
      estimatedDuration: scenario.duration,
      tags: scenario.tags,
      currentVersion: {
        destination: scenario.destination,
        destinationCountry: scenario.destinationCountry,
        participantCountries: scenario.participantCountries,
        startDate: startDate.toISOString(),
        estimatedBudget: scenario.budget,
        isPublicEvent: scenario.activities.some(a => a.type === 'public_event'),
        requiresPermits: scenario.activities.some(a => a.type === 'public_event'),
        hasWorkshops: scenario.hasWorkshops,
        activities: scenario.activities
      },
      isSaved: true,
      isDismissed: false
    }
  })

  return seed
}

/**
 * All test scenarios
 */
export const ALL_SCENARIOS = [
  { name: 'Small Project', data: SCENARIO_SMALL_PROJECT },
  { name: 'Large Project', data: SCENARIO_LARGE_PROJECT },
  { name: 'Long Distance', data: SCENARIO_LONG_DISTANCE },
  { name: 'Workshop Heavy', data: SCENARIO_WORKSHOP_HEAVY },
  { name: 'Short Duration', data: SCENARIO_SHORT_DURATION }
] as const
