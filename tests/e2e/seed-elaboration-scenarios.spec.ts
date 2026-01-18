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

// Import convertSeedToProject from backend
import { convertSeedToProject } from '../../project-pipeline/backend/src/seeds/seeds.service'

/**
 * E2E Test Suite: Seed Elaboration - 5 Project Scenarios
 *
 * Tests complete seed → project conversion across different project types
 * to validate all generators work correctly with varying inputs.
 *
 * Part of Epic 001: Seed Elaboration Validation
 * Related: Issue #177 (E2E Testing - Various Project Scenarios)
 *
 * Test Scenarios:
 * 1. Small Project (20 participants, 5 days, €10k, Germany)
 * 2. Large Project (60 participants, 14 days, €50k, Spain)
 * 3. Long-Distance Travel (30 participants, 10 days, €35k, Morocco)
 * 4. Workshop-Heavy Program (40 participants, 7 days, €25k, Netherlands)
 * 5. Short Duration (25 participants, 3 days, €8k, France)
 *
 * Acceptance Criteria:
 * - All 5 scenarios complete without errors
 * - Generated projects have valid timelines (sequential phases, no overlaps)
 * - Budget allocations sum to 100% for all scenarios
 * - Visa requirements correctly identified for non-EU destinations
 * - Checklists include all mandatory items
 * - No crashes or validation errors
 * - Performance: Each scenario completes in <60 seconds
 */

test.describe('Seed Elaboration - 5 Project Scenarios', () => {
  let prisma: ReturnType<typeof getTestPrismaClient>
  let testUserId: string
  let testTenantId: string

  test.beforeAll(async () => {
    prisma = getTestPrismaClient()

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        clerkId: `clerk_scenario_test_${Date.now()}`,
        email: `scenario-test-${Date.now()}@example.com`,
        firstName: 'Scenario',
        lastName: 'Test User'
      }
    })

    testUserId = testUser.id

    // Create test tenant
    const testTenant = await prisma.tenant.create({
      data: {
        name: `Scenario Test Org ${Date.now()}`,
        slug: `scenario-test-${Date.now()}`
      }
    })

    testTenantId = testTenant.id

    console.log(`\n🧪 Test User ID: ${testUserId}`)
    console.log(`🧪 Test Tenant ID: ${testTenantId}\n`)
  })

  test.afterAll(async () => {
    // Cleanup: Delete all test data in reverse order due to foreign keys
    await prisma.phase.deleteMany({
      where: { project: { userId: testUserId } }
    })
    await prisma.project.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.seed.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.brainstormSession.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.user.delete({
      where: { id: testUserId }
    })
    await prisma.tenant.delete({
      where: { id: testTenantId }
    })

    console.log('\n✅ Test cleanup complete\n')
  })

  // ==========================================================================
  // SCENARIO 1: SMALL PROJECT (Germany)
  // ==========================================================================

  test('Scenario 1: Small Project - Basic requirements', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[0]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    // 1. Create seed
    const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)

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

  // ==========================================================================
  // SCENARIO 2: LARGE PROJECT (Spain)
  // ==========================================================================

  test('Scenario 2: Large Project - Maximum capacity', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[1]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)
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

  // ==========================================================================
  // SCENARIO 3: LONG-DISTANCE TRAVEL (Morocco)
  // ==========================================================================

  test('Scenario 3: Long-Distance Travel - Visa requirements', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[2]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate project
    expect(result.project.participantsCount).toBe(30)
    expect(Number(result.project.budgetTotal)).toBe(35000)

    // Visa requirements detected (non-EU destination)
    // Morocco requires visas for EU citizens in some cases
    assertVisaRequirementsValid(result.project, true, ['ES', 'FR', 'IT', 'DE'])

    // Higher travel budget for long-distance
    assertBudgetBreakdownValid(result.project, {
      expectedTravelPercentage: { min: 40, max: 60 }
    })

    // Visa/permit phase should exist
    const visaOrPermitPhases = result.phases.filter(
      p => p.type === 'PERMITS' || p.name.toLowerCase().includes('visa')
    )
    expect(visaOrPermitPhases.length).toBeGreaterThan(0)

    // Timeline valid
    assertTimelineValid(result.phases)

    // Budget valid
    assertBudgetValid(result.project, result.phases)

    // Phase structure
    assertPhaseStructureValid(result.phases)

    // Checklists include visa/travel items
    assertChecklistValid(result.phases)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // ==========================================================================
  // SCENARIO 4: WORKSHOP-HEAVY PROGRAM (Netherlands)
  // ==========================================================================

  test('Scenario 4: Workshop-Heavy - Activities budget boost', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[3]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)
    const result = await convertSeedToProject(seed.id, testUserId)

    const endTime = Date.now()

    // Validate project
    expect(result.project.participantsCount).toBe(40)
    expect(Number(result.project.budgetTotal)).toBe(25000)

    // Activities budget increased for workshops
    assertBudgetBreakdownValid(result.project, {
      expectedActivitiesPercentage: { min: 15, max: 25 }
    })

    // 5+ workshop-related activity phases
    const workshopPhases = result.phases.filter(
      p =>
        p.type === 'ACTIVITIES' &&
        (p.name.toLowerCase().includes('workshop') || p.name.toLowerCase().includes('training'))
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

    // Check for facilitator-related tasks in workshop checklists
    if (workshopPhases.length > 0) {
      const workshopChecklist = workshopPhases[0].checklist as any
      const hasFacilitatorTask = workshopChecklist.tasks.some((t: any) =>
        t.description.toLowerCase().includes('facilitator')
      )
      expect(hasFacilitatorTask).toBe(true)
    }

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // ==========================================================================
  // SCENARIO 5: SHORT DURATION (France)
  // ==========================================================================

  test('Scenario 5: Short Duration - Accelerated timeline', async () => {
    const startTime = Date.now()
    const scenario = ALL_SCENARIOS[4]

    console.log(`\n🧪 Testing ${scenario.name}...`)

    const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)
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

    // Checklists condensed but complete
    assertChecklistValid(result.phases)

    // Performance
    assertPerformanceValid(startTime, endTime, 60000)

    console.log(`✅ ${scenario.name} completed in ${endTime - startTime}ms`)
  })

  // ==========================================================================
  // CROSS-SCENARIO VALIDATION
  // ==========================================================================

  test('All scenarios: No validation errors', async () => {
    console.log('\n🧪 Testing all scenarios for errors...')

    const results = []

    for (const scenario of ALL_SCENARIOS) {
      const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)

      try {
        const result = await convertSeedToProject(seed.id, testUserId)
        results.push({ scenario: scenario.name, success: true, result })
      } catch (error) {
        results.push({ scenario: scenario.name, success: false, error })
      }
    }

    // All scenarios should succeed
    results.forEach(r => {
      expect(r.success, `Scenario "${r.scenario}" failed`).toBe(true)
      if (!r.success) {
        console.error(`❌ ${r.scenario} failed:`, r.error)
      }
    })

    console.log(`✅ All ${results.length} scenarios passed without errors`)
  })

  // ==========================================================================
  // PERFORMANCE BENCHMARK
  // ==========================================================================

  test('All scenarios: Performance benchmark', async () => {
    console.log('\n🧪 Performance benchmark for all scenarios...')

    const benchmarks = []

    for (const scenario of ALL_SCENARIOS) {
      const seed = await createScenarioSeed(prisma, testUserId, testTenantId, scenario.data)

      const startTime = Date.now()
      await convertSeedToProject(seed.id, testUserId)
      const endTime = Date.now()

      const duration = endTime - startTime
      benchmarks.push({ scenario: scenario.name, duration })

      console.log(`  ${scenario.name}: ${duration}ms`)
    }

    // Average should be < 30s
    const avgDuration = benchmarks.reduce((sum, b) => sum + b.duration, 0) / benchmarks.length
    expect(avgDuration, `Average performance ${(avgDuration / 1000).toFixed(2)}s exceeds 30s`).toBeLessThan(
      30000
    )

    // No individual scenario > 60s
    benchmarks.forEach(b => {
      expect(
        b.duration,
        `Scenario "${b.scenario}" took ${(b.duration / 1000).toFixed(2)}s, exceeding 60s limit`
      ).toBeLessThan(60000)
    })

    console.log(`\n📊 Average duration: ${Math.round(avgDuration)}ms`)
    console.log(`📊 Slowest: ${Math.max(...benchmarks.map(b => b.duration))}ms`)
    console.log(`📊 Fastest: ${Math.min(...benchmarks.map(b => b.duration))}ms\n`)
  })
})
