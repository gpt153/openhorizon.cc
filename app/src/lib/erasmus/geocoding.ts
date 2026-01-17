import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'

// Initialize Mapbox client
const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
if (!mapboxToken) {
  console.warn(
    'MAPBOX_ACCESS_TOKEN not set. Geocoding will fail. Please add it to your .env file.'
  )
}

const geocodingClient = mapboxToken
  ? mbxGeocoding({ accessToken: mapboxToken })
  : null

export interface Coordinates {
  lat: number
  lon: number
}

/**
 * Geocode a city and country to coordinates using Mapbox Geocoding API
 * @param city City name
 * @param country Country name or code
 * @returns Coordinates (latitude, longitude)
 */
export async function geocode(
  city: string,
  country: string
): Promise<Coordinates> {
  if (!geocodingClient) {
    throw new Error(
      'Mapbox client not initialized. MAPBOX_ACCESS_TOKEN must be set.'
    )
  }

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: `${city}, ${country}`,
        limit: 1,
        types: ['place'], // Restrict to cities/places
      })
      .send()

    if (
      !response ||
      !response.body ||
      !response.body.features ||
      response.body.features.length === 0
    ) {
      throw new Error(`No results found for: ${city}, ${country}`)
    }

    const [lon, lat] = response.body.features[0].center

    return { lat, lon }
  } catch (error) {
    throw new Error(
      `Failed to geocode ${city}, ${country}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Batch geocode multiple locations
 * @param locations Array of { city, country } pairs
 * @returns Map of location key to coordinates
 */
export async function batchGeocode(
  locations: Array<{ city: string; country: string }>
): Promise<Record<string, Coordinates>> {
  const results: Record<string, Coordinates> = {}

  // Geocode sequentially to avoid rate limits
  for (const location of locations) {
    const key = `${location.city}, ${location.country}`
    try {
      results[key] = await geocode(location.city, location.country)
    } catch (error) {
      console.error(`Failed to geocode ${key}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Get coordinates for European capital cities (fallback if Mapbox is unavailable)
 */
export const FALLBACK_COORDINATES: Record<
  string,
  { lat: number; lon: number }
> = {
  // Use country codes as keys for easy lookup
  AT: { lat: 48.2082, lon: 16.3738 }, // Vienna
  BE: { lat: 50.8503, lon: 4.3517 }, // Brussels
  BG: { lat: 42.6977, lon: 23.3219 }, // Sofia
  HR: { lat: 45.815, lon: 15.9819 }, // Zagreb
  CY: { lat: 35.1856, lon: 33.3823 }, // Nicosia
  CZ: { lat: 50.0755, lon: 14.4378 }, // Prague
  DK: { lat: 55.6761, lon: 12.5683 }, // Copenhagen
  EE: { lat: 59.437, lon: 24.7536 }, // Tallinn
  FI: { lat: 60.1699, lon: 24.9384 }, // Helsinki
  FR: { lat: 48.8566, lon: 2.3522 }, // Paris
  DE: { lat: 52.52, lon: 13.405 }, // Berlin
  GR: { lat: 37.9838, lon: 23.7275 }, // Athens
  HU: { lat: 47.4979, lon: 19.0402 }, // Budapest
  IS: { lat: 64.1466, lon: -21.9426 }, // Reykjavik
  IE: { lat: 53.3498, lon: -6.2603 }, // Dublin
  IT: { lat: 41.9028, lon: 12.4964 }, // Rome
  LV: { lat: 56.9496, lon: 24.1052 }, // Riga
  LI: { lat: 47.166, lon: 9.5554 }, // Vaduz
  LT: { lat: 54.6872, lon: 25.2797 }, // Vilnius
  LU: { lat: 49.6116, lon: 6.1319 }, // Luxembourg
  MT: { lat: 35.8989, lon: 14.5146 }, // Valletta
  NL: { lat: 52.3676, lon: 4.9041 }, // Amsterdam
  NO: { lat: 59.9139, lon: 10.7522 }, // Oslo
  PL: { lat: 52.2297, lon: 21.0122 }, // Warsaw
  PT: { lat: 38.7223, lon: -9.1393 }, // Lisbon
  RO: { lat: 44.4268, lon: 26.1025 }, // Bucharest
  SK: { lat: 48.1486, lon: 17.1077 }, // Bratislava
  SI: { lat: 46.0569, lon: 14.5058 }, // Ljubljana
  ES: { lat: 40.4168, lon: -3.7038 }, // Madrid
  SE: { lat: 59.3293, lon: 18.0686 }, // Stockholm
  TR: { lat: 39.9334, lon: 32.8597 }, // Ankara
  MK: { lat: 41.9973, lon: 21.428 }, // Skopje
  RS: { lat: 44.7866, lon: 20.4489 }, // Belgrade
  UK: { lat: 51.5074, lon: -0.1278 }, // London
}

/**
 * Get fallback coordinates for a country code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Coordinates of capital city
 */
export function getFallbackCoordinates(countryCode: string): Coordinates {
  const coords = FALLBACK_COORDINATES[countryCode.toUpperCase()]
  if (!coords) {
    throw new Error(
      `No fallback coordinates found for country code: ${countryCode}`
    )
  }
  return coords
}
