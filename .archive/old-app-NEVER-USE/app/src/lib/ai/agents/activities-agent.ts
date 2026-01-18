import { BaseAgent, AgentContext } from './base-agent'

export interface ActivitySuggestion {
  name: string
  type: 'workshop' | 'cultural' | 'educational' | 'team-building' | 'sport' | 'excursion'
  estimatedCost: number
  duration: string
  location: string
  description: string
  suitabilityScore: number
  reasoning: string
}

export class ActivitiesAgent extends BaseAgent {
  constructor() {
    super('gpt-4-turbo-preview')
  }

  async research(context: AgentContext): Promise<ActivitySuggestion[]> {
    const contextStr = this.buildContext(context)
    const budgetPerActivity = context.phase ? context.phase.budgetAllocated / 5 : 1000

    const systemPrompt = `You are an educational activities planning assistant for Erasmus+ projects.

${contextStr}

Your task: Suggest 3-5 educational activities suitable for student exchange programs.

For each activity, provide:
1. Name and type (workshop, cultural visit, team-building, etc.)
2. Estimated cost per group (target: ~€${budgetPerActivity})
3. Duration (e.g., "2 hours", "half day")
4. Location
5. Description of what participants will do/learn
6. Suitability score (0-100)
7. Reasoning for recommendation

Focus on activities that:
- Have educational value
- Promote cultural exchange
- Are engaging for young people
- Fit the budget
- Are practical to organize

Return your response as a JSON array of activities.`

    const userMessage = 'Please suggest educational activities for this project.'

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Activity',
          type: s.type || 'educational',
          estimatedCost: s.estimatedCost || s.cost || budgetPerActivity,
          duration: s.duration || '2 hours',
          location: s.location || context.project?.location || '',
          description: s.description || '',
          suitabilityScore: s.suitabilityScore || s.score || 70,
          reasoning: s.reasoning || s.reason || '',
        }))
      }

      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Activities research error:', error)
      return this.getDefaultSuggestions(context)
    }
  }

  async handleChat(context: AgentContext, userMessage: string): Promise<string> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an educational activities planning assistant for Erasmus+ projects.

${contextStr}

Provide creative, practical suggestions for educational activities.
Focus on activities that promote learning, cultural exchange, and engagement.
Be specific about logistics, costs, and educational value.`

    return this.generateResponse(systemPrompt, userMessage)
  }

  private getDefaultSuggestions(context: AgentContext): ActivitySuggestion[] {
    const location = context.project?.location || 'City'
    const budgetPerActivity = context.phase ? context.phase.budgetAllocated / 5 : 1000

    return [
      {
        name: 'Cultural Heritage Walking Tour',
        type: 'cultural',
        estimatedCost: Math.round(budgetPerActivity * 0.3),
        duration: '3 hours',
        location: `${location} Historic Center`,
        description: 'Guided tour exploring local history, architecture, and culture',
        suitabilityScore: 85,
        reasoning: 'Affordable, educational, promotes cultural understanding',
      },
      {
        name: 'Interactive Language Workshop',
        type: 'workshop',
        estimatedCost: Math.round(budgetPerActivity * 0.4),
        duration: '2 hours',
        location: 'Community Center',
        description: 'Hands-on language learning with local students',
        suitabilityScore: 80,
        reasoning: 'Promotes language skills and intercultural communication',
      },
      {
        name: 'Sustainability Project Visit',
        type: 'educational',
        estimatedCost: Math.round(budgetPerActivity * 0.5),
        duration: 'Half day',
        location: 'Local Eco-Initiative',
        description: 'Visit to sustainable business or environmental project',
        suitabilityScore: 82,
        reasoning: 'Aligned with EU priorities, practical learning experience',
      },
    ]
  }
}
