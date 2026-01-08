import {
  getOrganisationalRate,
  getIndividualRate,
  getTravelAmount,
} from './unit-costs'
import { calculateDistance, calculateCityDistance } from './distance-calculator'

export interface ErasmusGrantCalculationInput {
  // Project details
  hostCountryCode: string // ISO 3166-1 alpha-2
  participantCount: number
  activityDays: number // Number of days of activities (excluding travel)
  travelDays?: number // Optional: defaults to 2 (1 day each way)

  // Distance calculation
  originLat?: number
  originLon?: number
  destinationLat?: number
  destinationLon?: number
  distanceKm?: number // If distance already known

  // Or use city names for quick calculation
  originCity?: string
  destinationCity?: string
}

export interface ErasmusGrantBreakdown {
  organisationalSupport: number
  individualSupport: number
  travelSupport: number
  totalGrant: number
  calculationDetails: {
    organisationalSupportRate: number
    individualSupportRate: number
    travelSupportPerParticipant: number
    activityDays: number
    totalDays: number
    participantCount: number
    distanceKm: number
  }
}

/**
 * Calculate total Erasmus+ grant for a Youth Exchange project
 * Based on official unit costs from the Programme Guide 2024-2027
 *
 * Grant = Organisational Support + Individual Support + Travel Support
 *
 * Where:
 * - Organisational Support = rate/participant/day × participants × activity days
 * - Individual Support = rate/participant/day × participants × total days (activity + travel)
 * - Travel Support = band amount/participant × participants
 *
 * @param input Calculation parameters
 * @returns Detailed breakdown of the grant calculation
 */
export function calculateErasmusGrant(
  input: ErasmusGrantCalculationInput
): ErasmusGrantBreakdown {
  // Validate input
  if (input.participantCount <= 0) {
    throw new Error('Participant count must be positive')
  }
  if (input.activityDays <= 0) {
    throw new Error('Activity days must be positive')
  }

  // Calculate distance
  let distanceKm: number

  if (input.distanceKm !== undefined) {
    distanceKm = input.distanceKm
  } else if (input.originCity && input.destinationCity) {
    distanceKm = calculateCityDistance(input.originCity, input.destinationCity)
  } else if (
    input.originLat !== undefined &&
    input.originLon !== undefined &&
    input.destinationLat !== undefined &&
    input.destinationLon !== undefined
  ) {
    distanceKm = calculateDistance(
      input.originLat,
      input.originLon,
      input.destinationLat,
      input.destinationLon
    )
  } else {
    throw new Error(
      'Must provide either distanceKm, city names, or coordinates for distance calculation'
    )
  }

  // Get rates
  const orgSupportRate = getOrganisationalRate(input.hostCountryCode)
  const indSupportRate = getIndividualRate(input.hostCountryCode)
  const travelSupportPerPax = getTravelAmount(distanceKm)

  // Calculate days
  const travelDays = input.travelDays ?? 2 // Default: 1 day each way
  const totalDays = input.activityDays + travelDays

  // Calculate grant components
  const organisationalSupport =
    orgSupportRate * input.participantCount * input.activityDays

  const individualSupport =
    indSupportRate * input.participantCount * totalDays

  const travelSupport = travelSupportPerPax * input.participantCount

  const totalGrant = organisationalSupport + individualSupport + travelSupport

  return {
    organisationalSupport,
    individualSupport,
    travelSupport,
    totalGrant,
    calculationDetails: {
      organisationalSupportRate: orgSupportRate,
      individualSupportRate: indSupportRate,
      travelSupportPerParticipant: travelSupportPerPax,
      activityDays: input.activityDays,
      totalDays,
      participantCount: input.participantCount,
      distanceKm,
    },
  }
}

/**
 * Calculate profit margin for a project
 * Profit = Erasmus+ Grant - Estimated Costs
 *
 * @param erasmusGrant Total grant amount in EUR
 * @param estimatedCosts Total estimated project costs in EUR
 * @returns Profit margin details
 */
export function calculateProfitMargin(
  erasmusGrant: number,
  estimatedCosts: number
): {
  profit: number
  profitPercentage: number
  isViable: boolean
} {
  const profit = erasmusGrant - estimatedCosts
  const profitPercentage = (profit / erasmusGrant) * 100

  return {
    profit,
    profitPercentage,
    isViable: profit > 0,
  }
}

/**
 * Calculate estimated costs breakdown
 * Useful for initial planning before vendor quotes
 *
 * @param input Project parameters
 * @returns Estimated cost breakdown
 */
export function estimateProjectCosts(input: {
  participantCount: number
  activityDays: number
  accommodationPerPersonPerNight: number
  mealPerPersonPerDay: number
  activityBudget: number
  insurancePerPerson: number
}): {
  accommodation: number
  meals: number
  activities: number
  insurance: number
  total: number
} {
  const accommodation =
    input.accommodationPerPersonPerNight *
    input.participantCount *
    input.activityDays

  const meals =
    input.mealPerPersonPerDay * input.participantCount * input.activityDays

  const activities = input.activityBudget

  const insurance = input.insurancePerPerson * input.participantCount

  const total = accommodation + meals + activities + insurance

  return {
    accommodation,
    meals,
    activities,
    insurance,
    total,
  }
}
