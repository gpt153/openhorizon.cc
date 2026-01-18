import { BaseAgent, AgentContext } from './base-agent'

export interface EmergencyRecommendation {
  category: 'medical' | 'security' | 'communication' | 'insurance' | 'evacuation' | 'documentation'
  priority: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  estimatedCost: number
  implementation: string
  rationale: string
}

export class EmergencyAgent extends BaseAgent {
  constructor() {
    super('gpt-4-turbo-preview')
  }

  async planEmergency(context: AgentContext): Promise<EmergencyRecommendation[]> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an emergency planning assistant for Erasmus+ student exchange programs.

${contextStr}

Your task: Create a comprehensive emergency preparedness plan with 5-7 recommendations.

For each recommendation, provide:
1. Category (medical, security, communication, insurance, evacuation, documentation)
2. Priority level (critical, high, medium, low)
3. Specific recommendation
4. Estimated cost to implement
5. Implementation steps
6. Rationale for why this is important

Consider:
- Student safety abroad
- Medical emergencies
- Communication protocols
- Emergency contacts
- Insurance requirements
- Evacuation procedures
- Documentation needs

Return your response as a JSON array of recommendations.`

    const userMessage = 'Create an emergency preparedness plan for this project.'

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        return recommendations.map((r: any) => ({
          category: r.category || 'medical',
          priority: r.priority || 'medium',
          recommendation: r.recommendation || '',
          estimatedCost: r.estimatedCost || r.cost || 0,
          implementation: r.implementation || r.steps || '',
          rationale: r.rationale || r.reasoning || '',
        }))
      }

      return this.getDefaultRecommendations(context)
    } catch (error) {
      console.error('Emergency planning error:', error)
      return this.getDefaultRecommendations(context)
    }
  }

  async handleChat(context: AgentContext, userMessage: string): Promise<string> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are an emergency planning assistant for Erasmus+ student exchange programs.

${contextStr}

Provide practical, safety-focused recommendations.
Address specific concerns about student safety, emergency protocols, and risk mitigation.
Be reassuring but thorough in addressing potential risks.`

    return this.generateResponse(systemPrompt, userMessage)
  }

  private getDefaultRecommendations(context: AgentContext): EmergencyRecommendation[] {
    return [
      {
        category: 'medical',
        priority: 'critical',
        recommendation: 'Establish 24/7 emergency medical contact system',
        estimatedCost: 500,
        implementation:
          '1. Identify local emergency services\n2. Create emergency contact list\n3. Ensure all participants have emergency numbers\n4. Designate emergency coordinator',
        rationale: 'Immediate access to medical help is essential for student safety',
      },
      {
        category: 'insurance',
        priority: 'critical',
        recommendation: 'Verify comprehensive travel insurance for all participants',
        estimatedCost: 200,
        implementation:
          '1. Review insurance coverage\n2. Confirm medical evacuation included\n3. Collect insurance documentation\n4. Brief participants on claims process',
        rationale: 'Insurance is mandatory for Erasmus+ and protects against financial risk',
      },
      {
        category: 'communication',
        priority: 'high',
        recommendation: 'Set up group communication channels',
        estimatedCost: 0,
        implementation:
          '1. Create WhatsApp/Telegram group\n2. Establish check-in protocol\n3. Share emergency contact tree\n4. Test communication before departure',
        rationale: 'Quick communication is vital during emergencies',
      },
    ]
  }
}
