/**
 * Requirements Analyzer
 *
 * Identifies project requirements including visas, insurance, permits,
 * and accessibility needs based on project characteristics.
 */

import type { RequirementsInput, RequirementsOutput, RichSeedMetadata } from './types.js'

/**
 * Schengen Area countries (as of 2026)
 */
const SCHENGEN_COUNTRIES = [
  'AT', 'BE', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
  'PT', 'SK', 'SI', 'ES', 'SE', 'CH'
]

/**
 * European Union member states (as of 2026)
 */
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]

/**
 * Extract country code from destination string
 * Format: "City, Country" or "City" or just country code
 */
function extractCountryCode(destination: string): string {
  // Common patterns: "Barcelona, Spain" → "ES", "Spain" → "ES"
  const countryMap: { [key: string]: string } = {
    'spain': 'ES',
    'france': 'FR',
    'germany': 'DE',
    'italy': 'IT',
    'netherlands': 'NL',
    'belgium': 'BE',
    'portugal': 'PT',
    'greece': 'GR',
    'turkey': 'TR',
    'poland': 'PL',
    'austria': 'AT',
    'sweden': 'SE',
    'denmark': 'DK',
    'finland': 'FI',
    'norway': 'NO',
    'switzerland': 'CH',
    'czech republic': 'CZ',
    'hungary': 'HU',
    'romania': 'RO',
    'bulgaria': 'BG',
  }

  const destLower = destination.toLowerCase()

  // Try to match full country name
  for (const [country, code] of Object.entries(countryMap)) {
    if (destLower.includes(country)) {
      return code
    }
  }

  // Try to extract 2-letter code at end
  const parts = destination.split(',').map(p => p.trim())
  const lastPart = parts[parts.length - 1]
  if (lastPart.length === 2) {
    return lastPart.toUpperCase()
  }

  // Default to Spain (most common Erasmus+ destination)
  return 'ES'
}

/**
 * Calculate visa application deadline (weeks before exchange)
 */
function calculateVisaDeadline(exchangeStart: Date | null): Date {
  if (!exchangeStart) {
    // Default: 12 weeks from now
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + (12 * 7))
    return deadline
  }

  const deadline = new Date(exchangeStart)
  deadline.setDate(deadline.getDate() - (12 * 7)) // 12 weeks before
  return deadline
}

/**
 * Analyze visa requirements
 */
function analyzeVisaRequirements(
  participantCountries: string[],
  destinationCountry: string,
  exchangeStart: Date | null
): RequirementsOutput['visas'] {
  // Non-EU participants traveling to Schengen area need visa
  const nonEU = participantCountries.filter(c => !EU_COUNTRIES.includes(c))

  if (SCHENGEN_COUNTRIES.includes(destinationCountry) && nonEU.length > 0) {
    return {
      required: true,
      countries: nonEU,
      type: 'schengen',
      deadline: calculateVisaDeadline(exchangeStart)
    }
  }

  // Non-Schengen EU country
  if (EU_COUNTRIES.includes(destinationCountry) && nonEU.length > 0) {
    return {
      required: true,
      countries: nonEU,
      type: 'national',
      deadline: calculateVisaDeadline(exchangeStart)
    }
  }

  // No visa required (all EU citizens or destination outside system)
  return {
    required: false,
    countries: [],
    type: 'none',
    deadline: new Date()
  }
}

/**
 * Analyze insurance requirements
 */
function analyzeInsuranceRequirements(participants: number): RequirementsOutput['insurance'] {
  if (participants >= 10) {
    return {
      required: true,
      type: 'group_travel',
      coverage: ['medical', 'liability', 'trip_cancellation', 'emergency_evacuation']
    }
  }

  return {
    required: true,
    type: 'individual',
    coverage: ['medical', 'liability']
  }
}

/**
 * Analyze permit requirements
 */
function analyzePermitRequirements(
  activities: RichSeedMetadata['activities'],
  isPublicEvent: boolean,
  hasFood: boolean
): RequirementsOutput['permits'] {
  const permits: RequirementsOutput['permits']['types'] = []

  // Event permit for public gatherings
  if (isPublicEvent || activities.some(a => a.type === 'public_event')) {
    permits.push({
      type: 'event',
      reason: 'Public gathering of participants',
      authority: 'Local municipality / city hall'
    })
  }

  // Food handling permit
  if (hasFood || activities.some(a => a.type === 'cooking_workshop')) {
    permits.push({
      type: 'food_handling',
      reason: 'Serving food to participants or cooking activities',
      authority: 'Local health department'
    })
  }

  // Public assembly permit for outdoor activities
  if (activities.some(a => a.isOutdoor)) {
    permits.push({
      type: 'public_assembly',
      reason: 'Outdoor activities in public spaces',
      authority: 'Parks department / public space authority'
    })
  }

  return {
    required: permits.length > 0,
    types: permits
  }
}

/**
 * Analyze accessibility requirements
 */
function analyzeAccessibilityRequirements(
  participants: number
): RequirementsOutput['accessibility'] {
  // Standard accessibility features for all Erasmus+ projects
  return {
    wheelchairAccess: true, // Required by EU regulations
    dietaryRestrictions: true, // Always collect dietary info
    languageSupport: ['EN'] // English as default lingua franca
  }
}

/**
 * Analyze all project requirements
 *
 * @param metadata - Rich seed metadata
 * @returns Complete requirements analysis
 */
export function analyzeRequirements(metadata: RichSeedMetadata): RequirementsOutput {
  const destinationCountry = extractCountryCode(metadata.destination)

  const visas = analyzeVisaRequirements(
    metadata.participantCountries,
    destinationCountry,
    metadata.startDate
  )

  const insurance = analyzeInsuranceRequirements(metadata.participants)

  const permits = analyzePermitRequirements(
    metadata.activities,
    metadata.isPublicEvent,
    metadata.activities.some(a => a.type === 'cooking_workshop')
  )

  const accessibility = analyzeAccessibilityRequirements(metadata.participants)

  return {
    visas,
    insurance,
    permits,
    accessibility
  }
}

/**
 * Analyze requirements from input (legacy compatibility)
 */
export function analyzeRequirementsFromInput(input: RequirementsInput): RequirementsOutput {
  const metadata: RichSeedMetadata = {
    title: '',
    description: '',
    participants: input.participants,
    duration: 7,
    destination: input.destinationCountry,
    participantCountries: input.participantCountries,
    activities: input.activities,
    startDate: null,
    estimatedBudget: 50000,
    tags: [],
    isPublicEvent: input.isPublicEvent,
    hasWorkshops: false,
    requiresPermits: false
  }

  return analyzeRequirements(metadata)
}
