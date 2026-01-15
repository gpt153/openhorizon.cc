/**
 * Timeline Generator
 *
 * Calculates project timeline with preparation, exchange, and follow-up periods.
 * Generates phase-specific dates based on dependencies and best practices.
 */

import type { PhaseType } from '@prisma/client'
import type { TimelineInput, TimelineOutput, RichSeedMetadata } from './types.js'

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + (weeks * 7))
  return result
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Generate project timeline from seed metadata
 *
 * @param metadata - Rich seed metadata with dates and activities
 * @returns Complete timeline with preparation, exchange, and follow-up periods
 */
export function generateTimeline(metadata: RichSeedMetadata): TimelineOutput {
  // Validate input
  if (!metadata.startDate) {
    throw new Error('Seed must have a start date for timeline generation')
  }

  if (metadata.duration < 1) {
    throw new Error('Seed duration must be at least 1 day')
  }

  const exchangeStart = new Date(metadata.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (exchangeStart < today) {
    throw new Error('Exchange start date cannot be in the past')
  }

  // Calculate exchange period
  const exchangeDays = metadata.duration
  const exchangeEnd = addDays(exchangeStart, exchangeDays)

  // Calculate preparation period
  // Default: 10 weeks
  // Extended to 12 weeks if:
  // - Visa required (non-EU participants)
  // - Complex activities (3+ workshops)
  const hasComplexActivities = metadata.activities.filter(
    a => a.type === 'workshop'
  ).length >= 3

  const needsExtendedPrep = metadata.requiresPermits || hasComplexActivities
  const prepWeeks = needsExtendedPrep ? 12 : 10

  const prepStart = addWeeks(exchangeStart, -prepWeeks)
  const prepEnd = addDays(exchangeStart, -1)

  // Calculate follow-up period (4 weeks = 30 days)
  const followUpStart = addDays(exchangeEnd, 1)
  const followUpEnd = addDays(followUpStart, 30) // 30 days duration

  // Calculate phase-specific dates
  const phaseDates = new Map<PhaseType, { startDate: Date; endDate: Date; deadline: Date }>()

  // APPLICATION: From prep start to 12 weeks before exchange
  phaseDates.set('APPLICATION', {
    startDate: prepStart,
    endDate: addWeeks(exchangeStart, -11),
    deadline: addWeeks(exchangeStart, -12)
  })

  // PERMITS (if needed): 12-8 weeks before
  phaseDates.set('PERMITS', {
    startDate: addWeeks(exchangeStart, -12),
    endDate: addWeeks(exchangeStart, -6),
    deadline: addWeeks(exchangeStart, -8)
  })

  // INSURANCE: 6-4 weeks before
  phaseDates.set('INSURANCE', {
    startDate: addWeeks(exchangeStart, -6),
    endDate: addWeeks(exchangeStart, -4),
    deadline: addWeeks(exchangeStart, -6)
  })

  // ACCOMMODATION: 6-2 weeks before
  phaseDates.set('ACCOMMODATION', {
    startDate: addWeeks(exchangeStart, -6),
    endDate: addWeeks(exchangeStart, -2),
    deadline: addWeeks(exchangeStart, -4)
  })

  // TRAVEL (outbound): 4 weeks before to 1 day before
  phaseDates.set('TRAVEL', {
    startDate: addWeeks(exchangeStart, -4),
    endDate: addDays(exchangeStart, -1),
    deadline: addWeeks(exchangeStart, -2)
  })

  // FOOD: 2 weeks before to exchange end
  phaseDates.set('FOOD', {
    startDate: addWeeks(exchangeStart, -2),
    endDate: exchangeEnd,
    deadline: addWeeks(exchangeStart, -1)
  })

  // ACTIVITIES: During exchange period
  phaseDates.set('ACTIVITIES', {
    startDate: exchangeStart,
    endDate: exchangeEnd,
    deadline: addDays(exchangeEnd, -1)
  })

  // EVENTS: During exchange period
  phaseDates.set('EVENTS', {
    startDate: exchangeStart,
    endDate: exchangeEnd,
    deadline: exchangeEnd
  })

  // REPORTING: Follow-up period
  phaseDates.set('REPORTING', {
    startDate: followUpStart,
    endDate: followUpEnd,
    deadline: followUpEnd
  })

  return {
    preparation: {
      startDate: prepStart,
      endDate: prepEnd,
      durationWeeks: prepWeeks
    },
    exchange: {
      startDate: exchangeStart,
      endDate: exchangeEnd,
      durationDays: exchangeDays
    },
    followUp: {
      startDate: followUpStart,
      endDate: followUpEnd,
      durationWeeks: 4
    },
    phaseDates
  }
}

/**
 * Generate timeline from input (legacy compatibility)
 */
export function generateTimelineFromInput(input: TimelineInput): TimelineOutput {
  const metadata: RichSeedMetadata = {
    title: '',
    description: '',
    participants: 20,
    duration: input.exchangeDuration,
    destination: '',
    participantCountries: [],
    activities: input.activities,
    startDate: input.exchangeStartDate,
    estimatedBudget: 50000,
    tags: [],
    isPublicEvent: false,
    hasWorkshops: input.activities.some(a => a.type === 'workshop'),
    requiresPermits: input.requiresVisa
  }

  return generateTimeline(metadata)
}
