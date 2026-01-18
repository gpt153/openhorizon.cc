import { expect } from '@playwright/test'
import type { Project, Phase } from '@prisma/client'

/**
 * Assertion Helpers for E2E Tests
 *
 * Reusable validation functions for testing seed elaboration scenarios
 *
 * Part of Epic 001: Seed Elaboration Validation
 * Related: Issue #177 (E2E Testing - Various Project Scenarios)
 */

// =============================================================================
// TIMELINE VALIDATION
// =============================================================================

/**
 * Assert that timeline phases are sequential with no overlaps
 */
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

    expect(currentEnd, `Phase "${current.name}" overlaps with "${next.name}"`).toBeLessThanOrEqual(
      nextStart
    )
  }
}

// =============================================================================
// BUDGET VALIDATION
// =============================================================================

/**
 * Assert that budget allocations sum to 100% of total budget
 */
export function assertBudgetValid(
  project: Project,
  phases: Phase[],
  tolerance: number = 10 // EUR
) {
  const totalBudget = Number(project.budgetTotal)
  const allocatedBudget = phases.reduce((sum, phase) => sum + Number(phase.budgetAllocated), 0)

  // Budget should sum to 100% (within tolerance)
  expect(
    Math.abs(allocatedBudget - totalBudget),
    `Allocated budget (€${allocatedBudget}) differs from total budget (€${totalBudget}) by more than €${tolerance}`
  ).toBeLessThanOrEqual(tolerance)

  // Individual allocations should be > 0
  phases.forEach(phase => {
    expect(Number(phase.budgetAllocated), `Phase "${phase.name}" has no budget allocated`).toBeGreaterThan(
      0
    )
  })
}

// =============================================================================
// VISA REQUIREMENTS VALIDATION
// =============================================================================

/**
 * Assert visa requirements are correctly identified
 */
export function assertVisaRequirementsValid(
  project: Project,
  expectedVisaRequired: boolean,
  expectedCountries: string[] = []
) {
  const metadata = project.metadata as any

  expect(
    metadata.requirementsSummary.visas.required,
    `Visa requirement should be ${expectedVisaRequired}`
  ).toBe(expectedVisaRequired)

  if (expectedVisaRequired) {
    expect(
      metadata.requirementsSummary.visas.countries.length,
      'Expected visa countries to be specified'
    ).toBeGreaterThan(0)

    if (expectedCountries.length > 0) {
      expectedCountries.forEach(country => {
        expect(
          metadata.requirementsSummary.visas.countries,
          `Expected visa requirement for ${country}`
        ).toContain(country)
      })
    }
  }
}

// =============================================================================
// CHECKLIST VALIDATION
// =============================================================================

/**
 * Assert checklists are complete and well-formed
 */
export function assertChecklistValid(phases: Phase[]) {
  phases.forEach(phase => {
    const checklist = phase.checklist as any

    expect(checklist, `Phase "${phase.name}" missing checklist`).toBeDefined()
    expect(checklist.tasks, `Phase "${phase.name}" missing checklist tasks`).toBeDefined()
    expect(
      Array.isArray(checklist.tasks),
      `Phase "${phase.name}" checklist tasks is not an array`
    ).toBe(true)

    // At least one task per phase
    expect(checklist.tasks.length, `Phase "${phase.name}" has no checklist tasks`).toBeGreaterThan(
      0
    )

    // Each task has required fields
    checklist.tasks.forEach((task: any, index: number) => {
      expect(task, `Task ${index} in phase "${phase.name}" is undefined`).toBeDefined()
      expect(task).toHaveProperty('description')
      expect(task).toHaveProperty('completed')
      expect(task).toHaveProperty('priority')
      expect(task).toHaveProperty('category')
    })
  })
}

// =============================================================================
// PERFORMANCE VALIDATION
// =============================================================================

/**
 * Assert performance meets requirements
 */
export function assertPerformanceValid(
  startTime: number,
  endTime: number,
  maxDurationMs: number = 60000 // 60 seconds
) {
  const duration = endTime - startTime
  const durationSeconds = (duration / 1000).toFixed(2)

  expect(
    duration,
    `Scenario took ${durationSeconds}s, exceeding ${maxDurationMs / 1000}s limit`
  ).toBeLessThan(maxDurationMs)
}

// =============================================================================
// PHASE STRUCTURE VALIDATION
// =============================================================================

/**
 * Assert phase structure is complete and correct
 */
export function assertPhaseStructureValid(phases: Phase[]) {
  // Core phases must exist
  const phaseTypes = phases.map(p => p.type)

  const requiredPhases = ['APPLICATION', 'ACCOMMODATION', 'TRAVEL', 'FOOD', 'REPORTING']
  requiredPhases.forEach(requiredType => {
    expect(phaseTypes, `Missing required phase type: ${requiredType}`).toContain(requiredType)
  })

  // Phases should be ordered sequentially
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order)
  sortedPhases.forEach((phase, index) => {
    expect(phase.order, `Phase "${phase.name}" has incorrect order`).toBe(index + 1)
  })

  // APPLICATION should be first
  expect(sortedPhases[0].type, 'APPLICATION should be the first phase').toBe('APPLICATION')

  // REPORTING should be last
  expect(
    sortedPhases[sortedPhases.length - 1].type,
    'REPORTING should be the last phase'
  ).toBe('REPORTING')
}

// =============================================================================
// BUDGET BREAKDOWN VALIDATION
// =============================================================================

/**
 * Assert budget breakdown matches scenario expectations
 */
export function assertBudgetBreakdownValid(
  project: Project,
  options: {
    expectedTravelPercentage?: { min: number; max: number }
    expectedActivitiesPercentage?: { min: number; max: number }
  }
) {
  const metadata = project.metadata as any
  const breakdown = metadata.budgetBreakdown
  const total = Number(project.budgetTotal)

  // Validate travel percentage if specified
  if (options.expectedTravelPercentage) {
    const travelPct = (breakdown.travel / total) * 100
    expect(
      travelPct,
      `Travel budget ${travelPct.toFixed(1)}% outside expected range`
    ).toBeGreaterThanOrEqual(options.expectedTravelPercentage.min)
    expect(travelPct).toBeLessThanOrEqual(options.expectedTravelPercentage.max)
  }

  // Validate activities percentage if specified
  if (options.expectedActivitiesPercentage) {
    const activitiesPct = (breakdown.activities / total) * 100
    expect(
      activitiesPct,
      `Activities budget ${activitiesPct.toFixed(1)}% outside expected range`
    ).toBeGreaterThanOrEqual(options.expectedActivitiesPercentage.min)
    expect(activitiesPct).toBeLessThanOrEqual(options.expectedActivitiesPercentage.max)
  }

  // All categories should sum to 100%
  const sum = Object.values(breakdown).reduce((a: number, b: any) => a + Number(b), 0)
  expect(
    Math.abs(sum - total),
    `Budget breakdown (€${sum}) doesn't sum to total budget (€${total})`
  ).toBeLessThanOrEqual(10) // Within €10
}
