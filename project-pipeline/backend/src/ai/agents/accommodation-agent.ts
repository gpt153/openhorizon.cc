import { BaseAgent, AgentContext } from './base-agent.js'
import { prisma } from '../../config/database.js'
import { getHotelScraper, HotelScrapedData, ScraperOptions } from '../../integrations/scrapers/hotel-scraper.js'

export interface AccommodationSuggestion {
  name: string
  type: 'hotel' | 'hostel' | 'residence' | 'apartment' | 'guesthouse'
  estimatedPrice: number
  priceRange?: string
  rating?: number
  reviewCount?: number
  location: string
  address?: string
  features: string[]
  suitabilityScore: number
  reasoning: string
  url?: string
  imageUrl?: string
  scraped: boolean // Indicates if this is real scraped data
}

export class AccommodationAgent extends BaseAgent {
  constructor() {
    super('claude-3-5-sonnet-20241022')
  }

  async research(context: AgentContext, useRealData: boolean = true): Promise<AccommodationSuggestion[]> {
    // Try to get real scraped data first if enabled
    if (useRealData && context.project && context.phase) {
      try {
        const scrapedData = await this.scrapeAccommodations(context)
        if (scrapedData.length > 0) {
          console.log(`✅ Found ${scrapedData.length} real accommodations via scraping`)
          return await this.enhanceWithAI(scrapedData, context)
        } else {
          console.log('⚠️  No scraped data found, falling back to AI-only research')
        }
      } catch (error) {
        console.error('❌ Scraping failed, falling back to AI-only research:', error)
      }
    }

    // Fallback to AI-only research
    return this.researchWithAIOnly(context)
  }

  /**
   * Scrape real accommodation data from booking sites
   */
  private async scrapeAccommodations(context: AgentContext): Promise<HotelScrapedData[]> {
    if (!context.project || !context.phase) {
      return []
    }

    const scraper = getHotelScraper()

    const options: ScraperOptions = {
      location: context.project.location,
      checkInDate: new Date(context.phase.start_date),
      checkOutDate: new Date(context.phase.end_date),
      guests: context.project.participants_count || 30,
      maxResults: 10,
      minRating: 7.0 // Minimum rating of 7/10
    }

    try {
      const results = await scraper.searchMultipleSources(options)
      return results
    } finally {
      // Don't close the scraper here - it's a singleton that may be reused
    }
  }

  /**
   * Enhance scraped data with AI analysis
   */
  private async enhanceWithAI(
    scrapedData: HotelScrapedData[],
    context: AgentContext
  ): Promise<AccommodationSuggestion[]> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an accommodation analysis assistant for Erasmus+ projects.

${contextStr}

Here is real accommodation data from booking sites:

${JSON.stringify(scrapedData, null, 2)}

Your task: Analyze these options and assign each a suitability score (0-100) and reasoning based on:
1. Price fit for budget (budget per person: €${this.calculateBudgetPerPerson(context)})
2. Location suitability
3. Amenities for group travel
4. Ratings and reviews
5. Overall value

Return ONLY the top 5 options as a JSON array with fields: name, type, estimatedPrice, location, features, suitabilityScore, reasoning.
Keep the original data but add your analysis.`

    try {
      const response = await this.generateResponse(systemPrompt, 'Analyze these accommodations for suitability.')

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0])
        return enhanced.map((s: any, index: number) => {
          const original = scrapedData.find(d => d.name === s.name) || scrapedData[index]
          return {
            name: s.name || original?.name || 'Unknown',
            type: (s.type || original?.type || 'hotel') as any,
            estimatedPrice: s.estimatedPrice || original?.pricePerNight || 0,
            priceRange: original?.priceRange,
            rating: original?.rating,
            reviewCount: original?.reviewCount,
            location: s.location || original?.location || '',
            address: original?.address,
            features: s.features || original?.amenities || [],
            suitabilityScore: s.suitabilityScore || s.score || 70,
            reasoning: s.reasoning || s.reason || '',
            url: original?.url,
            imageUrl: original?.imageUrl,
            scraped: true
          }
        }).slice(0, 5)
      }

      // If AI enhancement fails, convert scraped data directly
      return this.convertScrapedToSuggestions(scrapedData.slice(0, 5), context)
    } catch (error) {
      console.error('AI enhancement error:', error)
      return this.convertScrapedToSuggestions(scrapedData.slice(0, 5), context)
    }
  }

  /**
   * Convert scraped data to suggestions without AI enhancement
   */
  private convertScrapedToSuggestions(
    scrapedData: HotelScrapedData[],
    context: AgentContext
  ): AccommodationSuggestion[] {
    const budgetPerPerson = this.calculateBudgetPerPerson(context)

    return scrapedData.map(hotel => {
      const price = hotel.pricePerNight || 0
      const priceFit = Math.max(0, 100 - Math.abs(price - budgetPerPerson) / budgetPerPerson * 100)
      const ratingScore = (hotel.rating || 7) * 10
      const suitabilityScore = Math.round((priceFit * 0.6 + ratingScore * 0.4))

      return {
        name: hotel.name,
        type: hotel.type as any,
        estimatedPrice: price,
        priceRange: hotel.priceRange,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        location: hotel.location,
        address: hotel.address,
        features: hotel.amenities,
        suitabilityScore,
        reasoning: `Price: €${price}/night, Rating: ${hotel.rating || 'N/A'}/10 with ${hotel.reviewCount || 0} reviews`,
        url: hotel.url,
        imageUrl: hotel.imageUrl,
        scraped: true
      }
    })
  }

  /**
   * AI-only research (no scraping)
   */
  private async researchWithAIOnly(context: AgentContext): Promise<AccommodationSuggestion[]> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an accommodation research assistant for Erasmus+ projects.

${contextStr}

Your task: Research and suggest 3-5 suitable accommodation options (hotels, hostels, or student residences).

For each option, provide:
1. Name and type
2. Estimated price per night per person
3. Location details
4. Key features (breakfast, WiFi, location proximity, etc.)
5. Suitability score (0-100)
6. Brief reasoning why it's suitable

Return your response as a JSON array of accommodations.`

    const userMessage = 'Please research accommodation options for this project.'

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Try to parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Unknown',
          type: s.type || 'hotel',
          estimatedPrice: s.estimatedPrice || s.price || 0,
          location: s.location || context.project?.location || '',
          features: s.features || [],
          suitabilityScore: s.suitabilityScore || s.score || 70,
          reasoning: s.reasoning || s.reason || '',
          scraped: false
        }))
      }

      // Fallback: return default suggestions
      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Research error:', error)
      return this.getDefaultSuggestions(context)
    }
  }

  private calculateBudgetPerPerson(context: AgentContext): number {
    if (!context.phase || !context.project) return 100

    const totalBudget = Number(context.phase.budget_allocated)
    const participants = context.project.participants_count || 30
    const nights = this.calculateNights(context.phase.start_date, context.phase.end_date)

    return totalBudget / (participants * nights)
  }

  private calculateNights(startDate: Date, endDate: Date): number {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  async refineSearch(
    context: AgentContext,
    userQuery: string,
    previousSuggestions: AccommodationSuggestion[]
  ): Promise<AccommodationSuggestion[]> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are refining accommodation suggestions based on user feedback.

${contextStr}

Previous suggestions:
${JSON.stringify(previousSuggestions, null, 2)}

User's new requirement: "${userQuery}"

Provide updated suggestions (3-5 options) that better match the user's requirements.
Return as JSON array.`

    try {
      const response = await this.generateResponse(systemPrompt, userQuery)

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Unknown',
          type: s.type || 'hotel',
          estimatedPrice: s.estimatedPrice || s.price || 0,
          location: s.location || context.project?.location || '',
          features: s.features || [],
          suitabilityScore: s.suitabilityScore || s.score || 70,
          reasoning: s.reasoning || s.reason || ''
        }))
      }

      return previousSuggestions
    } catch (error) {
      console.error('Refine error:', error)
      return previousSuggestions
    }
  }

  async storeSuggestions(phaseId: string, suggestions: AccommodationSuggestion[]) {
    await prisma.phase.update({
      where: { id: phaseId },
      data: {
        metadata: {
          ai_suggestions: suggestions,
          suggested_at: new Date().toISOString()
        }
      }
    })
  }

  private getDefaultSuggestions(context: AgentContext): AccommodationSuggestion[] {
    const location = context.project?.location || 'City Center'
    const budgetPerPerson = this.calculateBudgetPerPerson(context)

    return [
      {
        name: `Central Hotel ${location}`,
        type: 'hotel',
        estimatedPrice: budgetPerPerson * 0.8,
        location: `${location}, Downtown`,
        features: ['WiFi', 'Breakfast included', 'Conference room', 'Central location'],
        suitabilityScore: 85,
        reasoning: 'Well-located hotel with good amenities for groups',
        scraped: false
      },
      {
        name: `Budget Hostel ${location}`,
        type: 'hostel',
        estimatedPrice: budgetPerPerson * 0.4,
        location: `${location}, Near public transport`,
        features: ['WiFi', 'Shared kitchen', 'Social areas', 'Budget-friendly'],
        suitabilityScore: 75,
        reasoning: 'Cost-effective option with social atmosphere',
        scraped: false
      },
      {
        name: `Student Residence ${location}`,
        type: 'residence',
        estimatedPrice: budgetPerPerson * 0.6,
        location: `${location}, University district`,
        features: ['WiFi', 'Study rooms', 'Laundry', 'Student-focused'],
        suitabilityScore: 80,
        reasoning: 'Purpose-built for students with appropriate facilities',
        scraped: false
      }
    ]
  }
}
