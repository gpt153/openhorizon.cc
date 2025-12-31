import { chromium, Browser, Page } from 'playwright'

export interface HotelScrapedData {
  name: string
  type: 'hotel' | 'hostel' | 'apartment' | 'guesthouse'
  pricePerNight?: number
  priceRange?: string
  rating?: number
  reviewCount?: number
  location: string
  address?: string
  amenities: string[]
  distance?: string
  availability?: boolean
  url: string
  imageUrl?: string
  description?: string
}

export interface ScraperOptions {
  location: string
  checkInDate: Date
  checkOutDate: Date
  guests: number
  maxResults?: number
  beachfront?: boolean
  minRating?: number
}

export class HotelScraper {
  private browser: Browser | null = null
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  /**
   * Initialize browser instance
   */
  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Search for hotels on Booking.com
   */
  async searchBookingCom(options: ScraperOptions): Promise<HotelScrapedData[]> {
    await this.init()
    const page = await this.browser!.newPage({
      userAgent: this.userAgent
    })

    try {
      const checkIn = this.formatDate(options.checkInDate)
      const checkOut = this.formatDate(options.checkOutDate)

      // Construct Booking.com search URL
      const params = new URLSearchParams({
        ss: options.location,
        checkin: checkIn,
        checkout: checkOut,
        group_adults: options.guests.toString(),
        no_rooms: '1',
        group_children: '0'
      })

      if (options.beachfront) {
        params.append('nflt', 'beach_front=1')
      }

      const url = `https://www.booking.com/searchresults.html?${params.toString()}`

      // Navigate with timeout and wait for network idle
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Wait for results to load
      await page.waitForSelector('[data-testid="property-card"]', {
        timeout: 10000
      }).catch(() => {
        console.log('⚠️  Booking.com results not found, page might have changed structure')
      })

      // Extract hotel data
      const hotels = await page.evaluate((maxResults) => {
        const results: HotelScrapedData[] = []
        const cards = document.querySelectorAll('[data-testid="property-card"]')

        const limit = maxResults || cards.length
        for (let i = 0; i < Math.min(cards.length, limit); i++) {
          const card = cards[i]

          try {
            const nameEl = card.querySelector('[data-testid="title"]')
            const priceEl = card.querySelector('[data-testid="price-and-discounted-price"]')
            const ratingEl = card.querySelector('[data-testid="review-score"]')
            const reviewCountEl = card.querySelector('[data-testid="review-score"] + div')
            const addressEl = card.querySelector('[data-testid="address"]')
            const linkEl = card.querySelector('a[data-testid="title-link"]')
            const imageEl = card.querySelector('img[data-testid="image"]')

            const name = nameEl?.textContent?.trim() || 'Unknown Hotel'
            const priceText = priceEl?.textContent?.trim() || ''
            const ratingText = ratingEl?.textContent?.trim() || ''
            const reviewText = reviewCountEl?.textContent?.trim() || ''
            const address = addressEl?.textContent?.trim() || ''
            const url = linkEl?.getAttribute('href') || ''
            const imageUrl = imageEl?.getAttribute('src') || ''

            // Extract amenities from property highlights
            const amenities: string[] = []
            const amenityElements = card.querySelectorAll('[data-testid="facility-icon"]')
            amenityElements.forEach(el => {
              const amenity = el.getAttribute('aria-label')
              if (amenity) amenities.push(amenity)
            })

            // Parse price (remove currency symbols and convert to number)
            const priceMatch = priceText.match(/[\d,]+/)
            const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : undefined

            // Parse rating
            const rating = parseFloat(ratingText) || undefined

            // Parse review count
            const reviewMatch = reviewText.match(/[\d,]+/)
            const reviewCount = reviewMatch ? parseInt(reviewMatch[0].replace(',', '')) : undefined

            results.push({
              name,
              type: 'hotel', // Default to hotel, could be refined
              pricePerNight: price,
              priceRange: priceText,
              rating,
              reviewCount,
              location: address.split(',')[0] || options.location,
              address,
              amenities,
              availability: true,
              url: url.startsWith('http') ? url : `https://www.booking.com${url}`,
              imageUrl,
              description: ''
            })
          } catch (error) {
            console.error('Error parsing hotel card:', error)
          }
        }

        return results
      }, options.maxResults || 10)

      return hotels.filter(h => {
        if (options.minRating && h.rating && h.rating < options.minRating) {
          return false
        }
        return true
      })

    } catch (error) {
      console.error('❌ Error scraping Booking.com:', error)
      return []
    } finally {
      await page.close()
    }
  }

  /**
   * Search for hotels on Hotels.com
   */
  async searchHotelsCom(options: ScraperOptions): Promise<HotelScrapedData[]> {
    await this.init()
    const page = await this.browser!.newPage({
      userAgent: this.userAgent
    })

    try {
      const checkIn = this.formatDate(options.checkInDate)
      const checkOut = this.formatDate(options.checkOutDate)

      const params = new URLSearchParams({
        q: options.location,
        checkIn,
        checkOut,
        rooms: '1',
        adults: options.guests.toString()
      })

      const url = `https://www.hotels.com/search?${params.toString()}`

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Wait for results
      await page.waitForSelector('[data-stid="property-listing"]', {
        timeout: 10000
      }).catch(() => {
        console.log('⚠️  Hotels.com results not found')
      })

      const hotels = await page.evaluate((maxResults) => {
        const results: HotelScrapedData[] = []
        const listings = document.querySelectorAll('[data-stid="property-listing"]')

        const limit = maxResults || listings.length
        for (let i = 0; i < Math.min(listings.length, limit); i++) {
          const listing = listings[i]

          try {
            const nameEl = listing.querySelector('[data-stid="property-name"]')
            const priceEl = listing.querySelector('[data-stid="price-display"]')
            const ratingEl = listing.querySelector('[data-stid="rating-score"]')
            const addressEl = listing.querySelector('[data-stid="property-address"]')

            const name = nameEl?.textContent?.trim() || 'Unknown Hotel'
            const priceText = priceEl?.textContent?.trim() || ''
            const ratingText = ratingEl?.textContent?.trim() || ''
            const address = addressEl?.textContent?.trim() || ''

            const priceMatch = priceText.match(/[\d,]+/)
            const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : undefined
            const rating = parseFloat(ratingText) || undefined

            results.push({
              name,
              type: 'hotel',
              pricePerNight: price,
              priceRange: priceText,
              rating,
              location: address.split(',')[0] || options.location,
              address,
              amenities: [],
              availability: true,
              url: window.location.href,
              description: ''
            })
          } catch (error) {
            console.error('Error parsing hotel listing:', error)
          }
        }

        return results
      }, options.maxResults || 10)

      return hotels

    } catch (error) {
      console.error('❌ Error scraping Hotels.com:', error)
      return []
    } finally {
      await page.close()
    }
  }

  /**
   * Aggregate results from multiple sources
   */
  async searchMultipleSources(options: ScraperOptions): Promise<HotelScrapedData[]> {
    const [bookingResults, hotelsResults] = await Promise.allSettled([
      this.searchBookingCom(options),
      this.searchHotelsCom(options)
    ])

    const allResults: HotelScrapedData[] = []

    if (bookingResults.status === 'fulfilled') {
      allResults.push(...bookingResults.value)
    } else {
      console.error('❌ Booking.com scraping failed:', bookingResults.reason)
    }

    if (hotelsResults.status === 'fulfilled') {
      allResults.push(...hotelsResults.value)
    } else {
      console.error('❌ Hotels.com scraping failed:', hotelsResults.reason)
    }

    // Remove duplicates based on name and location
    const unique = this.deduplicateResults(allResults)

    // Sort by rating and review count
    return unique.sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log10((a.reviewCount || 0) + 10)
      const scoreB = (b.rating || 0) * Math.log10((b.reviewCount || 0) + 10)
      return scoreB - scoreA
    }).slice(0, options.maxResults || 10)
  }

  /**
   * Remove duplicate hotels
   */
  private deduplicateResults(results: HotelScrapedData[]): HotelScrapedData[] {
    const seen = new Set<string>()
    return results.filter(hotel => {
      const key = `${hotel.name.toLowerCase()}_${hotel.location.toLowerCase()}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Test scraper with a simple query
   */
  async test(): Promise<boolean> {
    try {
      const testOptions: ScraperOptions = {
        location: 'Barcelona',
        checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        checkOutDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
        guests: 2,
        maxResults: 3
      }

      const results = await this.searchBookingCom(testOptions)
      console.log(`✅ Scraper test successful - Found ${results.length} hotels`)
      return results.length > 0
    } catch (error) {
      console.error('❌ Scraper test failed:', error)
      return false
    }
  }
}

// Singleton instance
let scraperInstance: HotelScraper | null = null

export function getHotelScraper(): HotelScraper {
  if (!scraperInstance) {
    scraperInstance = new HotelScraper()
  }
  return scraperInstance
}

export async function closeHotelScraper(): Promise<void> {
  if (scraperInstance) {
    await scraperInstance.close()
    scraperInstance = null
  }
}
