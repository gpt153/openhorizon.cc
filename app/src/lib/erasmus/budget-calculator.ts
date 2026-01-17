// Erasmus+ Budget Calculator (2024-2027 Unit Costs)
// Based on PRD Section 5 and Appendix A

// Per Diem Rates by Country (€/day)
export const PER_DIEM_RATES: Record<string, number> = {
  AT: 58, BE: 60, BG: 37, HR: 47, CY: 50,
  CZ: 40, DK: 65, EE: 43, FI: 62, FR: 56,
  DE: 55, GR: 50, HU: 40, IS: 65, IE: 60,
  IT: 53, LV: 43, LI: 62, LT: 43, LU: 60,
  MT: 50, NL: 60, NO: 70, PL: 40, PT: 48,
  RO: 37, SK: 40, SI: 47, ES: 42, SE: 62,
  TR: 37, MK: 37, RS: 37,
}

// Travel Distance Bands (Erasmus+ 2024-2027)
export const TRAVEL_DISTANCE_BANDS = [
  { min: 10, max: 99, amount: 23, greenBonus: 30 },
  { min: 100, max: 499, amount: 180, greenBonus: 40 },
  { min: 500, max: 1999, amount: 275, greenBonus: 0 },
  { min: 2000, max: 2999, amount: 360, greenBonus: 0 },
  { min: 3000, max: 3999, amount: 530, greenBonus: 0 },
  { min: 4000, max: 7999, amount: 820, greenBonus: 0 },
  { min: 8000, max: Infinity, amount: 1500, greenBonus: 0 },
]

// Organizational Support (lump sum based on participant count)
export function getOrganizationalSupport(participantCount: number): number {
  if (participantCount <= 0) {
    throw new Error('Participant count must be positive')
  }
  if (participantCount >= 1 && participantCount <= 10) {
    return 500
  }
  if (participantCount >= 11 && participantCount <= 30) {
    return 750
  }
  if (participantCount >= 31 && participantCount <= 60) {
    return 1000
  }
  // For projects with more than 60 participants, use the highest tier
  return 1000
}

// Get per diem rate for destination country
export function getPerDiemRate(countryCode: string): number {
  const rate = PER_DIEM_RATES[countryCode.toUpperCase()]
  if (!rate) {
    throw new Error(`No per diem rate found for country: ${countryCode}`)
  }
  return rate
}

// Get travel amount and bonus for distance
export function getTravelCost(
  distanceKm: number,
  useGreenTravel: boolean = false
): { amount: number; greenBonus: number; band: string } {
  if (distanceKm < 10) {
    throw new Error('Distance must be at least 10 km')
  }

  const band = TRAVEL_DISTANCE_BANDS.find(
    (b) => distanceKm >= b.min && distanceKm <= b.max
  )

  if (!band) {
    throw new Error(`No travel band found for distance: ${distanceKm}km`)
  }

  const greenBonus = useGreenTravel ? band.greenBonus : 0

  return {
    amount: band.amount,
    greenBonus,
    band: `${band.min}-${band.max === Infinity ? '∞' : band.max} km`,
  }
}

// Calculate distance using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance)
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// Input and output types
export interface BudgetInput {
  participantsByCountry: Record<string, number> // e.g., { SE: 15, DE: 10, PL: 5 }
  destinationCity: string
  destinationCountry: string
  durationDays: number
  useGreenTravel?: boolean
}

export interface TravelCostByCountry {
  participants: number
  distance: number
  distanceBand: string
  costPerParticipant: number
  totalCost: number
  greenBonus?: number
}

export interface BudgetOutput {
  travelCosts: Record<string, TravelCostByCountry>
  individualSupport: {
    perDiem: number
    days: number
    participants: number
    totalCost: number
  }
  organizationalSupport: number
  totalBudget: number
  breakdown: {
    travel: number
    perDiem: number
    organizational: number
  }
}

// Main budget calculation function
export async function calculateBudget(
  input: BudgetInput,
  destinationCoords: { lat: number; lon: number },
  originCoordsByCountry: Record<string, { lat: number; lon: number }>
): Promise<BudgetOutput> {
  // Validate inputs
  if (input.durationDays <= 0) {
    throw new Error('Duration must be at least 1 day')
  }

  const totalParticipants = Object.values(input.participantsByCountry).reduce(
    (sum, count) => sum + count,
    0
  )

  if (totalParticipants <= 0) {
    throw new Error('Must have at least 1 participant')
  }

  // Calculate travel costs by country
  const travelCosts: Record<string, TravelCostByCountry> = {}
  let totalTravelCost = 0

  for (const [country, participantCount] of Object.entries(
    input.participantsByCountry
  )) {
    if (participantCount <= 0) continue

    const originCoords = originCoordsByCountry[country]
    if (!originCoords) {
      throw new Error(`No coordinates found for origin country: ${country}`)
    }

    const distance = calculateDistance(
      originCoords.lat,
      originCoords.lon,
      destinationCoords.lat,
      destinationCoords.lon
    )

    const { amount, greenBonus, band } = getTravelCost(
      distance,
      input.useGreenTravel
    )

    const costPerParticipant = amount + greenBonus
    const totalCost = costPerParticipant * participantCount

    travelCosts[country] = {
      participants: participantCount,
      distance,
      distanceBand: band,
      costPerParticipant,
      totalCost,
      greenBonus: greenBonus > 0 ? greenBonus : undefined,
    }

    totalTravelCost += totalCost
  }

  // Calculate individual support (per diem)
  const perDiemRate = getPerDiemRate(input.destinationCountry)
  const individualSupportTotal =
    totalParticipants * input.durationDays * perDiemRate

  // Calculate organizational support
  const organizationalSupport = getOrganizationalSupport(totalParticipants)

  // Calculate total budget
  const totalBudget =
    totalTravelCost + individualSupportTotal + organizationalSupport

  return {
    travelCosts,
    individualSupport: {
      perDiem: perDiemRate,
      days: input.durationDays,
      participants: totalParticipants,
      totalCost: individualSupportTotal,
    },
    organizationalSupport,
    totalBudget,
    breakdown: {
      travel: totalTravelCost,
      perDiem: individualSupportTotal,
      organizational: organizationalSupport,
    },
  }
}
