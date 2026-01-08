import { BaseAgent, AgentContext } from './base-agent'

export interface AccommodationSuggestion {
  name: string
  type: 'hotel' | 'hostel' | 'residence' | 'apartment' | 'guesthouse'
  estimatedPrice: number
  location: string
  features: string[]
  suitabilityScore: number
  reasoning: string
}

export class AccommodationAgent extends BaseAgent {
  constructor() {
    super('gpt-4-turbo-preview')
  }

  async research(context: AgentContext): Promise<AccommodationSuggestion[]> {
    const contextStr = this.buildContext(context)
    const budgetPerPerson = this.calculateBudgetPerPerson(context)

    const systemPrompt = `You are an accommodation research assistant for Erasmus+ projects.

${contextStr}

Your task: Research and suggest 3-5 suitable accommodation options (hotels, hostels, or student residences).

For each option, provide:
1. Name and type
2. Estimated price per night per person (target: ~€${budgetPerPerson})
3. Location details
4. Key features (breakfast, WiFi, location proximity, etc.)
5. Suitability score (0-100) based on budget fit, location, amenities
6. Brief reasoning why it's suitable

Focus on options that:
- Fit within the budget
- Are suitable for student groups
- Have good accessibility
- Offer group-friendly amenities

Return your response as a JSON array of accommodations.`

    const userMessage = 'Please research accommodation options for this project.'

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Unknown',
          type: s.type || 'hotel',
          estimatedPrice: s.estimatedPrice || s.price || budgetPerPerson,
          location: s.location || context.project?.location || '',
          features: s.features || [],
          suitabilityScore: s.suitabilityScore || s.score || 70,
          reasoning: s.reasoning || s.reason || '',
        }))
      }

      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Research error:', error)
      return this.getDefaultSuggestions(context)
    }
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
    const nights = this.calculateNights(context.phase.startDate, context.phase.endDate)

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
        name: `Central Hotel ${location}`,
        type: 'hotel',
        estimatedPrice: Math.round(budgetPerPerson * 0.8),
        location: `${location}, Downtown`,
        features: ['WiFi', 'Breakfast included', 'Conference room', 'Central location'],
        suitabilityScore: 85,
        reasoning: 'Well-located hotel with good amenities for groups',
      },
      {
        name: `Budget Hostel ${location}`,
        type: 'hostel',
        estimatedPrice: Math.round(budgetPerPerson * 0.4),
        location: `${location}, Near public transport`,
        features: ['WiFi', 'Shared kitchen', 'Social areas', 'Budget-friendly'],
        suitabilityScore: 75,
        reasoning: 'Cost-effective option with social atmosphere',
      },
      {
        name: `Student Residence ${location}`,
        type: 'residence',
        estimatedPrice: Math.round(budgetPerPerson * 0.6),
        location: `${location}, University district`,
        features: ['WiFi', 'Study rooms', 'Laundry', 'Student-focused'],
        suitabilityScore: 80,
        reasoning: 'Purpose-built for students with appropriate facilities',
      },
    ]
  }
}
