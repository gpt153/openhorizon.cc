/**
 * Phase Generator
 *
 * Creates all project phases based on requirements, timeline, and budget.
 * Generates phases with proper dependencies, dates, and budget allocations.
 */

import type { PhaseType } from '@prisma/client'
import type {
  PhaseGeneratorInput,
  PhaseGeneratorOutput,
  PhaseTemplate,
  TimelineOutput
} from './types.js'

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + (weeks * 7))
  return result
}

/**
 * Get phase dates from timeline, with fallback
 */
function getPhaseDates(timeline: TimelineOutput, phaseType: PhaseType): { startDate: Date; endDate: Date; deadline: Date } {
  const dates = timeline.phaseDates.get(phaseType)
  if (dates) {
    return dates
  }

  // Fallback to exchange period
  return {
    startDate: timeline.exchange.startDate,
    endDate: timeline.exchange.endDate,
    deadline: timeline.exchange.endDate
  }
}

/**
 * Generate all project phases
 *
 * @param input - Phase generation input with seed, timeline, budget, and requirements
 * @returns Array of phase templates ready for database insertion
 */
export function generatePhases(input: PhaseGeneratorInput): PhaseGeneratorOutput {
  const { seed, timeline, budget, requirements } = input
  const phases: PhaseTemplate[] = []

  let order = 1

  // ========== CORE PHASES (Always Created) ==========

  // 1. APPLICATION PHASE
  const appDates = getPhaseDates(timeline, 'APPLICATION')
  phases.push({
    name: 'Grant Application Preparation',
    type: 'APPLICATION',
    status: 'NOT_STARTED',
    start_date: appDates.startDate,
    end_date: appDates.endDate,
    deadline: appDates.deadline,
    budget_allocated: budget.breakdown.application,
    budget_spent: 0,
    order: order++,
    dependencies: [],
    editable: true,
    skippable: false
  })

  // ========== CONDITIONAL PHASES (Based on Requirements) ==========

  // 2. VISA/PERMITS PHASE (if visa required)
  if (requirements.visas.required) {
    const permitDates = getPhaseDates(timeline, 'PERMITS')
    phases.push({
      name: 'Visa Applications',
      type: 'PERMITS',
      status: 'NOT_STARTED',
      start_date: permitDates.startDate,
      end_date: addWeeks(timeline.exchange.startDate, -8),
      deadline: requirements.visas.deadline,
      budget_allocated: Math.round(budget.breakdown.permits * 0.5),
      budget_spent: 0,
      order: order++,
      dependencies: ['APPLICATION'],
      editable: true,
      skippable: false
    })
  }

  // 3. EVENT PERMITS PHASE (if event permits required)
  if (requirements.permits.types.some(p => p.type === 'event')) {
    const permitDates = getPhaseDates(timeline, 'PERMITS')
    phases.push({
      name: 'Event Permits',
      type: 'PERMITS',
      status: 'NOT_STARTED',
      start_date: addWeeks(timeline.exchange.startDate, -8),
      end_date: addWeeks(timeline.exchange.startDate, -4),
      deadline: addWeeks(timeline.exchange.startDate, -4),
      budget_allocated: Math.round(budget.breakdown.permits * 0.3),
      budget_spent: 0,
      order: order++,
      dependencies: ['APPLICATION'],
      editable: true,
      skippable: false
    })
  }

  // 4. FOOD HANDLING PERMITS (if cooking/food permits required)
  if (requirements.permits.types.some(p => p.type === 'food_handling')) {
    phases.push({
      name: 'Food Handling Permits',
      type: 'PERMITS',
      status: 'NOT_STARTED',
      start_date: addWeeks(timeline.exchange.startDate, -6),
      end_date: addWeeks(timeline.exchange.startDate, -2),
      deadline: addWeeks(timeline.exchange.startDate, -2),
      budget_allocated: Math.round(budget.breakdown.permits * 0.2),
      budget_spent: 0,
      order: order++,
      dependencies: ['ACCOMMODATION'],
      editable: true,
      skippable: true
    })
  }

  // ========== PREPARATION PHASES ==========

  // 5. INSURANCE PHASE
  const insuranceDates = getPhaseDates(timeline, 'INSURANCE')
  phases.push({
    name: `${requirements.insurance.type === 'group_travel' ? 'Group' : 'Individual'} Travel Insurance`,
    type: 'INSURANCE',
    status: 'NOT_STARTED',
    start_date: insuranceDates.startDate,
    end_date: insuranceDates.endDate,
    deadline: insuranceDates.deadline,
    budget_allocated: budget.breakdown.insurance,
    budget_spent: 0,
    order: order++,
    dependencies: ['APPLICATION'],
    editable: true,
    skippable: false
  })

  // 6. ACCOMMODATION PHASE
  const accommodationDates = getPhaseDates(timeline, 'ACCOMMODATION')
  phases.push({
    name: 'Accommodation Booking',
    type: 'ACCOMMODATION',
    status: 'NOT_STARTED',
    start_date: accommodationDates.startDate,
    end_date: accommodationDates.endDate,
    deadline: accommodationDates.deadline,
    budget_allocated: budget.breakdown.accommodation,
    budget_spent: 0,
    order: order++,
    dependencies: ['APPLICATION'],
    editable: true,
    skippable: false
  })

  // 7. TRAVEL (OUTBOUND) PHASE
  const travelDates = getPhaseDates(timeline, 'TRAVEL')
  phases.push({
    name: 'Outbound Travel Arrangements',
    type: 'TRAVEL',
    status: 'NOT_STARTED',
    start_date: travelDates.startDate,
    end_date: addDays(timeline.exchange.startDate, -1),
    deadline: travelDates.deadline,
    budget_allocated: budget.phaseAllocations.get('TRAVEL_OUTBOUND') || Math.round(budget.breakdown.travel * 0.45),
    budget_spent: 0,
    order: order++,
    dependencies: ['INSURANCE', 'ACCOMMODATION'],
    editable: true,
    skippable: false
  })

  // 8. FOOD PHASE
  const foodDates = getPhaseDates(timeline, 'FOOD')
  phases.push({
    name: 'Catering and Meals',
    type: 'FOOD',
    status: 'NOT_STARTED',
    start_date: foodDates.startDate,
    end_date: foodDates.endDate,
    deadline: foodDates.deadline,
    budget_allocated: budget.breakdown.food,
    budget_spent: 0,
    order: order++,
    dependencies: ['ACCOMMODATION'],
    editable: true,
    skippable: false
  })

  // ========== EXCHANGE PERIOD PHASES ==========

  // 9. ACTIVITY PHASES (one per activity)
  const activityDates = getPhaseDates(timeline, 'ACTIVITIES')
  const activityBudget = budget.breakdown.activities
  const perActivityBudget = seed.activities.length > 0
    ? Math.round(activityBudget / seed.activities.length)
    : activityBudget

  seed.activities.forEach((activity, index) => {
    // Distribute activities across exchange period
    const activityStart = addDays(
      timeline.exchange.startDate,
      Math.floor((index / seed.activities.length) * timeline.exchange.durationDays)
    )
    const activityEnd = index === seed.activities.length - 1
      ? timeline.exchange.endDate
      : addDays(activityStart, Math.ceil(activity.duration / 8)) // Convert hours to days

    phases.push({
      name: activity.name,
      type: 'ACTIVITIES',
      status: 'NOT_STARTED',
      start_date: activityStart,
      end_date: activityEnd,
      deadline: activityEnd,
      budget_allocated: perActivityBudget,
      budget_spent: 0,
      order: order++,
      dependencies: ['TRAVEL'],
      editable: true,
      skippable: true
    })
  })

  // 10. TRAVEL (RETURN) PHASE
  phases.push({
    name: 'Return Travel Arrangements',
    type: 'TRAVEL',
    status: 'NOT_STARTED',
    start_date: timeline.exchange.endDate,
    end_date: addDays(timeline.exchange.endDate, 1),
    deadline: timeline.exchange.endDate,
    budget_allocated: budget.phaseAllocations.get('TRAVEL_RETURN') || Math.round(budget.breakdown.travel * 0.45),
    budget_spent: 0,
    order: order++,
    dependencies: ['ACTIVITIES'],
    editable: true,
    skippable: false
  })

  // ========== FOLLOW-UP PHASES ==========

  // 11. REPORTING PHASE
  const reportingDates = getPhaseDates(timeline, 'REPORTING')
  phases.push({
    name: 'Final Report and Documentation',
    type: 'REPORTING',
    status: 'NOT_STARTED',
    start_date: reportingDates.startDate,
    end_date: reportingDates.endDate,
    deadline: reportingDates.deadline,
    budget_allocated: 0, // Administrative task, no budget
    budget_spent: 0,
    order: order++,
    dependencies: ['TRAVEL'], // Depends on return travel
    editable: true,
    skippable: false
  })

  // Validate and normalize phases
  const validatedPhases = validateAndNormalizePhases(phases, budget.totalBudget)

  return { phases: validatedPhases }
}

/**
 * Validate phases and ensure budget allocation is correct
 */
function validateAndNormalizePhases(phases: PhaseTemplate[], totalBudget: number): PhaseTemplate[] {
  // Calculate total allocated budget
  const totalAllocated = phases.reduce((sum, phase) => sum + phase.budget_allocated, 0)

  // If there's a discrepancy, adjust the contingency (last phase with budget)
  const difference = totalBudget - totalAllocated

  if (Math.abs(difference) > 1) {
    // Find a suitable phase to adjust (prefer accommodation or contingency-related)
    const accommodationPhase = phases.find(p => p.type === 'ACCOMMODATION')
    if (accommodationPhase) {
      accommodationPhase.budget_allocated += difference
    } else if (phases.length > 0) {
      // Fallback: adjust first phase with budget
      const firstBudgetedPhase = phases.find(p => p.budget_allocated > 0)
      if (firstBudgetedPhase) {
        firstBudgetedPhase.budget_allocated += difference
      }
    }
  }

  // Renumber orders to be sequential
  phases.forEach((phase, index) => {
    phase.order = index + 1
  })

  return phases
}

/**
 * Topological sort for dependency resolution (future enhancement)
 * Currently phases are already ordered correctly by construction
 */
function topologicalSort(phases: PhaseTemplate[]): PhaseTemplate[] {
  // For now, phases are added in correct order
  // This function is a placeholder for future complex dependency resolution
  return phases
}
