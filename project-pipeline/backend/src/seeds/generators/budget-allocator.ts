/**
 * Budget Allocator
 *
 * Intelligently distributes project budget across phases based on
 * project characteristics, best practices, and Erasmus+ guidelines.
 */

import type { BudgetInput, BudgetOutput, RichSeedMetadata } from './types.js'

/**
 * Base budget allocation percentages (Erasmus+ best practices)
 */
const BASE_PERCENTAGES = {
  travel: 0.30,          // 30% - Flights, trains, local transport
  accommodation: 0.25,   // 25% - Hotels, hostels, venues
  food: 0.15,            // 15% - Meals, catering
  activities: 0.15,      // 15% - Workshops, materials, facilitators
  staffing: 0.08,        // 8%  - Staff travel, accommodation
  insurance: 0.03,       // 3%  - Group travel insurance
  permits: 0.01,         // 1%  - Event permits, venue permits
  application: 0.01,     // 1%  - Admin costs
  contingency: 0.02,     // 2%  - Buffer for unexpected costs
}

/**
 * Determine if destination requires long-distance travel
 * (>1500km or different continent)
 */
function hasLongDistanceTravel(destination: string, participantCountries: string[]): boolean {
  // Simplified heuristic: Check for cross-continental travel
  const europeanCountries = ['ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'PT', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'HU', 'GR', 'TR', 'RO', 'BG']

  // Extract country name from destination (e.g., "Barcelona, Spain" -> "Spain")
  const destCountryName = destination.split(',').pop()?.trim().toLowerCase() || 'spain'

  // Map common country names to codes
  const countryNameMap: Record<string, string> = {
    'spain': 'ES', 'france': 'FR', 'germany': 'DE', 'italy': 'IT',
    'netherlands': 'NL', 'belgium': 'BE', 'portugal': 'PT', 'austria': 'AT',
    'sweden': 'SE', 'norway': 'NO', 'finland': 'FI', 'denmark': 'DK',
    'poland': 'PL', 'czech republic': 'CZ', 'hungary': 'HU', 'greece': 'GR',
    'turkey': 'TR', 'romania': 'RO', 'bulgaria': 'BG'
  }

  const destCountry = countryNameMap[destCountryName] || 'ES'

  // If destination or any participant is outside Europe, it's long distance
  const nonEuropeanParticipants = participantCountries.filter(c => !europeanCountries.includes(c))
  return nonEuropeanParticipants.length > 0 || !europeanCountries.includes(destCountry)
}

/**
 * Determine if destination has high accommodation costs
 */
function hasHighAccommodationCosts(destination: string): boolean {
  const highCostCities = [
    'london', 'paris', 'zurich', 'geneva', 'oslo', 'copenhagen',
    'stockholm', 'reykjavik', 'dublin', 'amsterdam', 'brussels',
    'luxembourg', 'vienna', 'helsinki'
  ]

  const destLower = destination.toLowerCase()
  return highCostCities.some(city => destLower.includes(city))
}

/**
 * Allocate budget intelligently across categories
 *
 * @param metadata - Rich seed metadata
 * @returns Budget breakdown with allocations and justification
 */
export function allocateBudget(metadata: RichSeedMetadata): BudgetOutput {
  const totalBudget = metadata.estimatedBudget
  const participants = metadata.participants
  const duration = metadata.duration
  const destination = metadata.destination
  const activities = metadata.activities

  // Start with base percentages
  let percentages = { ...BASE_PERCENTAGES }

  // Adjustment tracking for justification
  const adjustments: string[] = []

  // ADJUSTMENT 1: Long-distance travel
  const isLongDistance = hasLongDistanceTravel(destination, metadata.participantCountries)
  if (isLongDistance) {
    percentages.travel = 0.35
    percentages.activities = 0.13
    adjustments.push('Increased travel budget for long-distance flights')
  }

  // ADJUSTMENT 2: Workshop-heavy program
  const workshopCount = activities.filter(a => a.type === 'workshop').length
  if (workshopCount >= 3) {
    percentages.activities = 0.20
    percentages.accommodation = 0.23
    adjustments.push(`Increased activities budget for ${workshopCount} workshops`)
  }

  // ADJUSTMENT 3: High accommodation costs
  if (hasHighAccommodationCosts(destination)) {
    percentages.accommodation = 0.30
    percentages.food = 0.13
    adjustments.push('Increased accommodation budget for high-cost destination')
  }

  // ADJUSTMENT 4: Large group
  if (participants >= 50) {
    percentages.contingency = 0.05
    percentages.staffing = 0.06
    percentages.activities = Math.max(0.10, percentages.activities - 0.01) // Reduce activities to compensate
    adjustments.push('Increased contingency for large group')
  }

  // ADJUSTMENT 5: Short duration
  if (duration <= 3) {
    percentages.food = 0.10
    percentages.travel = percentages.travel + 0.03
    adjustments.push('Adjusted food/travel ratio for short duration')
  }

  // Normalize percentages to ensure they sum to 1.0
  const sum = Object.values(percentages).reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1.0) > 0.01) {
    // Adjust application fees (least impactful category) to make it sum to 1.0
    const diff = 1.0 - sum
    percentages.application = Math.max(0, percentages.application + diff)
  }

  // Calculate absolute amounts
  const breakdown = {
    travel: Math.round(totalBudget * percentages.travel),
    accommodation: Math.round(totalBudget * percentages.accommodation),
    food: Math.round(totalBudget * percentages.food),
    activities: Math.round(totalBudget * percentages.activities),
    staffing: Math.round(totalBudget * percentages.staffing),
    insurance: Math.round(totalBudget * percentages.insurance),
    permits: Math.round(totalBudget * percentages.permits),
    application: Math.round(totalBudget * percentages.application),
    contingency: Math.round(totalBudget * percentages.contingency),
  }

  // Ensure total equals input (handle rounding)
  const allocatedSum = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const difference = totalBudget - allocatedSum
  if (difference !== 0) {
    breakdown.contingency += difference
  }

  // Phase allocations (will be mapped to actual phase IDs later)
  const phaseAllocations = new Map<string, number>()
  phaseAllocations.set('TRAVEL_OUTBOUND', Math.round(breakdown.travel * 0.40))
  phaseAllocations.set('TRAVEL_RETURN', Math.round(breakdown.travel * 0.40))
  phaseAllocations.set('LOCAL_TRANSPORT', Math.round(breakdown.travel * 0.20))
  phaseAllocations.set('ACCOMMODATION', breakdown.accommodation)
  phaseAllocations.set('FOOD', breakdown.food)
  phaseAllocations.set('INSURANCE', breakdown.insurance)
  phaseAllocations.set('PERMITS', breakdown.permits)
  phaseAllocations.set('APPLICATION', breakdown.application)
  phaseAllocations.set('REPORTING', 0)

  // Split activities budget across activity phases
  const activityCount = activities.length || 1
  const perActivityBudget = Math.round(breakdown.activities / activityCount)
  activities.forEach((activity, index) => {
    phaseAllocations.set(`ACTIVITY_${index}`, perActivityBudget)
  })

  // Build justification
  let justification = `Budget allocated for ${participants} participants over ${duration} days in ${destination}. `
  if (adjustments.length > 0) {
    justification += 'Adjustments: ' + adjustments.join('; ') + '.'
  } else {
    justification += 'Standard allocation based on Erasmus+ best practices.'
  }

  return {
    totalBudget,
    breakdown,
    phaseAllocations,
    justification
  }
}

/**
 * Allocate budget from input (legacy compatibility)
 */
export function allocateBudgetFromInput(input: BudgetInput): BudgetOutput {
  const metadata: RichSeedMetadata = {
    title: '',
    description: '',
    participants: input.participants,
    duration: input.duration,
    destination: input.destination,
    participantCountries: [],
    activities: input.activities,
    startDate: null,
    estimatedBudget: input.totalBudget,
    tags: [],
    isPublicEvent: false,
    hasWorkshops: input.hasWorkshops,
    requiresPermits: false
  }

  return allocateBudget(metadata)
}
