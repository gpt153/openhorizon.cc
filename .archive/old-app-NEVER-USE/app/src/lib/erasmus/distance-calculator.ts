/**
 * Calculate distance between two geographic coordinates using the Haversine formula
 * This matches the European Commission's Distance Calculator methodology
 *
 * @param lat1 Latitude of origin in decimal degrees
 * @param lon1 Longitude of origin in decimal degrees
 * @param lat2 Latitude of destination in decimal degrees
 * @param lon2 Longitude of destination in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
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

  return Math.round(distance) // Round to nearest km
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Major European city coordinates for quick distance estimation
 * Based on capital cities
 */
export const CITY_COORDINATES: Record<
  string,
  { lat: number; lon: number; country: string }
> = {
  // Western Europe
  Amsterdam: { lat: 52.3676, lon: 4.9041, country: 'NL' },
  Athens: { lat: 37.9838, lon: 23.7275, country: 'GR' },
  Berlin: { lat: 52.52, lon: 13.405, country: 'DE' },
  Brussels: { lat: 50.8503, lon: 4.3517, country: 'BE' },
  Copenhagen: { lat: 55.6761, lon: 12.5683, country: 'DK' },
  Dublin: { lat: 53.3498, lon: -6.2603, country: 'IE' },
  Helsinki: { lat: 60.1699, lon: 24.9384, country: 'FI' },
  Lisbon: { lat: 38.7223, lon: -9.1393, country: 'PT' },
  London: { lat: 51.5074, lon: -0.1278, country: 'UK' },
  Luxembourg: { lat: 49.6116, lon: 6.1319, country: 'LU' },
  Madrid: { lat: 40.4168, lon: -3.7038, country: 'ES' },
  Oslo: { lat: 59.9139, lon: 10.7522, country: 'NO' },
  Paris: { lat: 48.8566, lon: 2.3522, country: 'FR' },
  Reykjavik: { lat: 64.1466, lon: -21.9426, country: 'IS' },
  Rome: { lat: 41.9028, lon: 12.4964, country: 'IT' },
  Stockholm: { lat: 59.3293, lon: 18.0686, country: 'SE' },
  Vienna: { lat: 48.2082, lon: 16.3738, country: 'AT' },

  // Eastern Europe
  Belgrade: { lat: 44.7866, lon: 20.4489, country: 'RS' },
  Bratislava: { lat: 48.1486, lon: 17.1077, country: 'SK' },
  Bucharest: { lat: 44.4268, lon: 26.1025, country: 'RO' },
  Budapest: { lat: 47.4979, lon: 19.0402, country: 'HU' },
  Prague: { lat: 50.0755, lon: 14.4378, country: 'CZ' },
  Riga: { lat: 56.9496, lon: 24.1052, country: 'LV' },
  Sofia: { lat: 42.6977, lon: 23.3219, country: 'BG' },
  Tallinn: { lat: 59.437, lon: 24.7536, country: 'EE' },
  Vilnius: { lat: 54.6872, lon: 25.2797, country: 'LT' },
  Warsaw: { lat: 52.2297, lon: 21.0122, country: 'PL' },
  Zagreb: { lat: 45.815, lon: 15.9819, country: 'HR' },

  // Southern Europe
  Barcelona: { lat: 41.3851, lon: 2.1734, country: 'ES' },
  Ljubljana: { lat: 46.0569, lon: 14.5058, country: 'SI' },
  Nicosia: { lat: 35.1856, lon: 33.3823, country: 'CY' },
  Valletta: { lat: 35.8989, lon: 14.5146, country: 'MT' },

  // Partner countries
  Ankara: { lat: 39.9334, lon: 32.8597, country: 'TR' },
  Istanbul: { lat: 41.0082, lon: 28.9784, country: 'TR' },
  Sarajevo: { lat: 43.8563, lon: 18.4131, country: 'BA' },
  Skopje: { lat: 41.9973, lon: 21.4280, country: 'MK' },
  Tirana: { lat: 41.3275, lon: 19.8187, country: 'AL' },
}

/**
 * Calculate distance between two cities by name
 * @param origin City name
 * @param destination City name
 * @returns Distance in kilometers
 */
export function calculateCityDistance(
  origin: string,
  destination: string
): number {
  const originCoords = CITY_COORDINATES[origin]
  const destCoords = CITY_COORDINATES[destination]

  if (!originCoords) {
    throw new Error(`Unknown origin city: ${origin}`)
  }
  if (!destCoords) {
    throw new Error(`Unknown destination city: ${destination}`)
  }

  return calculateDistance(
    originCoords.lat,
    originCoords.lon,
    destCoords.lat,
    destCoords.lon
  )
}
