import { BaseAgent, AgentContext } from './base-agent'

export interface AccommodationSuggestion {
  name: string
  type: 'hotel' | 'hostel' | 'residence' | 'apartment' | 'guesthouse' | 'airbnb'
  estimatedPrice: number
  location: string
  contact?: {
    email?: string
    phone?: string
    website?: string
  }
  features: string[]
  capacity?: {
    min?: number
    max?: number
  }
  rating?: number
  reviewCount?: number
  photos?: string[]
  suitabilityScore: number
  reasoning: string
  pros: string[]
  cons: string[]
}

export class AccommodationAgent extends BaseAgent {
  constructor() {
    super('gpt-4-turbo-preview')
  }

  async research(context: AgentContext): Promise<AccommodationSuggestion[]> {
    const contextStr = this.buildContext(context)
    const budgetPerPerson = this.calculateBudgetPerPerson(context)
    const location = context.project?.location || 'City Center'
    const participants = context.project?.participantCount || 30
    const nights = this.calculateNights(
      context.phase?.startDate || new Date(),
      context.phase?.endDate || new Date()
    )

    const systemPrompt = `You are an accommodation research assistant for Erasmus+ youth projects.

${contextStr}

Your task: Research and suggest 5-7 suitable accommodation options (hotels, hostels, student residences, apartments, or guesthouses).

For each option, provide:
1. Name and type (hotel, hostel, residence, apartment, guesthouse, airbnb)
2. Estimated price per night per person (target: ~€${budgetPerPerson})
3. Location details (address or area)
4. Contact information (email, phone, website if available)
5. Key features (breakfast, WiFi, location proximity, kitchen, laundry, etc.)
6. Capacity information (minimum/maximum group size)
7. Rating (1-5 stars) and review count if available
8. Photo URLs if available (placeholder OK)
9. Suitability score (0-100) based on budget fit, location, amenities, group suitability
10. Specific PROS (3-5 bullet points)
11. Specific CONS (2-4 bullet points)
12. Brief verdict/reasoning

Focus on options that:
- Can handle groups of ${participants}+ people
- Fit within budget (€${budgetPerPerson} per person per night)
- Are suitable for student groups and youth projects
- Have good accessibility to city center/activities
- Offer group-friendly amenities (common areas, kitchen, WiFi)
- Are safe and well-reviewed

Consider a mix of:
- Budget options (hostels, shared accommodations)
- Mid-range options (hotels, guesthouses)
- Student-specific (university residences)

Return your response as a JSON array of accommodations.`

    const userMessage = `Please research accommodation options for group stay in ${location} for ${participants} participants for ${nights} nights.`

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Unknown Accommodation',
          type: s.type || 'hotel',
          estimatedPrice: s.estimatedPrice || s.price || budgetPerPerson,
          location: s.location || location,
          contact: s.contact || {},
          features: s.features || [],
          capacity: s.capacity || { min: 20, max: 50 },
          rating: s.rating || undefined,
          reviewCount: s.reviewCount || s.reviews || undefined,
          photos: s.photos || [],
          suitabilityScore: s.suitabilityScore || s.score || 75,
          reasoning: s.reasoning || s.verdict || '',
          pros: s.pros || [],
          cons: s.cons || [],
        }))
      }

      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Accommodation research error:', error)
      return this.getDefaultSuggestions(context)
    }
  }

  async analyzeAccommodationOption(
    option: Partial<AccommodationSuggestion>,
    context: AgentContext
  ): Promise<{ pros: string[]; cons: string[]; verdict: string }> {
    const contextStr = this.buildContext(context)
    const participants = context.project?.participantCount || 30

    const systemPrompt = `You are an accommodation analysis expert for Erasmus+ youth projects.

${contextStr}

Analyze the following accommodation option and provide:
1. PROS: 3-5 specific advantages (focus on youth group suitability, budget, location, safety, amenities)
2. CONS: 2-4 specific concerns or limitations (booking policies, capacity, distance, facilities, etc.)
3. VERDICT: 2-3 sentence summary recommendation

Be specific, practical, and honest. Consider the unique needs of youth group projects (safety, socialization, supervision, budget).`

    const userMessage = `Analyze this accommodation option:
Name: ${option.name}
Type: ${option.type}
Price: €${option.estimatedPrice}/night/person
Location: ${option.location}
Features: ${option.features?.join(', ')}
Capacity: ${option.capacity?.min}-${option.capacity?.max} people
Rating: ${option.rating ? `${option.rating}/5 stars (${option.reviewCount} reviews)` : 'Not rated'}

For a group of ${participants} participants.`

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Try to extract structured JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        return {
          pros: analysis.pros || [],
          cons: analysis.cons || [],
          verdict: analysis.verdict || '',
        }
      }

      // Fallback parsing
      const prosMatch = response.match(/PROS?:?\s*\n?([\s\S]*?)\n?\s*CONS?:?/i)
      const consMatch = response.match(/CONS?:?\s*\n?([\s\S]*?)\n?\s*VERDICT:?/i)
      const verdictMatch = response.match(/VERDICT:?\s*\n?([\s\S]*)/i)

      return {
        pros: prosMatch
          ? prosMatch[1]
              .split('\n')
              .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
              .map((line) => line.trim().replace(/^[-•]\s*/, ''))
          : ['Suitable for the group'],
        cons: consMatch
          ? consMatch[1]
              .split('\n')
              .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
              .map((line) => line.trim().replace(/^[-•]\s*/, ''))
          : ['Requires advance booking'],
        verdict: verdictMatch ? verdictMatch[1].trim() : 'Generally suitable accommodation option.',
      }
    } catch (error) {
      console.error('Analysis error:', error)
      return {
        pros: ['Suitable location', 'Group-friendly amenities'],
        cons: ['May require advance booking', 'Check availability for large groups'],
        verdict: 'This accommodation could work for the project. Verify availability and pricing directly.',
      }
    }
  }

  async generateQuoteEmail(
    option: AccommodationSuggestion,
    context: AgentContext
  ): Promise<{ subject: string; body: string }> {
    const projectName = context.project?.name || 'Youth Exchange Project'
    const location = context.project?.location || 'your city'
    const participants = context.project?.participantCount || 30
    const startDate = context.phase?.startDate
    const endDate = context.phase?.endDate
    const nights = startDate && endDate ? this.calculateNights(startDate, endDate) : 7

    const subject = `Group Accommodation Quote Request - ${projectName} (${participants} participants, ${nights} nights)`

    const body = `Dear ${option.name} Team,

I hope this message finds you well.

I am writing to request a quote for group accommodation for an Erasmus+ youth project titled "${projectName}" taking place in ${location}.

PROJECT DETAILS:
- Number of participants: ${participants} young people (mixed gender group)
- Duration: ${nights} nights
${startDate ? `- Check-in: ${startDate.toLocaleDateString()}` : ''}
${endDate ? `- Check-out: ${endDate.toLocaleDateString()}` : ''}
- Room configuration: Open to your recommendations for group accommodation

REQUIREMENTS:
- Safe and supervised environment suitable for youth groups
- WiFi access throughout the property
- Common areas for group activities and socialization
- Breakfast included (if available)
- 24/7 reception or on-call support
- Accessible location (near public transport)

SPECIFIC REQUEST FOR ${option.type.toUpperCase()}:
${option.type === 'hostel' || option.type === 'residence'
  ? `We are interested in your group accommodation options. Please provide:
1. Available room configurations (dormitories, private rooms, capacity)
2. Pricing per person per night (our target: €${option.estimatedPrice}/person/night)
3. Included amenities and services
4. Meal options (breakfast, self-catering facilities)
5. Common areas and facilities available for group use
6. Your experience hosting youth groups or educational programs`
  : option.type === 'hotel'
  ? `We are interested in booking group accommodation at your hotel. Please provide:
1. Available room types and configurations for groups
2. Group rates per person per night (our target: €${option.estimatedPrice}/person/night)
3. Meal packages (breakfast, half-board options)
4. Meeting or common spaces available for our group
5. Group booking policies and deposit requirements
6. Your experience hosting youth educational groups`
  : `We are interested in your accommodation for our youth group. Please provide:
1. Available units/rooms and capacity
2. Pricing per person per night (our target: €${option.estimatedPrice}/person/night)
3. Amenities included (kitchen, WiFi, linens, etc.)
4. Check-in/check-out procedures for groups
5. House rules and supervision policies
6. Your experience hosting educational youth groups`}

Could you please send us:
- Detailed quote with room/bed breakdown
- Total costs including any additional fees (cleaning, tourist tax, deposits)
- Cancellation policy and payment terms
- Floor plans or photos of the accommodation
- References from similar youth group stays (if available)

This is an official Erasmus+ funded project, and we can provide all necessary documentation including insurance and youth protection certificates.

SAFETY & SUPERVISION:
As this is a youth project, we need to ensure:
- Separate sleeping areas for different genders (if applicable)
- Secure premises with controlled access
- Emergency procedures and contacts
- Fire safety and evacuation plans

Please feel free to contact me if you need any additional information. We would appreciate receiving your quote by [DATE - one week from sending].

Thank you for your time and consideration. We look forward to potentially hosting our group at ${option.name}.

Best regards,
[Your Name]
[Your Organization]
[Contact Information]

---
Note: This is a formal quote request for an Erasmus+ funded youth project. All accommodations must meet EU youth safety standards.`

    return { subject, body }
  }

  async handleChat(context: AgentContext, userMessage: string): Promise<string> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an accommodation research assistant for Erasmus+ projects.

${contextStr}

Provide helpful, specific recommendations based on the user's questions.
Focus on practical advice for finding suitable accommodation for student groups.
Be conversational but professional.`

    return this.generateResponse(systemPrompt, userMessage)
  }

  private calculateBudgetPerPerson(context: AgentContext): number {
    if (!context.phase || !context.project) return 50

    const totalBudget = context.phase.budgetAllocated
    const participants = context.project.participantCount || 30
    const nights = this.calculateNights(
      context.phase.startDate,
      context.phase.endDate
    )

    return Math.round(totalBudget / (participants * nights))
  }

  private calculateNights(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  private getDefaultSuggestions(context: AgentContext): AccommodationSuggestion[] {
    const location = context.project?.location || 'City Center'
    const budgetPerPerson = this.calculateBudgetPerPerson(context)

    return [
      {
        name: `Central Youth Hostel ${location}`,
        type: 'hostel',
        estimatedPrice: Math.round(budgetPerPerson * 0.5),
        location: `${location}, Downtown`,
        contact: {
          email: 'info@youthhostel-example.com',
          phone: '+34 XXX XXX XXX',
          website: 'www.youthhostel-example.com',
        },
        features: [
          'WiFi throughout',
          'Breakfast included',
          'Common room',
          '24/7 reception',
          'Shared kitchen',
          'Laundry facilities',
          'Lockers in rooms',
        ],
        capacity: {
          min: 20,
          max: 60,
        },
        rating: 4.2,
        reviewCount: 850,
        suitabilityScore: 88,
        reasoning:
          'Excellent budget option with strong youth group experience. Central location, good facilities, safe environment.',
        pros: [
          'Very budget-friendly (€25-35/night) fitting tight budgets',
          'Extensive experience hosting youth groups and school trips',
          'Central location within walking distance to major attractions',
          '24/7 reception provides security and support',
          'Breakfast included simplifies meal planning',
          'Common areas perfect for group activities and socializing',
        ],
        cons: [
          'Dormitory-style rooms (4-8 beds) with less privacy',
          'Bathrooms are shared between multiple rooms',
          'Can be noisy with multiple groups staying simultaneously',
          'Requires 2-week advance booking for groups over 20',
        ],
      },
      {
        name: `Student Residence ${location}`,
        type: 'residence',
        estimatedPrice: Math.round(budgetPerPerson * 0.7),
        location: `${location}, University district`,
        contact: {
          email: 'bookings@studentres-example.com',
          phone: '+34 XXX XXX XXX',
        },
        features: [
          'WiFi included',
          'Study rooms',
          'Laundry facilities',
          'Self-catering kitchen',
          'Common lounge',
          'Sports facilities',
          'Secure access',
        ],
        capacity: {
          min: 30,
          max: 80,
        },
        rating: 4.5,
        reviewCount: 320,
        suitabilityScore: 85,
        reasoning:
          'Purpose-built for students with appropriate facilities and atmosphere. Great for educational projects.',
        pros: [
          'Purpose-built for students with educational focus',
          'Mix of single and twin rooms providing more privacy',
          'Self-catering kitchens allow flexible meal preparation',
          'Quiet study areas support workshop/learning activities',
          'Secure premises with key card access',
        ],
        cons: [
          'Primarily available during university breaks (summer, winter)',
          'Minimum 5-night stay required',
          'Self-catering means no included meals',
          'Location may be 15-20 minutes from city center',
        ],
      },
      {
        name: `Budget Hotel ${location}`,
        type: 'hotel',
        estimatedPrice: Math.round(budgetPerPerson * 0.9),
        location: `${location}, Near main station`,
        contact: {
          email: 'groups@budgethotel-example.com',
          website: 'www.budgethotel-example.com',
        },
        features: [
          'WiFi free',
          'Breakfast buffet',
          'Private bathrooms',
          'Air conditioning',
          'Elevator access',
          'Meeting room available',
        ],
        capacity: {
          min: 25,
          max: 50,
        },
        rating: 3.8,
        reviewCount: 1240,
        suitabilityScore: 80,
        reasoning:
          'Reliable hotel chain with group experience. Good balance of privacy and affordability.',
        pros: [
          'Private bathrooms in all rooms (2-3 bed configurations)',
          'Breakfast buffet included with varied options',
          'Professional hotel service and 24/7 reception',
          'Near main transportation hub for easy access',
          'Meeting room available for group sessions',
        ],
        cons: [
          'Higher price point (€40-55/night) may stretch budgets',
          'Limited common space compared to hostels',
          'Rooms spread across multiple floors (less group cohesion)',
          'Standard hotel atmosphere less social than hostels',
        ],
      },
      {
        name: `Aparthotel Group Suites ${location}`,
        type: 'apartment',
        estimatedPrice: Math.round(budgetPerPerson * 0.8),
        location: `${location}, Residential area`,
        contact: {
          email: 'reservations@aparthotel-example.com',
          phone: '+34 XXX XXX XXX',
          website: 'www.aparthotel-example.com',
        },
        features: [
          'Full kitchens',
          'Living areas',
          'WiFi included',
          'Weekly cleaning',
          'Washer/dryer',
          'Balconies',
          'Reception service',
        ],
        capacity: {
          min: 20,
          max: 40,
        },
        rating: 4.3,
        reviewCount: 580,
        suitabilityScore: 82,
        reasoning:
          'Home-like environment with kitchen facilities. Excellent for longer stays and more independence.',
        pros: [
          'Full kitchens enable self-catering and significant meal savings',
          'Apartment-style living creates home-like atmosphere',
          'Separate living spaces allow group meetings in units',
          'Good for longer stays (5+ nights) with more space',
          'Washer/dryer facilities reduce packing needs',
        ],
        cons: [
          'Requires more supervision with separate units',
          'Group may be less cohesive across multiple apartments',
          'Self-catering requires shopping and meal preparation coordination',
          'Usually minimum 3-night stay policy',
        ],
      },
      {
        name: `Eco-Friendly Guesthouse ${location}`,
        type: 'guesthouse',
        estimatedPrice: Math.round(budgetPerPerson * 0.6),
        location: `${location}, Quiet neighborhood`,
        contact: {
          email: 'hello@ecoguesthouse-example.com',
          website: 'www.ecoguesthouse-example.com',
        },
        features: [
          'WiFi free',
          'Organic breakfast',
          'Shared kitchen',
          'Garden access',
          'Bike rental',
          'Eco-friendly amenities',
          'Common dining area',
        ],
        capacity: {
          min: 15,
          max: 35,
        },
        rating: 4.7,
        reviewCount: 290,
        suitabilityScore: 78,
        reasoning:
          'Unique sustainable option with personal touch. Great for environmental education projects.',
        pros: [
          'Strong sustainability focus aligns with Erasmus+ values',
          'Personal service with owner involvement',
          'Organic breakfast and locally-sourced amenities',
          'Intimate setting promotes group bonding',
          'Garden and outdoor spaces for activities',
        ],
        cons: [
          'Smaller capacity (max 35) limits to smaller groups',
          'May be in residential area requiring transport to center',
          'Fewer modern amenities than commercial hotels',
          'Limited availability - books up quickly',
        ],
      },
    ]
  }
}
