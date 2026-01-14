import { BaseAgent, AgentContext } from './base-agent.js'

export interface Flight {
  id: string
  airline: string
  price: number
  duration: string
  connections: number
  departureTime: string
  arrivalTime: string
  origin: string
  destination: string
  groupSuitability: number
  aiAnalysis: string
}

export interface TravelAgency {
  id: string
  name: string
  website: string
  contactEmail?: string
  contactPhone?: string
  specializations: string[]
  groupSuitability: number
  aiAnalysis: string
}

export interface TravelSearchParams {
  origin: string
  destination: string
  date: Date
  passengers: number
}

export class TravelAgent extends BaseAgent {
  constructor() {
    super('claude-3-5-sonnet-20241022')
  }

  /**
   * Search for flights and travel agencies
   */
  async search(
    params: TravelSearchParams,
    context: AgentContext
  ): Promise<{ flights: Flight[]; agencies: TravelAgency[] }> {
    // For now, return mock data. Real scraping can be added later.
    const flights = await this.getMockFlights(params)
    const agencies = await this.getMockAgencies(params)

    // Analyze with AI
    const analyzedFlights = await this.analyzeFlights(flights, params, context)
    const analyzedAgencies = await this.analyzeAgencies(agencies, params, context)

    return {
      flights: analyzedFlights,
      agencies: analyzedAgencies,
    }
  }

  /**
   * Analyze flights with AI to provide pros/cons
   */
  private async analyzeFlights(
    flights: Flight[],
    params: TravelSearchParams,
    context: AgentContext
  ): Promise<Flight[]> {
    const budgetPerPerson = this.calculateBudgetPerPerson(context, params.passengers)

    const analyzed = await Promise.all(
      flights.map(async (flight) => {
        const systemPrompt = `You are analyzing flight options for a student group travel project.

CONTEXT:
- Group size: ${params.passengers} participants
- Route: ${params.origin} → ${params.destination}
- Travel date: ${params.date.toLocaleDateString()}
- Budget per person: €${budgetPerPerson}

FLIGHT DETAILS:
- Airline: ${flight.airline}
- Price: €${flight.price}/person
- Duration: ${flight.duration}
- Connections: ${flight.connections === 0 ? 'Direct' : flight.connections}
- Departure: ${flight.departureTime}
- Arrival: ${flight.arrivalTime}

Provide a structured analysis with:
1. PROS: (3-4 specific advantages in bullet points)
2. CONS: (3-4 specific concerns in bullet points)
3. GROUP SUITABILITY: A score from 0-10 and brief justification
4. RECOMMENDATION: (1-2 sentences on whether to book this)

Focus on: pricing, timing, convenience, group booking feasibility, budget fit.
Format your response clearly with headers.`

        try {
          const analysis = await this.generateResponse(
            systemPrompt,
            'Analyze this flight option for our group.'
          )

          // Extract suitability score
          const scoreMatch = analysis.match(/(\d+)\/10/)
          const suitability = scoreMatch ? parseInt(scoreMatch[1]) : 7

          return {
            ...flight,
            groupSuitability: suitability,
            aiAnalysis: analysis,
          }
        } catch (error) {
          console.error('Flight analysis error:', error)
          return {
            ...flight,
            groupSuitability: 7,
            aiAnalysis: this.getDefaultFlightAnalysis(flight, budgetPerPerson),
          }
        }
      })
    )

    return analyzed
  }

  /**
   * Analyze travel agencies with AI
   */
  private async analyzeAgencies(
    agencies: TravelAgency[],
    params: TravelSearchParams,
    context: AgentContext
  ): Promise<TravelAgency[]> {
    const analyzed = await Promise.all(
      agencies.map(async (agency) => {
        const systemPrompt = `You are evaluating travel agencies for youth group coordination.

CONTEXT:
- Group size: ${params.passengers} participants
- Route: ${params.origin} → ${params.destination}
- Project type: Erasmus+ youth exchange
- Travel date: ${params.date.toLocaleDateString()}

AGENCY DETAILS:
- Name: ${agency.name}
- Website: ${agency.website}
- Specializations: ${agency.specializations.join(', ')}
${agency.contactEmail ? `- Email: ${agency.contactEmail}` : ''}
${agency.contactPhone ? `- Phone: ${agency.contactPhone}` : ''}

Provide a structured analysis with:
1. STRENGTHS: (3-4 key capabilities in bullet points)
2. CONCERNS: (2-3 potential issues or considerations in bullet points)
3. VALUE PROPOSITION: (Why use them vs. direct booking? 2-3 sentences)
4. RECOMMENDATION: (Suitable/Not Suitable + reasoning, 1-2 sentences)

Focus on: group travel experience, youth sector knowledge, Erasmus+ familiarity, support services.
Format your response clearly with headers.`

        try {
          const analysis = await this.generateResponse(
            systemPrompt,
            'Analyze this travel agency for our group.'
          )

          // Determine suitability score based on specializations
          let suitability = 7
          if (
            agency.specializations.some(
              (s) =>
                s.toLowerCase().includes('erasmus') ||
                s.toLowerCase().includes('youth') ||
                s.toLowerCase().includes('student')
            )
          ) {
            suitability = 9
          }

          return {
            ...agency,
            groupSuitability: suitability,
            aiAnalysis: analysis,
          }
        } catch (error) {
          console.error('Agency analysis error:', error)
          return {
            ...agency,
            groupSuitability: 7,
            aiAnalysis: this.getDefaultAgencyAnalysis(agency),
          }
        }
      })
    )

    return analyzed
  }

  /**
   * Generate quote request email for selected option
   */
  async generateQuoteEmail(
    option: Flight | TravelAgency,
    params: TravelSearchParams,
    context: AgentContext
  ): Promise<string> {
    const isFlight = 'airline' in option
    const projectName = context.project?.name || 'Erasmus+ Project'
    const budgetPerPerson = this.calculateBudgetPerPerson(context, params.passengers)

    if (isFlight) {
      const flight = option as Flight
      return `Subject: Group Flight Booking Request - ${projectName} (${params.passengers} passengers)

Dear ${flight.airline} Group Booking Team,

We are organizing a youth exchange project under the Erasmus+ programme and would like to request a group booking quote.

PROJECT DETAILS:
- Project: ${projectName}
- Group size: ${params.passengers} young people (ages 18-30)
- Route: ${params.origin} → ${params.destination}
- Travel date: ${params.date.toLocaleDateString()}
- Budget: Approximately €${budgetPerPerson} per person

FLIGHT OF INTEREST:
- Flight: ${flight.airline}
- Departure: ${flight.departureTime}
- Arrival: ${flight.arrivalTime}
- Duration: ${flight.duration}

REQUIREMENTS:
- Group booking with flexible payment terms
- Baggage allowance (1 checked bag per person minimum)
- Ability to add/modify passenger names up to 14 days before departure
- Group seating together (if possible)

Could you please provide:
1. Confirmed availability for ${params.passengers} passengers
2. Group pricing breakdown (vs. individual booking price: €${flight.price})
3. Payment schedule and deadlines
4. Cancellation and change policies
5. Any available group discounts or youth rates

We aim to finalize bookings within 2-3 weeks. Please send your quote to this email address.

Thank you for your assistance.

Best regards,
${context.project?.name || 'Project Coordinator'}`
    } else {
      const agency = option as TravelAgency
      return `Subject: Group Travel Quote Request - ${projectName} (${params.passengers} participants)

Dear ${agency.name} Team,

We are organizing a youth exchange project under the Erasmus+ programme and would like to request a comprehensive travel coordination quote.

PROJECT DETAILS:
- Project: ${projectName}
- Group size: ${params.passengers} young people (ages 18-30)
- Route: ${params.origin} → ${params.destination}
- Travel date: ${params.date.toLocaleDateString()}
- Budget: Approximately €${budgetPerPerson} per person for flights

YOUR SERVICES:
We are interested in your ${agency.specializations.join(', ')} services based on your expertise in ${agency.specializations[0]}.

REQUIREMENTS:
- Complete flight coordination for ${params.passengers} participants
- Group booking with flexible payment terms
- Support with any visa or documentation requirements (if applicable)
- One point of contact for all travel-related issues
- Travel insurance recommendations
- Emergency support during travel dates

Could you please provide:
1. Available flight options for our dates and group size
2. Your service fee structure
3. Total cost breakdown (flights + services)
4. Payment terms and timeline
5. What's included in your service package
6. Cancellation and change policies
7. References from similar Erasmus+ projects (if available)

We are evaluating both direct booking and agency coordination options. Please help us understand the added value of working with your agency.

We aim to finalize arrangements within 3-4 weeks. Please send your quote to this email address.

Thank you for your consideration.

Best regards,
${context.project?.name || 'Project Coordinator'}
${agency.contactEmail ? `\nPlease reply to: ${agency.contactEmail}` : ''}`
    }
  }

  /**
   * Handle chat interactions
   */
  async handleChat(context: AgentContext, userMessage: string): Promise<string> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are a travel coordination assistant for Erasmus+ youth projects.

${contextStr}

Provide helpful, specific recommendations about:
- Flight options and booking strategies for groups
- Travel agencies specializing in youth group travel
- Group booking best practices
- Budget optimization for travel
- Documentation and visa requirements
- Travel insurance for groups

Be conversational but professional. Give practical, actionable advice.`

    return this.generateResponse(systemPrompt, userMessage)
  }

  /**
   * Calculate budget per person for travel
   */
  private calculateBudgetPerPerson(context: AgentContext, passengers: number): number {
    if (!context.phase) return 200 // Default estimate

    const totalBudget = Number(context.phase.budget_allocated)
    return Math.round(totalBudget / passengers)
  }

  /**
   * Get mock flight data (to be replaced with real scraping)
   */
  private async getMockFlights(params: TravelSearchParams): Promise<Flight[]> {
    // Generate realistic mock data based on route
    const basePrice = this.estimateBasePrice(params.origin, params.destination)

    return [
      {
        id: '1',
        airline: 'Lufthansa',
        price: Math.round(basePrice * 1.2),
        duration: '2h 45m',
        connections: 0,
        departureTime: '08:00',
        arrivalTime: '10:45',
        origin: params.origin,
        destination: params.destination,
        groupSuitability: 0,
        aiAnalysis: '',
      },
      {
        id: '2',
        airline: 'Ryanair',
        price: Math.round(basePrice * 0.6),
        duration: '2h 30m',
        connections: 0,
        departureTime: '06:15',
        arrivalTime: '08:45',
        origin: params.origin,
        destination: params.destination,
        groupSuitability: 0,
        aiAnalysis: '',
      },
      {
        id: '3',
        airline: 'SAS Scandinavian Airlines',
        price: Math.round(basePrice * 1.1),
        duration: '2h 50m',
        connections: 0,
        departureTime: '14:30',
        arrivalTime: '17:20',
        origin: params.origin,
        destination: params.destination,
        groupSuitability: 0,
        aiAnalysis: '',
      },
      {
        id: '4',
        airline: 'KLM via Amsterdam',
        price: Math.round(basePrice * 0.85),
        duration: '5h 15m',
        connections: 1,
        departureTime: '10:00',
        arrivalTime: '15:15',
        origin: params.origin,
        destination: params.destination,
        groupSuitability: 0,
        aiAnalysis: '',
      },
    ]
  }

  /**
   * Get mock travel agency data
   */
  private async getMockAgencies(params: TravelSearchParams): Promise<TravelAgency[]> {
    return [
      {
        id: 'agency-1',
        name: 'Nordic Youth Travel',
        website: 'www.nordicyouthtravel.com',
        contactEmail: 'groups@nordicyouthtravel.com',
        contactPhone: '+46 8 123 4567',
        specializations: ['Erasmus+ groups', 'Youth travel', 'Educational tours'],
        groupSuitability: 0,
        aiAnalysis: '',
      },
      {
        id: 'agency-2',
        name: 'EuroStudent Travel Services',
        website: 'www.eurostudenttravel.eu',
        contactEmail: 'bookings@eurostudenttravel.eu',
        specializations: ['Student groups', 'Budget travel', 'Multi-country coordination'],
        groupSuitability: 0,
        aiAnalysis: '',
      },
      {
        id: 'agency-3',
        name: 'Global Group Travel Agency',
        website: 'www.globalgrouptravel.com',
        contactEmail: 'info@globalgrouptravel.com',
        contactPhone: '+44 20 7123 4567',
        specializations: ['Large group bookings', 'Corporate travel', 'MICE events'],
        groupSuitability: 0,
        aiAnalysis: '',
      },
    ]
  }

  /**
   * Estimate base flight price based on route
   */
  private estimateBasePrice(origin: string, destination: string): number {
    // Simple distance-based pricing (very rough estimate)
    // In reality, this would need a proper flight pricing API
    const distances: Record<string, number> = {
      'short': 150, // < 1000km
      'medium': 250, // 1000-2000km
      'long': 450, // > 2000km
    }

    // This is a simplification. Real implementation would use actual distance calculation
    return distances['medium']
  }

  /**
   * Default flight analysis fallback
   */
  private getDefaultFlightAnalysis(flight: Flight, budgetPerPerson: number): string {
    const withinBudget = flight.price <= budgetPerPerson
    const isDirect = flight.connections === 0

    return `PROS:
- ${isDirect ? 'Direct flight with no connections' : 'Affordable option with connection'}
- ${flight.airline} is a reliable carrier
- ${withinBudget ? 'Price fits within budget' : 'Competitive pricing'}
- Suitable for group travel

CONS:
- ${!withinBudget ? 'Exceeds budget allocation' : 'Limited flexibility for changes'}
- ${!isDirect ? 'Connection adds travel time and complexity' : 'May have limited baggage allowance'}
- Group availability should be confirmed early
- ${!withinBudget ? 'May require budget adjustment' : 'Standard airline policies apply'}

GROUP SUITABILITY: ${isDirect && withinBudget ? '8' : withinBudget ? '7' : '6'}/10
${isDirect && withinBudget ? 'Good fit for group travel with direct routing and budget compliance.' : withinBudget ? 'Acceptable option for budget-conscious groups.' : 'Consider if budget can be adjusted or look for alternatives.'}

RECOMMENDATION: ${withinBudget ? 'Worth requesting a detailed group quote.' : 'Request quote to see if group discounts bring it within budget.'}`
  }

  /**
   * Default agency analysis fallback
   */
  private getDefaultAgencyAnalysis(agency: TravelAgency): string {
    return `STRENGTHS:
- Specializes in ${agency.specializations.join(', ')}
- Dedicated contact information provided
- Experience with group travel coordination
- One point of contact for all arrangements

CONCERNS:
- Service fees will add to overall cost (typically 10-15%)
- Less direct control over flight selection
- Requires advance booking timeline
- Need to verify Erasmus+ experience

VALUE PROPOSITION:
${agency.name} offers professional coordination services that can simplify complex group travel logistics. They handle booking, documentation, and provide support throughout the process. This is particularly valuable for first-time group coordinators or complex multi-country travel.

RECOMMENDATION: Worth requesting a quote to compare their all-inclusive pricing against direct booking. Consider the value of their coordination services and support.`
  }
}
