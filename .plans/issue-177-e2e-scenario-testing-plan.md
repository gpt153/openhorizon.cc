# Implementation Plan: Issue #177 - E2E Testing for 5 Project Scenarios

**Issue:** #177 - End-to-End Testing - Various Project Scenarios
**Epic:** Epic 001 - Seed Elaboration Validation
**Created:** 2026-01-18
**Status:** Ready for Implementation

---

## 📋 Executive Summary

Implement comprehensive E2E tests for the complete seed elaboration flow across 5 distinct Erasmus+ project scenarios. Tests will validate that all generators (timeline, budget, checklist, requirements, phases) work correctly across varying project types, sizes, and destinations.

### Success Criteria
- ✅ All 5 scenarios complete elaboration flow without errors
- ✅ Generated projects have valid timelines (sequential phases, no overlaps)
- ✅ Budget allocations sum to 100% for all scenarios
- ✅ Visa requirements correctly identified for non-EU destinations
- ✅ Checklists include all mandatory items
- ✅ No crashes or validation errors
- ✅ Performance: Each scenario completes in <60 seconds

---

## 🎯 Test Scenarios

### Scenario 1: Small Project
**Purpose:** Test minimum viable project configuration
- **Participants:** 20
- **Duration:** 5 days
- **Budget:** €10,000
- **Destination:** Germany (EU)
- **Expected Validations:**
  - Optimized budget allocations for small groups
  - Short timeline (8-week preparation)
  - Basic checklist items only
  - No visa requirements (EU-to-EU)

### Scenario 2: Large Project
**Purpose:** Test maximum capacity handling
- **Participants:** 60
- **Duration:** 14 days
- **Budget:** €50,000
- **Destination:** Spain (EU)
- **Expected Validations:**
  - Maximum participant scaling
  - Extended timeline (12-week preparation)
  - Comprehensive checklists with high-capacity items
  - Complex logistics phases

### Scenario 3: Long-Distance Travel
**Purpose:** Test non-EU destination requirements
- **Participants:** 30
- **Duration:** 10 days
- **Budget:** €35,000
- **Destination:** Morocco (non-EU)
- **Expected Validations:**
  - Visa requirements detected
  - Higher travel budget allocation (>40%)
  - Permit/documentation phases present
  - Insurance requirements enhanced

### Scenario 4: Workshop-Heavy Program
**Purpose:** Test activity-driven budget adjustments
- **Participants:** 40
- **Duration:** 7 days
- **Budget:** €25,000
- **Workshops:** 5+ sessions
- **Expected Validations:**
  - Activities budget increased by 5%
  - Workshop-specific checklist items
  - Facilitator/venue requirements
  - Material procurement phases

### Scenario 5: Short Duration
**Purpose:** Test accelerated timelines
- **Participants:** 25
- **Duration:** 3 days
- **Budget:** €8,000
- **Destination:** France (EU)
- **Expected Validations:**
  - Optimized food/travel budgets for short stay
  - Accelerated timeline (6-week preparation)
  - Streamlined checklists
  - Condensed phase structure

---

## 🏗️ Architecture Overview

```
tests/
├── e2e/
│   ├── seed-elaboration-scenarios.spec.ts  ← NEW: Main test suite
│   ├── seed-elaboration.spec.ts            ← Existing (conversational UI)
│   ├── project-generation.spec.ts          ← Existing (conversion logic)
│   └── README.md                           ← UPDATE: Document new tests
├── fixtures/
│   ├── scenario-seeds.ts                   ← NEW: Seed data for 5 scenarios
│   ├── seeds.ts                            ← Existing (basic fixtures)
│   └── index.ts                            ← UPDATE: Export new fixtures
└── helpers/
    ├── database.ts                         ← Existing (Prisma helpers)
    ├── auth.ts                             ← Existing (Auth helpers)
    └── assertions.ts                       ← NEW: Reusable validation helpers
```

---

## 📝 Implementation Tasks

### Phase 1: Test Infrastructure Setup

#### Task 1.1: Create Scenario Fixtures
**File:** `tests/fixtures/scenario-seeds.ts`

```typescript
import type { PrismaClient } from '@prisma/client'
import type { RichSeedMetadata } from '../../project-pipeline/backend/src/seeds/generators/types'

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

// Scenario 1: Small Project (Germany)
export const SCENARIO_SMALL_PROJECT: ScenarioSeedData = {
  title: 'Youth Leadership Weekend',
  description: 'A short youth exchange focused on leadership skills development',
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
      description: 'Interactive leadership training'
    },
    {
      id: 'act-2',
      name: 'Team Building Activities',
      type: 'team_building',
      duration: 2,
      isOutdoor: true,
      requiresFacilitator: true,
      description: 'Outdoor team challenges'
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'leadership', 'erasmus+']
}

// Scenario 2: Large Project (Spain)
export const SCENARIO_LARGE_PROJECT: ScenarioSeedData = {
  title: 'Mediterranean Cultural Exchange',
  description: 'A comprehensive two-week exchange exploring Mediterranean cultures',
  participants: 60,
  duration: 14,
  budget: 50000,
  destination: 'Barcelona, Spain',
  destinationCountry: 'ES',
  participantCountries: ['IT', 'GR', 'FR', 'PT', 'HR'],
  activities: [
    // 7+ activities for large project
    {
      id: 'act-1',
      name: 'Cultural Workshops',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-2',
      name: 'Mediterranean Cooking Class',
      type: 'cooking_workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-3',
      name: 'Historical City Tour',
      type: 'cultural_visit',
      duration: 4,
      isOutdoor: true,
      requiresFacilitator: false
    },
    {
      id: 'act-4',
      name: 'Public Cultural Evening',
      type: 'public_event',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-5',
      name: 'Beach Team Building',
      type: 'team_building',
      duration: 3,
      isOutdoor: true,
      requiresFacilitator: true
    },
    {
      id: 'act-6',
      name: 'Reflection Sessions',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-7',
      name: 'Final Presentation',
      type: 'public_event',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: false
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'culture', 'mediterranean', 'erasmus+']
}

// Scenario 3: Long-Distance Travel (Morocco)
export const SCENARIO_LONG_DISTANCE: ScenarioSeedData = {
  title: 'Euro-Mediterranean Dialogue',
  description: 'Cross-cultural exchange between European and Moroccan youth',
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
      requiresFacilitator: true
    },
    {
      id: 'act-2',
      name: 'Medina Cultural Visit',
      type: 'cultural_visit',
      duration: 3,
      isOutdoor: true,
      requiresFacilitator: true
    },
    {
      id: 'act-3',
      name: 'Traditional Cooking Workshop',
      type: 'cooking_workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-4',
      name: 'Reflection Circle',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'intercultural', 'morocco', 'erasmus+']
}

// Scenario 4: Workshop-Heavy Program
export const SCENARIO_WORKSHOP_HEAVY: ScenarioSeedData = {
  title: 'Digital Skills Training Course',
  description: 'Intensive training on digital competencies with multiple workshop sessions',
  participants: 40,
  duration: 7,
  budget: 25000,
  destination: 'Amsterdam, Netherlands',
  destinationCountry: 'NL',
  participantCountries: ['DE', 'BE', 'FR', 'PL'],
  activities: [
    // 5+ workshops
    {
      id: 'act-1',
      name: 'Web Development Workshop',
      type: 'workshop',
      duration: 6,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-2',
      name: 'Digital Marketing Training',
      type: 'workshop',
      duration: 5,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-3',
      name: 'Data Visualization Workshop',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-4',
      name: 'Social Media Strategy Workshop',
      type: 'workshop',
      duration: 4,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-5',
      name: 'Coding Bootcamp',
      type: 'workshop',
      duration: 6,
      isOutdoor: false,
      requiresFacilitator: true
    },
    {
      id: 'act-6',
      name: 'Team Reflection Session',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true
    }
  ],
  hasWorkshops: true,
  tags: ['training', 'digital', 'skills', 'workshop', 'erasmus+']
}

// Scenario 5: Short Duration
export const SCENARIO_SHORT_DURATION: ScenarioSeedData = {
  title: 'Environmental Awareness Weekend',
  description: 'A quick-impact exchange focused on environmental sustainability',
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
      requiresFacilitator: true
    },
    {
      id: 'act-2',
      name: 'Eco-Trail Visit',
      type: 'cultural_visit',
      duration: 2,
      isOutdoor: true,
      requiresFacilitator: false
    },
    {
      id: 'act-3',
      name: 'Action Planning Session',
      type: 'reflection',
      duration: 2,
      isOutdoor: false,
      requiresFacilitator: true
    }
  ],
  hasWorkshops: true,
  tags: ['youth', 'exchange', 'environment', 'sustainability', 'erasmus+']
}

// Helper function to create seed in database
export async function createScenarioSeed(
  prisma: PrismaClient,
  userId: string,
  scenario: ScenarioSeedData
) {
  // Create brainstorm session first
  const session = await prisma.brainstormSession.create({
    data: {
      userId,
      tenantId: 'test-tenant',
      prompt: `Create a project: ${scenario.description}`
    }
  })

  // Calculate start date (60 days from now)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 60)

  // Create seed with rich metadata
  const seed = await prisma.seed.create({
    data: {
      sessionId: session.id,
      userId,
      tenantId: 'test-tenant',
      title: scenario.title,
      description: scenario.description,
      titleFormal: `${scenario.title} - Erasmus+ KA1`,
      descriptionFormal: `${scenario.description}. This project promotes intercultural learning and European values.`,
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

export const ALL_SCENARIOS = [
  { name: 'Small Project', data: SCENARIO_SMALL_PROJECT },
  { name: 'Large Project', data: SCENARIO_LARGE_PROJECT },
  { name: 'Long Distance', data: SCENARIO_LONG_DISTANCE },
  { name: 'Workshop Heavy', data: SCENARIO_WORKSHOP_HEAVY },
  { name: 'Short Duration', data: SCENARIO_SHORT_DURATION }
]
```

**Acceptance Criteria:**
- ✅ 5 complete scenario fixtures defined
- ✅ All required metadata fields populated
- ✅ Helper function creates seeds in database
- ✅ Activities properly structured per scenario

---

#### Task 1.2: Create Assertion Helpers
**File:** `tests/helpers/assertions.ts`

```typescript
import { expect } from '@playwright/test'
import type { PrismaClient, Project, Phase } from '@prisma/client'

/**
 * Assertion helpers for E2E tests
 */

// Timeline validation
export function assertTimelineValid(phases: Phase[]) {
  const sortedPhases = [...phases].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  for (let i = 0; i < sortedPhases.length - 1; i++) {
    const current = sortedPhases[i]
    const next = sortedPhases[i + 1]

    // No overlaps: current.endDate <= next.startDate
    const currentEnd = new Date(current.endDate).getTime()
    const nextStart = new Date(next.startDate).getTime()

    expect(currentEnd).toBeLessThanOrEqual(nextStart)
  }
}

// Budget validation
export function assertBudgetValid(
  project: Project,
  phases: Phase[],
  tolerance: number = 10 // EUR
) {
  const totalBudget = Number(project.budgetTotal)
  const allocatedBudget = phases.reduce(
    (sum, phase) => sum + Number(phase.budgetAllocated),
    0
  )

  // Budget should sum to 100% (within tolerance)
  expect(Math.abs(allocatedBudget - totalBudget)).toBeLessThanOrEqual(tolerance)

  // Individual allocations should be > 0
  phases.forEach(phase => {
    expect(Number(phase.budgetAllocated)).toBeGreaterThan(0)
  })
}

// Visa requirements validation
export function assertVisaRequirementsValid(
  project: Project,
  expectedVisaRequired: boolean,
  expectedCountries: string[] = []
) {
  const metadata = project.metadata as any

  expect(metadata.requirementsSummary.visas.required).toBe(expectedVisaRequired)

  if (expectedVisaRequired) {
    expect(metadata.requirementsSummary.visas.countries.length).toBeGreaterThan(0)

    if (expectedCountries.length > 0) {
      expectedCountries.forEach(country => {
        expect(metadata.requirementsSummary.visas.countries).toContain(country)
      })
    }
  }
}

// Checklist validation
export function assertChecklistValid(phases: Phase[]) {
  phases.forEach(phase => {
    const checklist = phase.checklist as any

    expect(checklist).toBeDefined()
    expect(checklist.tasks).toBeDefined()
    expect(Array.isArray(checklist.tasks)).toBe(true)

    // At least one task per phase
    expect(checklist.tasks.length).toBeGreaterThan(0)

    // Each task has required fields
    checklist.tasks.forEach((task: any) => {
      expect(task).toHaveProperty('description')
      expect(task).toHaveProperty('completed')
      expect(task).toHaveProperty('priority')
      expect(task).toHaveProperty('category')
    })
  })
}

// Performance validation
export function assertPerformanceValid(
  startTime: number,
  endTime: number,
  maxDurationMs: number = 60000 // 60 seconds
) {
  const duration = endTime - startTime
  expect(duration).toBeLessThan(maxDurationMs)
}

// Phase structure validation
export function assertPhaseStructureValid(phases: Phase[]) {
  // Core phases must exist
  const phaseTypes = phases.map(p => p.type)

  expect(phaseTypes).toContain('APPLICATION')
  expect(phaseTypes).toContain('ACCOMMODATION')
  expect(phaseTypes).toContain('TRAVEL')
  expect(phaseTypes).toContain('FOOD')
  expect(phaseTypes).toContain('REPORTING')

  // Phases should be ordered
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order)
  sortedPhases.forEach((phase, index) => {
    expect(phase.order).toBe(index + 1)
  })

  // APPLICATION should be first
  expect(sortedPhases[0].type).toBe('APPLICATION')

  // REPORTING should be last
  expect(sortedPhases[sortedPhases.length - 1].type).toBe('REPORTING')
}

// Budget breakdown validation (scenario-specific)
export function assertBudgetBreakdownValid(
  project: Project,
  expectedTravelPercentage?: { min: number; max: number },
  expectedActivitiesPercentage?: { min: number; max: number }
) {
  const metadata = project.metadata as any
  const breakdown = metadata.budgetBreakdown
  const total = Number(project.budgetTotal)

  if (expectedTravelPercentage) {
    const travelPct = (breakdown.travel / total) * 100
    expect(travelPct).toBeGreaterThanOrEqual(expectedTravelPercentage.min)
    expect(travelPct).toBeLessThanOrEqual(expectedTravelPercentage.max)
  }

  if (expectedActivitiesPercentage) {
    const activitiesPct = (breakdown.activities / total) * 100
    expect(activitiesPct).toBeGreaterThanOrEqual(expectedActivitiesPercentage.min)
    expect(activitiesPct).toBeLessThanOrEqual(expectedActivitiesPercentage.max)
  }

  // All categories should sum to 100%
  const sum = Object.values(breakdown).reduce((a: number, b: any) => a + Number(b), 0)
  expect(Math.abs(sum - total)).toBeLessThanOrEqual(10) // Within €10
}
```

**Acceptance Criteria:**
- ✅ Timeline overlap validation
- ✅ Budget summation validation (100% ± tolerance)
- ✅ Visa requirement checks
- ✅ Checklist completeness checks
- ✅ Performance measurement
- ✅ Phase structure validation

---

### Phase 2: Main Test Suite

#### Task 2.1: Create Scenario-Based E2E Test
**File:** `tests/e2e/seed-elaboration-scenarios.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { getTestPrismaClient } from '../helpers/database'
import {
  ALL_SCENARIOS,
  createScenarioSeed,
  type ScenarioSeedData
} from '../fixtures/scenario-seeds'
import {
  assertTimelineValid,
  assertBudgetValid,
  assertVisaRequirementsValid,
  assertChecklistValid,
  assertPerformanceValid,
  assertPhaseStructureValid,
  assertBudgetBreakdownValid
} from '../helpers/assertions'
import { convertSeedToProject } from '../../project-pipeline/backend/src/seeds/seeds.service'

/**
 * E2E Test Suite: Seed Elaboration - 5 Project Scenarios
 *
 * Tests complete seed → project conversion across different project types
 * to validate all generators work correctly with varying inputs.
 *
 * Part of Epic 001: Seed Elaboration Validation
 * Related: Issue #177 (E2E Testing - Various Project Scenarios)
 */

test.describe('Seed Elaboration - 5 Project Scenarios', () => {
  let prisma: PrismaClient
  let testUserId: string

  test.beforeAll(async () => {
    prisma = getTestPrismaClient()

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `scenario-test-${Date.now()}@example.com`,
        name: 'Scenario Test User',
        passwordHash: 'hash',
        role: 'COORDINATOR'
      }
    })

    testUserId = testUser.id
  })

  test.afterAll(async () => {
    // Cleanup: Delete all test data
    await prisma.phase.deleteMany({
      where: { project: { createdBy: testUserId } }
    })
    await prisma.project.deleteMany({
      where: { createdBy: testUserId }
    })
    await prisma.seed.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.user.delete({
      where: { id: testUserId }
    })
  })

  // Scenario 1: Small Project (Germany)
  test('Scenario 1: Small Project - Basic requirements', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[0]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    // 1. Create seed
    const seed = await createScenarioSeed(prisma, testUserId, scenario.data)

    // 2. Convert to project
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // 3. Validate project created
    expect(result.project).toBeDefined()
    expect(result.project.participantsCount).toBe(20)
    expect(Number(result.project.budgetTotal)).toBe(10000)

    // 4. Validate timeline (short preparation for small project)
    expect(result.timeline.preparation.durationWeeks).toBe(8)
    assertTimelineValid(result.phases)

    // 5. Validate budget (100% allocated)
    assertBudgetValid(result.project, result.phases)

    // 6. Validate no visa requirements (EU-to-EU)
    assertVisaRequirementsValid(result.project, false)

    // 7. Validate phase structure
    assertPhaseStructureValid(result.phases)

    // 8. Validate checklists exist
    assertChecklistValid(result.phases)

    // 9. Validate performance (<60s)
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // Scenario 2: Large Project (Spain)
  test('Scenario 2: Large Project - Maximum capacity', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[1]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate large project handling
    expect(result.project.participantsCount).toBe(60)
    expect(Number(result.project.budgetTotal)).toBe(50000)

    // Extended preparation for large project
    expect(result.timeline.preparation.durationWeeks).toBe(12)

    // Timeline valid
    assertTimelineValid(result.phases)

    // Budget allocated
    assertBudgetValid(result.project, result.phases)

    // No visa (EU-to-EU)
    assertVisaRequirementsValid(result.project, false)

    // More phases for large project (7+ activities)
    const activityPhases = result.phases.filter(p => p.type === 'ACTIVITIES')
    expect(activityPhases.length).toBeGreaterThanOrEqual(7)

    // Phase structure valid
    assertPhaseStructureValid(result.phases)

    // Checklists comprehensive for large project
    assertChecklistValid(result.phases)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // Scenario 3: Long-Distance Travel (Morocco)
  test('Scenario 3: Long-Distance Travel - Visa requirements', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[2]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate project
    expect(result.project.participantsCount).toBe(30)
    expect(Number(result.project.budgetTotal)).toBe(35000)

    // Visa requirements detected (non-EU destination)
    assertVisaRequirementsValid(result.project, true, ['ES', 'FR', 'IT', 'DE'])

    // Higher travel budget for long-distance
    assertBudgetBreakdownValid(result.project, {
      expectedTravelPercentage: { min: 40, max: 60 }
    })

    // Visa/permit phase exists
    const visaPhase = result.phases.find(p =>
      p.type === 'PERMITS' && p.name.toLowerCase().includes('visa')
    )
    expect(visaPhase).toBeDefined()

    // Timeline valid
    assertTimelineValid(result.phases)

    // Budget valid
    assertBudgetValid(result.project, result.phases)

    // Phase structure
    assertPhaseStructureValid(result.phases)

    // Checklists include visa items
    assertChecklistValid(result.phases)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // Scenario 4: Workshop-Heavy Program
  test('Scenario 4: Workshop-Heavy - Activities budget boost', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[3]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate project
    expect(result.project.participantsCount).toBe(40)
    expect(Number(result.project.budgetTotal)).toBe(25000)

    // Activities budget increased for workshops
    assertBudgetBreakdownValid(result.project, {
      expectedActivitiesPercentage: { min: 15, max: 25 }
    })

    // 5+ workshop phases
    const workshopPhases = result.phases.filter(p =>
      p.type === 'ACTIVITIES' &&
      p.name.toLowerCase().includes('workshop')
    )
    expect(workshopPhases.length).toBeGreaterThanOrEqual(5)

    // Timeline valid
    assertTimelineValid(result.phases)

    // Budget valid
    assertBudgetValid(result.project, result.phases)

    // No visa (EU-to-EU)
    assertVisaRequirementsValid(result.project, false)

    // Phase structure
    assertPhaseStructureValid(result.phases)

    // Checklists include workshop-specific items
    assertChecklistValid(result.phases)

    const workshopChecklist = workshopPhases[0].checklist as any
    const hasFacilitatorTask = workshopChecklist.tasks.some((t: any) =>
      t.description.toLowerCase().includes('facilitator')
    )
    expect(hasFacilitatorTask).toBe(true)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // Scenario 5: Short Duration
  test('Scenario 5: Short Duration - Accelerated timeline', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[4]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate project
    expect(result.project.participantsCount).toBe(25)
    expect(Number(result.project.budgetTotal)).toBe(8000)

    // Short preparation for quick project
    expect(result.timeline.preparation.durationWeeks).toBe(6)

    // Exchange duration matches (3 days)
    expect(result.timeline.exchange.durationDays).toBe(3)

    // Optimized budgets for short duration
    const metadata = result.project.metadata as any
    const foodBudget = metadata.budgetBreakdown.food
    const totalBudget = Number(result.project.budgetTotal)
    const foodPct = (foodBudget / totalBudget) * 100

    // Food budget should be lower for short stay
    expect(foodPct).toBeLessThan(20)

    // Timeline valid
    assertTimelineValid(result.phases)

    // Budget valid
    assertBudgetValid(result.project, result.phases)

    // No visa (EU-to-EU)
    assertVisaRequirementsValid(result.project, false)

    // Phase structure (streamlined for short project)
    assertPhaseStructureValid(result.phases)

    // Checklists condensed
    assertChecklistValid(result.phases)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // Cross-scenario validation
  test('All scenarios: No validation errors', async () => {
    console.log('\n🧪 Testing all scenarios for errors...')

    const results = []

    for (const scenario of ALL_SCENARIOS) {
      const seed = await createScenarioSeed(prisma, testUserId, scenario.data)

      try {
        const result = await convertSeedToProject(seed.id, testUserId)
        results.push({ scenario: scenario.name, success: true, result })
      } catch (error) {
        results.push({ scenario: scenario.name, success: false, error })
      }
    }

    // All scenarios should succeed
    results.forEach(r => {
      expect(r.success).toBe(true)
      if (!r.success) {
        console.error(`❌ ${r.scenario} failed:`, r.error)
      }
    })

    console.log(`✅ All ${results.length} scenarios passed without errors`)
  })

  // Performance benchmark
  test('All scenarios: Performance benchmark', async () => {
    console.log('\n🧪 Performance benchmark for all scenarios...')

    const benchmarks = []

    for (const scenario of ALL_SCENARIOS) {
      const seed = await createScenarioSeed(prisma, testUserId, scenario.data)

      const startTime = Date.now()
      await convertSeedToProject(seed.id, testUserId)
      const endTime = Date.now()

      const duration = endTime - startTime
      benchmarks.push({ scenario: scenario.name, duration })

      console.log(`  ${scenario.name}: ${duration}ms`)
    }

    // Average should be < 30s
    const avgDuration = benchmarks.reduce((sum, b) => sum + b.duration, 0) / benchmarks.length
    expect(avgDuration).toBeLessThan(30000)

    // No individual scenario > 60s
    benchmarks.forEach(b => {
      expect(b.duration).toBeLessThan(60000)
    })

    console.log(`\n📊 Average duration: ${Math.round(avgDuration)}ms`)
  })
})
```

**Acceptance Criteria:**
- ✅ 5 scenario tests implemented
- ✅ Each test validates all acceptance criteria
- ✅ Performance benchmarking included
- ✅ Cross-scenario validation test
- ✅ Clear console output for debugging

---

### Phase 3: Documentation & Integration

#### Task 3.1: Update E2E README
**File:** `tests/e2e/README.md`

Add new section:

```markdown
### 8. Seed Elaboration Scenarios (`seed-elaboration-scenarios.spec.ts`)
Tests complete seed-to-project flow across 5 distinct scenarios:
- **Scenario 1:** Small project (20 participants, 5 days, €10k, Germany)
- **Scenario 2:** Large project (60 participants, 14 days, €50k, Spain)
- **Scenario 3:** Long-distance (30 participants, 10 days, €35k, Morocco)
- **Scenario 4:** Workshop-heavy (40 participants, 7 days, €25k, Netherlands)
- **Scenario 5:** Short duration (25 participants, 3 days, €8k, France)

**Validates:**
- Timeline generation (no overlaps, sequential phases)
- Budget allocation (sums to 100%)
- Visa requirements (EU vs non-EU)
- Checklist completeness
- Performance (<60s per scenario)
- Phase structure correctness

**Epic:** 001 - Seed Elaboration Validation
**Issue:** #177
```

#### Task 3.2: Update Fixtures Index
**File:** `tests/fixtures/index.ts`

```typescript
export * from './users'
export * from './projects'
export * from './seeds'
export * from './phases'
export * from './scenario-seeds' // ← ADD THIS
```

---

## 🧪 Testing Strategy

### Unit Test Coverage
- ✅ Individual generators tested (existing: `generators.test.ts`)
- ✅ Integration tests (existing: `integration.test.ts`)

### E2E Test Coverage (New)
- ✅ 5 scenario-based tests (comprehensive validation)
- ✅ Cross-scenario error detection
- ✅ Performance benchmarking

### Manual Testing
- Run full test suite locally
- Verify test output is readable
- Check database state after tests

---

## 📊 Acceptance Criteria Mapping

| Criterion | Validated By | Test Location |
|-----------|-------------|---------------|
| All scenarios complete without errors | Cross-scenario test | Line ~350 |
| Valid timelines (no overlaps) | `assertTimelineValid()` | All scenarios |
| Budget allocations = 100% | `assertBudgetValid()` | All scenarios |
| Visa requirements correct | `assertVisaRequirementsValid()` | Scenario 3 |
| Checklists complete | `assertChecklistValid()` | All scenarios |
| No crashes/validation errors | Try-catch wrapper | Cross-scenario test |
| Performance <60s | `assertPerformanceValid()` | All scenarios |

---

## 🚀 Execution Plan

### Step 1: Create Fixtures (30 min)
1. Create `tests/fixtures/scenario-seeds.ts`
2. Define all 5 scenarios with complete metadata
3. Test fixture creation independently

### Step 2: Create Assertions (20 min)
1. Create `tests/helpers/assertions.ts`
2. Implement all validation helpers
3. Add TypeScript types

### Step 3: Main Test Suite (60 min)
1. Create `tests/e2e/seed-elaboration-scenarios.spec.ts`
2. Implement 5 scenario tests
3. Add cross-scenario validation
4. Add performance benchmark

### Step 4: Documentation (15 min)
1. Update `tests/e2e/README.md`
2. Update `tests/fixtures/index.ts`
3. Add inline comments

### Step 5: Validation (30 min)
1. Run tests locally: `npm test tests/e2e/seed-elaboration-scenarios.spec.ts`
2. Verify all scenarios pass
3. Check performance benchmarks
4. Review console output

**Total Estimated Time:** ~2.5 hours

---

## 🔍 Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tests timeout (>60s) | High | Run generators in parallel where possible |
| Visa logic incorrect | Medium | Use real country codes, test both EU/non-EU |
| Budget rounding errors | Low | Use tolerance (±€10) in assertions |
| Database conflicts | Medium | Use transactions, cleanup in afterAll |
| Flaky tests | Medium | Use deterministic dates, avoid randomness |

---

## 📈 Success Metrics

- ✅ All 5 scenarios pass
- ✅ 100% acceptance criteria coverage
- ✅ Average performance <30s
- ✅ Zero validation errors
- ✅ Clear, readable test output

---

## 🔗 Related Files

### Existing Files (Reference)
- `project-pipeline/backend/src/seeds/generators/*.ts` - Generators
- `tests/e2e/seed-elaboration.spec.ts` - UI tests
- `tests/e2e/project-generation.spec.ts` - Conversion tests
- `tests/fixtures/seeds.ts` - Basic fixtures

### New Files (To Create)
- `tests/fixtures/scenario-seeds.ts` - Scenario fixtures
- `tests/helpers/assertions.ts` - Validation helpers
- `tests/e2e/seed-elaboration-scenarios.spec.ts` - Main test suite

---

## 📝 Notes

- Tests use existing `convertSeedToProject()` service function
- No UI interaction required (backend validation only)
- Performance critical: generators must complete in <60s
- Real-world scenarios based on typical Erasmus+ projects
- Non-EU destination (Morocco) tests visa logic thoroughly
- Workshop-heavy scenario validates activity-driven budget adjustments

---

**Plan Status:** ✅ Ready for Implementation
**Estimated Effort:** 2.5 hours
**Priority:** High (Epic 001 validation)
**Dependencies:** None (uses existing infrastructure)
