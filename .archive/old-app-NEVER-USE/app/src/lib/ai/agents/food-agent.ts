import { BaseAgent, AgentContext } from './base-agent'

export interface FoodOption {
  name: string
  type: 'caterer' | 'restaurant'
  cuisineType: string
  estimatedPricePerPerson: number
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
  dietaryOptions: string[]
  suitabilityScore: number
  reasoning: string
  pros: string[]
  cons: string[]
}

export class FoodAgent extends BaseAgent {
  constructor() {
    super('gpt-4-turbo-preview')
  }

  async research(context: AgentContext): Promise<FoodOption[]> {
    const contextStr = this.buildContext(context)
    const budgetPerPerson = this.calculateBudgetPerPerson(context)
    const location = context.project?.location || 'City Center'
    const participants = context.project?.participantCount || 30

    const systemPrompt = `You are a food and catering research assistant for Erasmus+ youth projects.

${contextStr}

Your task: Research and suggest 5-7 suitable food options (caterers and group-friendly restaurants).

For each option, provide:
1. Name and type (caterer or restaurant)
2. Cuisine type (Mediterranean, International, etc.)
3. Estimated price per person for group meals (target: ~€${budgetPerPerson})
4. Location details
5. Contact information (if available)
6. Key features (buffet style, delivery, on-site dining, etc.)
7. Capacity information (minimum/maximum group size)
8. Dietary options available (vegan, vegetarian, halal, gluten-free, allergies)
9. Suitability score (0-100) based on budget fit, group experience, dietary flexibility
10. Specific PROS (3-5 bullet points)
11. Specific CONS (2-4 bullet points)
12. Brief verdict/reasoning

Focus on options that:
- Can handle groups of ${participants}+ people
- Fit within budget (€${budgetPerPerson} per person per meal)
- Have experience with youth groups or large gatherings
- Can accommodate common dietary restrictions
- Are reliable and professional

Return your response as a JSON array of food options.`

    const userMessage = `Please research catering and restaurant options for group meals in ${location} for ${participants} participants.`

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return suggestions.map((s: any) => ({
          name: s.name || 'Unknown Food Provider',
          type: s.type || 'caterer',
          cuisineType: s.cuisineType || s.cuisine || 'International',
          estimatedPricePerPerson: s.estimatedPricePerPerson || s.price || budgetPerPerson,
          location: s.location || location,
          contact: s.contact || {},
          features: s.features || [],
          capacity: s.capacity || { min: 20, max: 50 },
          dietaryOptions: s.dietaryOptions || s.dietary || ['vegetarian', 'vegan'],
          suitabilityScore: s.suitabilityScore || s.score || 75,
          reasoning: s.reasoning || s.verdict || '',
          pros: s.pros || [],
          cons: s.cons || [],
        }))
      }

      return this.getDefaultSuggestions(context)
    } catch (error) {
      console.error('Food research error:', error)
      return this.getDefaultSuggestions(context)
    }
  }

  async analyzeFoodOption(
    option: Partial<FoodOption>,
    context: AgentContext
  ): Promise<{ pros: string[]; cons: string[]; verdict: string }> {
    const contextStr = this.buildContext(context)
    const participants = context.project?.participantCount || 30

    const systemPrompt = `You are a food and catering analysis expert for Erasmus+ youth projects.

${contextStr}

Analyze the following food option and provide:
1. PROS: 3-5 specific advantages (focus on youth group suitability, budget, dietary flexibility, reliability)
2. CONS: 2-4 specific concerns or limitations (advance notice, capacity, delivery restrictions, etc.)
3. VERDICT: 2-3 sentence summary recommendation

Be specific, practical, and honest. Consider the unique needs of youth group projects.`

    const userMessage = `Analyze this food option:
Name: ${option.name}
Type: ${option.type}
Cuisine: ${option.cuisineType}
Price: €${option.estimatedPricePerPerson}/person
Capacity: ${option.capacity?.min}-${option.capacity?.max} people
Dietary Options: ${option.dietaryOptions?.join(', ')}
Features: ${option.features?.join(', ')}

Group size: ${participants} participants

Provide detailed pros, cons, and verdict.`

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Parse the response to extract pros, cons, and verdict
      const prosMatch = response.match(/PROS?:?\s*([\s\S]*?)(?=CONS?:?|$)/i)
      const consMatch = response.match(/CONS?:?\s*([\s\S]*?)(?=VERDICT:?|$)/i)
      const verdictMatch = response.match(/VERDICT:?\s*([\s\S]*?)$/i)

      const pros = prosMatch
        ? prosMatch[1]
            .split('\n')
            .filter((line) => line.trim().match(/^[-•*\d.]/))
            .map((line) => line.replace(/^[-•*\d.]\s*/, '').trim())
            .filter((line) => line.length > 0)
        : []

      const cons = consMatch
        ? consMatch[1]
            .split('\n')
            .filter((line) => line.trim().match(/^[-•*\d.]/))
            .map((line) => line.replace(/^[-•*\d.]\s*/, '').trim())
            .filter((line) => line.length > 0)
        : []

      const verdict = verdictMatch ? verdictMatch[1].trim() : 'Analysis not available'

      return { pros, cons, verdict }
    } catch (error) {
      console.error('Food option analysis error:', error)
      return {
        pros: ['Suitable for group dining'],
        cons: ['Requires further verification'],
        verdict: 'Contact directly to confirm availability and pricing.',
      }
    }
  }

  async handleChat(context: AgentContext, userMessage: string): Promise<string> {
    const contextStr = this.buildContext(context)

    const systemPrompt = `You are a food and catering research assistant for Erasmus+ youth projects.

${contextStr}

Provide helpful, specific recommendations about catering and group dining options.
Focus on practical advice for finding suitable food services for youth groups.
Consider dietary restrictions, budget constraints, and group logistics.
Be conversational but professional.`

    return this.generateResponse(systemPrompt, userMessage)
  }

  private calculateBudgetPerPerson(context: AgentContext): number {
    if (!context.phase || !context.project) return 15

    const totalBudget = context.phase.budgetAllocated
    const participants = context.project.participantCount || 30
    const days = this.calculateDays(context.phase.startDate, context.phase.endDate)

    // Assume 2 main meals per day (lunch and dinner)
    const mealsPerDay = 2
    const totalMeals = days * mealsPerDay

    return Math.round(totalBudget / (participants * totalMeals))
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  private getDefaultSuggestions(context: AgentContext): FoodOption[] {
    const location = context.project?.location || 'City Center'
    const budgetPerPerson = this.calculateBudgetPerPerson(context)

    return [
      {
        name: `Mediterranean Catering ${location}`,
        type: 'caterer',
        cuisineType: 'Mediterranean',
        estimatedPricePerPerson: Math.round(budgetPerPerson * 1.2),
        location: `${location}, City-wide delivery`,
        contact: {
          email: 'contact@example-caterer.com',
          phone: '+34 XXX XXX XXX',
        },
        features: [
          'Buffet style service',
          'Delivery included',
          'Disposable tableware provided',
          'Flexible menu options',
        ],
        capacity: {
          min: 20,
          max: 100,
        },
        dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal'],
        suitabilityScore: 85,
        reasoning:
          'Experienced with youth groups, flexible menus, handles dietary restrictions well. Good value for money with buffet-style service.',
        pros: [
          'Extensive experience with youth groups and educational programs',
          'Flexible menus with prices €15-25/person fitting budget',
          'Handles all common dietary restrictions (vegan, halal, allergies)',
          'City-wide delivery with reliable timing',
          'Buffet style allows self-service and casual atmosphere',
        ],
        cons: [
          'Requires 48h advance notice for all orders',
          'Minimum order of 20 people per delivery',
          'Drop-off only, no on-site staff included',
          'Peak season (summer) requires earlier booking',
        ],
      },
      {
        name: `Local Bistro & Group Dining`,
        type: 'restaurant',
        cuisineType: 'International',
        estimatedPricePerPerson: Math.round(budgetPerPerson * 0.9),
        location: `${location}, Downtown area`,
        contact: {
          website: 'www.example-bistro.com',
        },
        features: [
          'Private dining area for groups',
          'Set menu options',
          'On-site service',
          'Central location',
        ],
        capacity: {
          min: 25,
          max: 50,
        },
        dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free'],
        suitabilityScore: 78,
        reasoning:
          'Good option for sit-down group meals in central location. Experienced with large groups and offers set menus for easier coordination.',
        pros: [
          'Private dining area available for groups up to 50',
          'Set menu options simplify ordering and timing',
          'Central location easy to reach by public transport',
          'On-site service with staff support',
        ],
        cons: [
          'Less flexibility in menu customization',
          'Requires advance booking (2+ weeks for large groups)',
          'May be noisy during peak dining hours',
        ],
      },
      {
        name: `Budget-Friendly Catering Co.`,
        type: 'caterer',
        cuisineType: 'Local & International Mix',
        estimatedPricePerPerson: Math.round(budgetPerPerson * 0.7),
        location: `${location}, Regional delivery`,
        features: [
          'Budget-conscious options',
          'Simple menu selection',
          'Delivery to venues',
          'Youth group experience',
        ],
        capacity: {
          min: 30,
          max: 150,
        },
        dietaryOptions: ['Vegetarian', 'Vegan'],
        suitabilityScore: 72,
        reasoning:
          'Most economical option, good for projects with tight budgets. Basic but reliable service with experience handling youth events.',
        pros: [
          'Very competitive pricing (€10-18/person)',
          'Can handle large groups (up to 150)',
          'Simple ordering process',
          'Reliable delivery track record',
        ],
        cons: [
          'Limited menu variety and customization',
          'Basic dietary accommodations (vegan/vegetarian only)',
          'Packaging is basic disposables',
          'May need 3-4 days advance notice',
        ],
      },
    ]
  }

  async generateQuoteEmail(
    option: FoodOption,
    context: AgentContext
  ): Promise<{ subject: string; body: string }> {
    const projectName = context.project?.name || 'Youth Exchange Project'
    const location = context.project?.location || 'your city'
    const participants = context.project?.participantCount || 30
    const startDate = context.phase?.startDate
    const endDate = context.phase?.endDate
    const days = startDate && endDate ? this.calculateDays(startDate, endDate) : 7

    const subject = `Group Catering Quote Request - ${projectName} (${participants} participants)`

    const body = `Dear ${option.name} Team,

I hope this message finds you well.

I am writing to request a quote for catering services for an Erasmus+ youth project titled "${projectName}" taking place in ${location}.

PROJECT DETAILS:
- Number of participants: ${participants} young people
- Duration: ${days} days
${startDate ? `- Dates: ${startDate.toLocaleDateString()} to ${endDate?.toLocaleDateString()}` : ''}
- Meals required: Primarily lunch and dinner (${days * 2} total meals)
- Budget target: Approximately €${option.estimatedPricePerPerson}/person per meal

DIETARY REQUIREMENTS:
We need to accommodate various dietary restrictions including:
- Vegetarian options
- Vegan options
- Halal options (if applicable)
- Allergies (will provide detailed list upon confirmation)

SPECIFIC REQUEST:
${option.type === 'caterer'
  ? `We are interested in your catering services with delivery to our venue. Please provide:
1. Menu options suitable for youth groups (${option.cuisineType} cuisine preferred)
2. Pricing per person for buffet-style meals
3. Delivery details and timing flexibility
4. Your experience with similar youth group events`
  : `We are interested in booking group dining at your restaurant. Please provide:
1. Available dates and private dining area capacity
2. Set menu options for groups (${option.cuisineType} cuisine preferred)
3. Pricing per person including service
4. Your experience with similar youth group events`}

Could you please send us:
- Detailed quote with menu options
- Any additional fees (delivery, service, equipment rental)
- Payment terms and cancellation policy
- References from similar youth group events (if available)

This is an official Erasmus+ funded project, and we can provide all necessary documentation for your records.

Please feel free to contact me if you need any additional information. We would appreciate receiving your quote by [DATE - one week from sending].

Thank you for your time and consideration. We look forward to potentially working with you.

Best regards,
[Your Name]
[Your Organization]
[Contact Information]`

    return { subject, body }
  }
}
