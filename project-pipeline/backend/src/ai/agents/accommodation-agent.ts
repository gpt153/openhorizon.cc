import { BaseAgent, AgentContext } from './base-agent.js'
import { prisma } from '../../config/database.js'

export interface AccommodationSuggestion {
  name: string
  type: 'hotel' | 'hostel' | 'residence'
  estimatedPrice: number
  location: string
  features: string[]
  suitabilityScore: number
  reasoning: string
}

export class AccommodationAgent extends BaseAgent {
  constructor() {
    super('claude-3-5-sonnet-20241022')
  }

  async research(context: AgentContext): Promise<AccommodationSuggestion[]> {
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
          reasoning: s.reasoning || s.reason || ''
        }))
      }

      // Fallback: return default suggestions
      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Research error:', error)
      return this.getDefaultSuggestions(context)
    }
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
    const budgetPerPerson = context.phase?.budget_allocated
      ? Number(context.phase.budget_allocated) / (context.project?.participants_count || 50)
      : 100

    return [
      {
        name: `Central Hotel ${location}`,
        type: 'hotel',
        estimatedPrice: budgetPerPerson * 0.8,
        location: `${location}, Downtown`,
        features: ['WiFi', 'Breakfast included', 'Conference room', 'Central location'],
        suitabilityScore: 85,
        reasoning: 'Well-located hotel with good amenities for groups'
      },
      {
        name: `Budget Hostel ${location}`,
        type: 'hostel',
        estimatedPrice: budgetPerPerson * 0.4,
        location: `${location}, Near public transport`,
        features: ['WiFi', 'Shared kitchen', 'Social areas', 'Budget-friendly'],
        suitabilityScore: 75,
        reasoning: 'Cost-effective option with social atmosphere'
      },
      {
        name: `Student Residence ${location}`,
        type: 'residence',
        estimatedPrice: budgetPerPerson * 0.6,
        location: `${location}, University district`,
        features: ['WiFi', 'Study rooms', 'Laundry', 'Student-focused'],
        suitabilityScore: 80,
        reasoning: 'Purpose-built for students with appropriate facilities'
      }
    ]
  }
}
