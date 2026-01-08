// Erasmus+ Unit Cost Tables (2024-2027 Programme)
// Source: European Commission Decision on Lump Sums & Unit Costs
// Programme Guide for Erasmus+ 2024-2027

/**
 * Organisational Support rates per participant per day (activity days only)
 * Key: ISO 3166-1 alpha-2 country code of HOST country
 *
 * This covers costs related to implementing learning, teaching, training activities
 * including preparation, monitoring, support and validation of learning outcomes.
 */
export const ORGANISATIONAL_SUPPORT_RATES: Record<string, number> = {
  // Group 1: Highest cost countries
  'DK': 125, // Denmark
  'IS': 125, // Iceland
  'IE': 125, // Ireland
  'LI': 125, // Liechtenstein
  'LU': 125, // Luxembourg
  'NO': 125, // Norway

  // Group 2: High cost countries
  'SE': 108, // Sweden
  'AT': 104, // Austria
  'FI': 104, // Finland
  'UK': 104, // United Kingdom

  // Group 3: Medium-high cost countries
  'BE': 99,  // Belgium
  'FR': 99,  // France
  'DE': 99,  // Germany
  'IT': 99,  // Italy
  'NL': 99,  // Netherlands

  // Group 4: Medium cost countries
  'ES': 88,  // Spain
  'CY': 88,  // Cyprus
  'GR': 88,  // Greece
  'MT': 88,  // Malta
  'PT': 88,  // Portugal

  // Group 5: Medium-low cost countries
  'SI': 76,  // Slovenia

  // Group 6: Low cost countries
  'EE': 64,  // Estonia
  'HR': 64,  // Croatia
  'LV': 64,  // Latvia
  'LT': 64,  // Lithuania
  'PL': 64,  // Poland
  'SK': 64,  // Slovakia
  'CZ': 64,  // Czech Republic
  'HU': 64,  // Hungary

  // Group 7: Very low cost countries
  'BG': 55,  // Bulgaria
  'RO': 55,  // Romania

  // Partner countries (adjacent to EU)
  'TR': 46,  // Turkey
  'MK': 34,  // North Macedonia
  'RS': 34,  // Serbia
  'BA': 34,  // Bosnia and Herzegovina
  'AL': 34,  // Albania
  'ME': 34,  // Montenegro
  'XK': 34,  // Kosovo
}

/**
 * Individual Support rates per participant per day (all days: activity + travel)
 * Key: ISO 3166-1 alpha-2 country code of HOST country
 *
 * This covers accommodation and subsistence costs during the activity and travel days.
 */
export const INDIVIDUAL_SUPPORT_RATES: Record<string, number> = {
  // Group 1: Highest cost countries
  'DK': 83,
  'IS': 83,
  'IE': 83,
  'LI': 83,
  'LU': 83,
  'NO': 83,

  // Group 2: High cost countries
  'SE': 76,
  'AT': 76,
  'FI': 76,
  'UK': 76,

  // Group 3: Medium-high cost countries
  'BE': 69,
  'FR': 69,
  'DE': 69,
  'IT': 69,
  'NL': 69,

  // Group 4: Medium cost countries
  'ES': 61,
  'CY': 61,
  'GR': 61,
  'MT': 61,
  'PT': 61,

  // Group 5: Medium-low cost countries
  'SI': 55,

  // Group 6: Low cost countries
  'EE': 50,
  'HR': 50,
  'LV': 50,
  'LT': 50,
  'PL': 50,
  'SK': 50,
  'CZ': 50,
  'HU': 50,

  // Group 7: Very low cost countries
  'BG': 46,
  'RO': 46,

  // Partner countries
  'TR': 43,
  'MK': 41,
  'RS': 41,
  'BA': 41,
  'AL': 41,
  'ME': 41,
  'XK': 41,
}

/**
 * Travel distance bands for calculating travel support per participant
 * Based on distance from origin to destination
 *
 * Distance is calculated using the European Commission's Distance Calculator
 * (https://ec.europa.eu/programmes/erasmus-plus/resources/distance-calculator_en)
 * which uses the Haversine formula.
 */
export const TRAVEL_DISTANCE_BANDS = [
  { min: 10, max: 99, amount: 20 },
  { min: 100, max: 499, amount: 180 },
  { min: 500, max: 1999, amount: 275 },
  { min: 2000, max: 2999, amount: 360 },
  { min: 3000, max: 3999, amount: 530 },
  { min: 4000, max: 7999, amount: 820 },
  { min: 8000, max: Infinity, amount: 1500 },
]

/**
 * Get organisational support rate for a host country
 * @param hostCountryCode ISO 3166-1 alpha-2 country code
 * @returns Rate per participant per day in EUR
 */
export function getOrganisationalSupportRate(hostCountryCode: string): number {
  const rate = ORGANISATIONAL_SUPPORT_RATES[hostCountryCode.toUpperCase()]
  if (!rate) {
    throw new Error(`Unknown host country code: ${hostCountryCode}`)
  }
  return rate
}

/**
 * Get individual support rate for a host country
 * @param hostCountryCode ISO 3166-1 alpha-2 country code
 * @returns Rate per participant per day in EUR
 */
export function getIndividualSupportRate(hostCountryCode: string): number {
  const rate = INDIVIDUAL_SUPPORT_RATES[hostCountryCode.toUpperCase()]
  if (!rate) {
    throw new Error(`Unknown host country code: ${hostCountryCode}`)
  }
  return rate
}

/**
 * Get travel support amount based on distance
 * @param distanceKm Distance in kilometers
 * @returns Amount per participant in EUR
 */
export function getTravelSupport(distanceKm: number): number {
  const band = TRAVEL_DISTANCE_BANDS.find(
    (b) => distanceKm >= b.min && distanceKm <= b.max
  )
  if (!band) {
    throw new Error(`Invalid distance: ${distanceKm}km`)
  }
  return band.amount
}
