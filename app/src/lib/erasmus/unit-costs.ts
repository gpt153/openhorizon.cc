// Erasmus+ Unit Cost Tables (2024-2027 Programme)
// Source: EC Decision on Lump Sums & Unit Costs

export const ORGANISATIONAL_SUPPORT_RATES: Record<string, number> = {
  // Rates per participant per day (activity days only)
  // Key: ISO 3166-1 alpha-2 country code of HOST country
  'DK': 125, // Denmark (highest)
  'IS': 125, // Iceland
  'IE': 125, // Ireland
  'LI': 125, // Liechtenstein
  'LU': 125, // Luxembourg
  'NO': 125, // Norway
  'SE': 108, // Sweden
  'AT': 104, // Austria
  'FI': 104, // Finland
  'UK': 104, // United Kingdom
  'BE': 99,  // Belgium
  'FR': 99,  // France
  'DE': 99,  // Germany
  'IT': 99,  // Italy
  'NL': 99,  // Netherlands
  'ES': 88,  // Spain
  'CY': 88,  // Cyprus
  'GR': 88,  // Greece
  'MT': 88,  // Malta
  'PT': 88,  // Portugal
  'SI': 76,  // Slovenia
  'EE': 64,  // Estonia
  'HR': 64,  // Croatia
  'LV': 64,  // Latvia
  'LT': 64,  // Lithuania
  'PL': 64,  // Poland
  'SK': 64,  // Slovakia
  'CZ': 64,  // Czech Republic
  'HU': 64,  // Hungary
  'BG': 55,  // Bulgaria
  'RO': 55,  // Romania
  'TR': 46,  // Turkey
  'MK': 34,  // North Macedonia (lowest)
  'RS': 34,  // Serbia
  // Add more as needed
}

export const INDIVIDUAL_SUPPORT_RATES: Record<string, number> = {
  // Rates per participant per day (all days: activity + travel)
  // Key: ISO 3166-1 alpha-2 country code of HOST country
  'DK': 83,
  'IS': 83,
  'IE': 83,
  'LI': 83,
  'LU': 83,
  'NO': 83,
  'SE': 76,
  'AT': 76,
  'FI': 76,
  'UK': 76,
  'BE': 69,
  'FR': 69,
  'DE': 69,
  'IT': 69,
  'NL': 69,
  'ES': 61,
  'CY': 61,
  'GR': 61,
  'MT': 61,
  'PT': 61,
  'SI': 55,
  'EE': 50,
  'HR': 50,
  'LV': 50,
  'LT': 50,
  'PL': 50,
  'SK': 50,
  'CZ': 50,
  'HU': 50,
  'BG': 46,
  'RO': 46,
  'TR': 43,
  'MK': 41,
  'RS': 41,
}

export const TRAVEL_DISTANCE_BANDS = [
  { min: 10, max: 99, amount: 20 },
  { min: 100, max: 499, amount: 180 },
  { min: 500, max: 1999, amount: 275 },
  { min: 2000, max: 2999, amount: 360 },
  { min: 3000, max: 3999, amount: 530 },
  { min: 4000, max: 7999, amount: 820 },
  { min: 8000, max: Infinity, amount: 1500 },
]

export const GREEN_TRAVEL_SUPPLEMENT = 50 // Per participant

export const INCLUSION_SUPPORT = 125 // Per participant with fewer opportunities

export function getOrganisationalRate(hostCountryCode: string): number {
  const rate = ORGANISATIONAL_SUPPORT_RATES[hostCountryCode]
  if (!rate) {
    throw new Error(`No organisational support rate found for country: ${hostCountryCode}`)
  }
  return rate
}

export function getIndividualRate(hostCountryCode: string): number {
  const rate = INDIVIDUAL_SUPPORT_RATES[hostCountryCode]
  if (!rate) {
    throw new Error(`No individual support rate found for country: ${hostCountryCode}`)
  }
  return rate
}

export function getTravelAmount(distanceKm: number): number {
  const band = TRAVEL_DISTANCE_BANDS.find(
    b => distanceKm >= b.min && distanceKm <= b.max
  )

  if (!band) {
    throw new Error(`No travel band found for distance: ${distanceKm}km`)
  }

  return band.amount
}
