# Plan: Pipeline AI Agents Integration

## Summary

Integrate AI agents (Accommodation, Activities, Emergency) into the pipeline management UI by:
1. Adapting agent classes from project-pipeline to use OpenAI (matching app's existing pattern)
2. Adding chat endpoint to pipeline tRPC router
3. Building interactive chat UI component
4. Replacing placeholder with working AI assistant

This enables users to get intelligent recommendations for accommodation, activities, and emergency planning directly within each phase.

## Intent

Users need intelligent assistance when planning Erasmus+ project phases. Currently the UI shows a placeholder "Coming Soon" message. This implementation will provide:
- **Accommodation phase**: Hotel/hostel suggestions based on location, dates, budget, participant count
- **Activities phase**: Educational activity recommendations matching project goals
- **Emergency phase**: Safety planning, risk assessment, emergency protocols

The AI agents will provide contextual recommendations that users can discuss iteratively, refining searches based on feedback.

## Persona

**Maria - Erasmus+ Project Coordinator**
- Managing 3-5 concurrent student exchange projects
- Needs to quickly find suitable vendors (hotels, activity providers)
- Limited time to research options manually
- Wants recommendations that fit budget constraints
- Needs to compare multiple options before requesting quotes

## UX

### Before (Current State)
```
┌─────────────────────────────────────────────────┐
│  Phase: Accommodation                           │
├─────────────────────────────────────────────────┤
│  Budget: €12,000 | Spent: €0                   │
│  Quotes: 0 pending, 0 accepted                  │
│                                                  │
│  [Add Quote Button]                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  AI Agent Chat                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│         ✨ AI Agent Coming Soon                 │
│                                                  │
│  Chat with specialized AI agents for:           │
│  • Accommodation recommendations                │
│  • Activity planning                            │
│  • Emergency planning                           │
│                                                  │
│  This feature will be available soon!           │
│                                                  │
└─────────────────────────────────────────────────┘
```

### After (With AI Agents)
```
┌─────────────────────────────────────────────────┐
│  Phase: Accommodation                           │
├─────────────────────────────────────────────────┤
│  Budget: €12,000 | Spent: €0                   │
│  Quotes: 0 pending, 0 accepted                  │
│                                                  │
│  [Add Quote Button]                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🤖 Accommodation Assistant                     │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐ │
│  │ 🤖 I can help you find accommodation      │ │
│  │    options for 30 participants in         │ │
│  │    Barcelona from May 15-22, 2026.        │ │
│  │                                            │ │
│  │    Budget per person: ~€57/night          │ │
│  │                                            │ │
│  │    Would you like me to research:         │ │
│  │    • Budget hostels (~€25/night)          │ │
│  │    • Mid-range hotels (~€55/night)        │ │
│  │    • Student residences (~€40/night)      │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Research mid-range hotels please       │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 🤖 I found 3 suitable hotels:             │ │
│  │                                            │ │
│  │    1. Hotel Barcelona Center (⭐ 8.5/10)  │ │
│  │       €52/night • WiFi • Breakfast        │ │
│  │       Downtown, 10min to metro            │ │
│  │       Suitability: 92/100                 │ │
│  │                                            │ │
│  │    2. Hostal Gracia (⭐ 8.2/10)           │ │
│  │       €48/night • WiFi • Kitchen access   │ │
│  │       Near university district            │ │
│  │       Suitability: 87/100                 │ │
│  │                                            │ │
│  │    3. Student Inn BCN (⭐ 7.9/10)         │ │
│  │       €45/night • Study rooms • Laundry   │ │
│  │       Student-focused amenities           │ │
│  │       Suitability: 85/100                 │ │
│  │                                            │ │
│  │    Which would you like to explore?       │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ Tell me more about Hotel Barcelona Center │ │
│  │ [Send] 🔄                                 │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## External Research

### Documentation

**LangChain with OpenAI**
- [LangChain JS Docs](https://js.langchain.com/docs/get_started/introduction) - Already used in app
- Key finding: App uses `ChatOpenAI` from `@langchain/openai` (not Anthropic)
- Pattern exists in: `app/src/lib/ai/chains/seed-generation.ts`

**tRPC Mutations for Streaming/Long Operations**
- [tRPC Docs - Mutations](https://trpc.io/docs/server/procedures#mutations) - Standard mutation pattern
- No streaming needed - agents respond in single message (< 10 sec)

**React Query for Cache Management**
- [TanStack Query Docs](https://tanstack.com/query/latest) - Already integrated via tRPC
- Cache invalidation pattern: `utils.pipeline.phases.getById.invalidate({ id })`

### Gotchas & Best Practices

1. **Use OpenAI, not Anthropic**
   - Project-pipeline uses `@langchain/anthropic` with Claude
   - Main app uses `@langchain/openai` with GPT-4
   - Must adapt agents to use `ChatOpenAI` to match existing pattern

2. **Prisma Decimal Type Handling**
   - Budget calculations involve Decimal types from Prisma
   - Must convert to number: `Number(phase.budgetAllocated)`
   - Already established pattern in frontend components

3. **Organization-Scoped Security**
   - All pipeline routes use `orgProcedure` for multi-tenancy
   - Must verify phase ownership through project → tenantId check

4. **Conversation Storage**
   - AIConversation model already exists in database
   - Store each message exchange (user message + AI response)
   - Link to phase via `phaseId` foreign key

5. **Error Handling in AI Calls**
   - OpenAI API can timeout or return errors
   - Provide fallback responses
   - Log errors for debugging

## Patterns to Mirror

### Pattern 1: AI Chain with ChatOpenAI (seed-generation.ts)
```typescript
// FROM: app/src/lib/ai/chains/seed-generation.ts:17-39
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
})

const parser = StructuredOutputParser.fromZodSchema(SeedsArraySchema)
const prompt = PromptTemplate.fromTemplate(SEED_GENERATION_PROMPT)
const chain = prompt.pipe(model).pipe(parser)

try {
  const result = await chain.invoke({
    prompt: input.prompt,
    format_instructions: parser.getFormatInstructions(),
  })
  return result.seeds as GeneratedSeed[]
} catch (error) {
  console.error('❌ Error generating seeds:', error)
  throw new Error('Failed to generate seeds')
}
```

### Pattern 2: tRPC Mutation with Org Security (phases.ts)
```typescript
// FROM: app/src/server/routers/pipeline/phases.ts:189-266
createDefaultPhases: orgProcedure
  .input(z.object({ projectId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    // Verify project ownership
    const project = await ctx.prisma.pipelineProject.findFirst({
      where: {
        id: input.projectId,
        tenantId: ctx.orgId,
      },
    })

    if (!project) {
      throw new Error('Pipeline project not found')
    }

    // ... mutation logic
  })
```

### Pattern 3: Phase Context Building (base-agent.ts)
```typescript
// FROM: project-pipeline/backend/src/ai/agents/base-agent.ts:53-71
protected buildContext(context: AgentContext): string {
  const parts: string[] = []

  if (context.project) {
    parts.push(`Project: ${context.project.name}`)
    parts.push(`Location: ${context.project.location}`)
    parts.push(`Participants: ${context.project.participants_count}`)
    parts.push(`Dates: ${context.project.start_date} to ${context.project.end_date}`)
  }

  if (context.phase) {
    parts.push(`\nPhase: ${context.phase.name}`)
    parts.push(`Type: ${context.phase.type}`)
    parts.push(`Budget: €${context.phase.budget_allocated}`)
  }

  return parts.join('\n')
}
```

### Pattern 4: Client Component with tRPC Mutation
```typescript
// FROM: app/src/components/pipeline/CreateProjectDialog.tsx:25-36
const createMutation = trpc.pipeline.projects.create.useMutation({
  onSuccess: (data) => {
    toast.success('Pipeline project created successfully')
    utils.pipeline.projects.list.invalidate()
    onOpenChange(false)
    resetForm()
    router.push(`/pipeline/projects/${data.id}`)
  },
  onError: (error) => {
    toast.error(`Failed to create project: ${error.message}`)
  },
})
```

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/src/lib/ai/agents/base-agent.ts` | CREATE | Base class for all agents using ChatOpenAI |
| `app/src/lib/ai/agents/accommodation-agent.ts` | CREATE | Accommodation research agent |
| `app/src/lib/ai/agents/activities-agent.ts` | CREATE | Activities planning agent |
| `app/src/lib/ai/agents/emergency-agent.ts` | CREATE | Emergency planning agent |
| `app/src/lib/ai/agents/registry.ts` | CREATE | Factory to get agent by phase type |
| `app/src/server/routers/pipeline/phases.ts` | UPDATE | Add `chat` mutation for AI conversations |
| `app/src/components/pipeline/PhaseChat.tsx` | CREATE | Interactive chat UI component |
| `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx` | UPDATE | Replace ChatPlaceholder with PhaseChat |
| `app/tests/pipeline-ai-agents.spec.ts` | CREATE | E2E tests for AI agent chat |

## NOT Building

- ❌ **Real hotel scraping** - Project-pipeline has this but it adds complexity (Playwright scraper). Phase 1 focuses on AI-only suggestions.
- ❌ **Streaming responses** - Keep simple with single response per message. Can add streaming in future if needed.
- ❌ **Multi-turn conversation memory** - Each chat call is independent with fresh context. Can add conversation history in Phase 2.
- ❌ **Agent for every phase type** - Only building 3 agents (Accommodation, Activities, Emergency). Others return placeholder response.
- ❌ **Email integration** - That's the next task. This focuses only on chat recommendations.

## Tasks

### Task 1: Create BaseAgent class

**Why**: Foundation for all specialized agents, using ChatOpenAI to match app pattern

**Mirror**: `project-pipeline/backend/src/ai/agents/base-agent.ts:15-72` + `app/src/lib/ai/chains/seed-generation.ts:17-21`

**Do**:
Create `app/src/lib/ai/agents/base-agent.ts`:
```typescript
import { ChatOpenAI } from '@langchain/openai'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AgentContext {
  project?: {
    name: string
    location: string
    participantCount: number
    startDate: Date
    endDate: Date
  }
  phase?: {
    name: string
    type: string
    budgetAllocated: number
    startDate: Date
    endDate: Date
  }
}

export class BaseAgent {
  protected llm: ChatOpenAI
  protected modelName: string

  constructor(modelName: string = 'gpt-4-turbo-preview') {
    this.modelName = modelName
    this.llm = new ChatOpenAI({
      modelName,
      openAIApiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.7,
      maxTokens: 2048,
    })
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const response = await this.llm.invoke(formattedMessages as any)
      return response.content as string
    } catch (error) {
      console.error('LLM error:', error)
      throw new Error('Failed to get AI response')
    }
  }

  async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
    const messages: Message[] = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ]

    return this.chat(messages)
  }

  protected buildContext(context: AgentContext): string {
    const parts: string[] = []

    if (context.project) {
      parts.push(`Project: ${context.project.name}`)
      parts.push(`Location: ${context.project.location}`)
      parts.push(`Participants: ${context.project.participantCount}`)
      parts.push(
        `Dates: ${context.project.startDate.toLocaleDateString()} to ${context.project.endDate.toLocaleDateString()}`
      )
    }

    if (context.phase) {
      parts.push(`\nPhase: ${context.phase.name}`)
      parts.push(`Type: ${context.phase.type}`)
      parts.push(`Budget: €${context.phase.budgetAllocated}`)
      parts.push(
        `Phase Dates: ${context.phase.startDate.toLocaleDateString()} to ${context.phase.endDate.toLocaleDateString()}`
      )
    }

    return parts.join('\n')
  }
}
```

**Don't**:
- Don't use `@langchain/anthropic` - app uses OpenAI
- Don't add scraping dependencies
- Don't implement conversation memory yet

**Verify**: `npx tsc --noEmit`

### Task 2: Create AccommodationAgent

**Why**: Provides hotel/hostel recommendations for accommodation phases

**Mirror**: `project-pipeline/backend/src/ai/agents/accommodation-agent.ts:22-219` (AI-only research method)

**Do**:
Create `app/src/lib/ai/agents/accommodation-agent.ts`:
```typescript
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
```

**Don't**:
- Don't implement scraping (too complex for Phase 1)
- Don't store suggestions in database yet
- Don't add refineSearch method yet

**Verify**: `npx tsc --noEmit`

### Task 3: Create ActivitiesAgent

**Why**: Provides activity recommendations for activities/events phases

**Mirror**: `app/src/lib/ai/agents/accommodation-agent.ts` (same structure, different domain)

**Do**:
Create `app/src/lib/ai/agents/activities-agent.ts`:
```typescript
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
```

**Don't**:
- Don't integrate with external activity booking APIs
- Don't implement payment processing
- Don't add booking confirmation logic

**Verify**: `npx tsc --noEmit`

### Task 4: Create EmergencyAgent

**Why**: Provides emergency planning and risk assessment for emergency phases

**Mirror**: `app/src/lib/ai/agents/activities-agent.ts` (same structure)

**Do**:
Create `app/src/lib/ai/agents/emergency-agent.ts`:
```typescript
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
```

**Don't**:
- Don't implement real-time emergency alerts
- Don't integrate with emergency services APIs
- Don't create incident reporting system yet

**Verify**: `npx tsc --noEmit`

### Task 5: Create Agent Registry

**Why**: Factory to instantiate the correct agent based on phase type

**Mirror**: `project-pipeline/backend/src/ai/agents/registry.ts:1-18`

**Do**:
Create `app/src/lib/ai/agents/registry.ts`:
```typescript
import { BaseAgent } from './base-agent'
import { AccommodationAgent } from './accommodation-agent'
import { ActivitiesAgent } from './activities-agent'
import { EmergencyAgent } from './emergency-agent'

export function getAgentForPhaseType(phaseType: string): BaseAgent {
  switch (phaseType) {
    case 'ACCOMMODATION':
      return new AccommodationAgent()
    case 'ACTIVITIES':
      return new ActivitiesAgent()
    case 'EMERGENCY':
      return new EmergencyAgent()
    case 'TRAVEL':
    case 'FOOD':
    case 'INSURANCE':
    case 'CUSTOM':
    default:
      // Return base agent with generic responses for other phase types
      return new BaseAgent()
  }
}
```

**Don't**:
- Don't create agents for all phase types yet
- Don't cache agent instances (create fresh each time)

**Verify**: `npx tsc --noEmit`

### Task 6: Add Chat Endpoint to Phases Router

**Why**: tRPC mutation to enable AI chat from frontend

**Mirror**: `app/src/server/routers/pipeline/phases.ts:189-266` (createDefaultPhases pattern)

**Do**:
Update `app/src/server/routers/pipeline/phases.ts` - add this procedure before the closing `})`:
```typescript
  // Chat with AI agent for a phase
  chat: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        userMessage: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get phase with project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Build agent context
      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get appropriate agent
      const { getAgentForPhaseType } = await import('@/lib/ai/agents/registry')
      const agent = getAgentForPhaseType(phase.type)

      // Generate response
      let aiResponse: string
      try {
        aiResponse = await agent.generateResponse(
          `You are an AI assistant helping with ${phase.type.toLowerCase()} planning for Erasmus+ projects. Be helpful, specific, and practical.`,
          input.userMessage
        )
      } catch (error) {
        console.error('AI agent error:', error)
        aiResponse =
          "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists."
      }

      // Store conversation
      const conversation = await ctx.prisma.aIConversation.create({
        data: {
          phaseId: input.phaseId,
          userMessage: input.userMessage,
          aiResponse: aiResponse,
        },
      })

      return {
        response: aiResponse,
        conversationId: conversation.id,
      }
    }),
```

**Don't**:
- Don't implement streaming responses yet
- Don't load conversation history (each call is independent)
- Don't add rate limiting yet

**Verify**: `npx tsc --noEmit && npm run build`

### Task 7: Create PhaseChat Component

**Why**: Interactive chat UI to replace placeholder

**Mirror**: `app/src/components/pipeline/CreateProjectDialog.tsx:1-154` (client component with mutation pattern)

**Do**:
Create `app/src/components/pipeline/PhaseChat.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, Bot, User } from 'lucide-react'
import { toast } from 'sonner'

type PhaseChatProps = {
  phaseId: string
  phaseType: string
  phaseName: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function PhaseChat({ phaseId, phaseType, phaseName }: PhaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')

  const chatMutation = trpc.pipeline.phases.chat.useMutation({
    onSuccess: (data) => {
      // Add AI response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: data.conversationId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        },
      ])
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`)
    },
  })

  const handleSendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ])

    // Send to API
    chatMutation.mutate({
      phaseId,
      userMessage,
    })
  }

  const getAgentTitle = () => {
    switch (phaseType) {
      case 'ACCOMMODATION':
        return '🏨 Accommodation Assistant'
      case 'ACTIVITIES':
        return '🎯 Activities Planner'
      case 'EMERGENCY':
        return '🚨 Emergency Planning Assistant'
      case 'TRAVEL':
        return '✈️ Travel Coordinator'
      case 'FOOD':
        return '🍽️ Catering Advisor'
      case 'INSURANCE':
        return '🛡️ Insurance Advisor'
      default:
        return '🤖 AI Assistant'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {getAgentTitle()}
        </CardTitle>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ask questions about {phaseName.toLowerCase()} planning
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
              <p className="text-sm">
                Start a conversation! Ask me about recommendations, budget planning, or logistics.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type your message..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Don't**:
- Don't persist messages to localStorage (stateless for now)
- Don't implement message editing
- Don't add file upload capability yet

**Verify**: `npx tsc --noEmit`

### Task 8: Integrate PhaseChat into Phase Detail Page

**Why**: Replace placeholder with working chat component

**Mirror**: `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx:1-100`

**Do**:
Update `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`:

1. Remove import of `ChatPlaceholder`:
```typescript
// DELETE THIS LINE:
import { ChatPlaceholder } from '@/components/pipeline/ChatPlaceholder'
```

2. Add import of `PhaseChat`:
```typescript
import { PhaseChat } from '@/components/pipeline/PhaseChat'
```

3. Replace `<ChatPlaceholder />` with:
```typescript
<PhaseChat
  phaseId={phaseId}
  phaseType={phase.type}
  phaseName={phase.name}
/>
```

**Don't**:
- Don't remove the ChatPlaceholder component file yet (might use elsewhere)
- Don't change the two-column layout
- Don't modify the phase management sections

**Verify**: `npm run dev` and visit a phase detail page

### Task 9: Add E2E Tests for AI Chat

**Why**: Validate chat functionality works end-to-end

**Mirror**: `app/tests/pipeline-ui.spec.ts:1-100`

**Do**:
Create `app/tests/pipeline-ai-agents.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Pipeline AI Agents', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page
    await page.goto('/')
    await page.getByRole('link', { name: 'Pipeline Projects' }).click()
  })

  test('should display accommodation assistant in accommodation phase', async ({ page }) => {
    // Click first project
    await page.getByRole('button', { name: /view project/i }).first().click()

    // Wait for page load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Find and click accommodation phase
    const accommodationPhase = page.locator('text=Accommodation').first()
    await accommodationPhase.click()

    // Should show chat interface
    await expect(page.getByRole('heading', { name: /Accommodation Assistant/i })).toBeVisible()
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible()
  })

  test('should send message and receive AI response', async ({ page }) => {
    // Navigate to accommodation phase
    await page.getByRole('button', { name: /view project/i }).first().click()
    await page.locator('text=Accommodation').first().click()

    // Type and send message
    const input = page.getByPlaceholder('Type your message...')
    await input.fill('What accommodation options do you recommend?')
    await page.getByRole('button', { name: /send/i }).click()

    // User message should appear
    await expect(page.locator('text=What accommodation options do you recommend?')).toBeVisible()

    // Wait for AI response (max 10 seconds)
    await expect(page.locator('[class*="bg-zinc-100"]').filter({ hasText: /hotel|hostel|accommodation/i })).toBeVisible({ timeout: 10000 })
  })

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Navigate to accommodation phase
    await page.getByRole('button', { name: /view project/i }).first().click()
    await page.locator('text=Accommodation').first().click()

    const input = page.getByPlaceholder('Type your message...')
    const sendButton = page.getByRole('button', { name: /send/i })

    // First message
    await input.fill('Hello')
    await sendButton.click()
    await expect(page.locator('text=Hello')).toBeVisible()

    // Wait for response
    await page.waitForTimeout(3000)

    // Second message
    await input.fill('What is the budget per person?')
    await sendButton.click()
    await expect(page.locator('text=What is the budget per person?')).toBeVisible()

    // Should have 2 user messages
    const userMessages = page.locator('[class*="bg-blue-600"]')
    await expect(userMessages).toHaveCount(2)
  })

  test('should show different assistants for different phase types', async ({ page }) => {
    // Navigate to project
    await page.getByRole('button', { name: /view project/i }).first().click()

    // Check accommodation phase
    await page.locator('text=Accommodation').first().click()
    await expect(page.getByRole('heading', { name: /Accommodation Assistant/i })).toBeVisible()

    // Go back
    await page.goBack()

    // Check activities phase
    await page.locator('text=Activities').first().click()
    await expect(page.getByRole('heading', { name: /Activities Planner/i })).toBeVisible()

    // Go back
    await page.goBack()

    // Check emergency phase
    await page.locator('text=Emergency').first().click()
    await expect(page.getByRole('heading', { name: /Emergency Planning Assistant/i })).toBeVisible()
  })
})
```

**Don't**:
- Don't test for specific AI responses (they're non-deterministic)
- Don't mock the AI API (test real integration)
- Don't add performance tests yet

**Verify**: `npx playwright test pipeline-ai-agents.spec.ts`

## Validation Strategy

### Automated Checks
- [ ] `npx tsc --noEmit` - TypeScript compilation passes
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm run build` - Production build succeeds
- [ ] `npx playwright test` - All E2E tests pass (including new AI agent tests)

### New Tests to Write

| Test File | Test Case | What It Validates |
|-----------|-----------|-------------------|
| `pipeline-ai-agents.spec.ts` | Display accommodation assistant | Chat UI renders for accommodation phase |
| `pipeline-ai-agents.spec.ts` | Send message and receive response | End-to-end AI chat works with real API |
| `pipeline-ai-agents.spec.ts` | Multiple messages in conversation | Chat state management works correctly |
| `pipeline-ai-agents.spec.ts` | Different assistants for phase types | Agent registry correctly switches agents |

### Manual/E2E Validation

```bash
# Start dev server
cd app
npm run dev

# In browser: http://localhost:3000
# 1. Login
# 2. Navigate to Pipeline Projects
# 3. Click on a project
# 4. Create default phases if none exist
# 5. Click on Accommodation phase
# 6. Verify: Chat UI visible with "Accommodation Assistant" title
# 7. Type: "What hotels do you recommend?"
# 8. Click Send
# 9. Verify: User message appears in blue bubble
# 10. Verify: AI response appears in gray bubble within 10 seconds
# 11. Verify: Response mentions hotels, budget, or accommodation
# 12. Type follow-up: "What about the budget?"
# 13. Verify: Second conversation works
# 14. Navigate back to project
# 15. Click on Activities phase
# 16. Verify: Different assistant title "Activities Planner"
# 17. Type: "Suggest some educational activities"
# 18. Verify: Response suggests activities
# 19. Navigate to Emergency phase
# 20. Verify: "Emergency Planning Assistant" title
# 21. Type: "What should our emergency plan include?"
# 22. Verify: Response covers safety, insurance, contacts, etc.
```

Expected results:
- All 3 agents respond within 10 seconds
- Responses are contextual to the phase type
- Messages persist during the session
- No console errors
- Loading states work correctly

### Edge Cases to Test

- [ ] **Empty message** - Send button should be disabled
- [ ] **Long message** - Should wrap correctly in UI
- [ ] **API error** - Should show error message, not crash
- [ ] **OpenAI timeout** - Should handle gracefully with fallback message
- [ ] **Missing OPENAI_API_KEY** - Should fail with clear error message
- [ ] **Phase without project context** - Should handle missing data gracefully
- [ ] **Rapid successive messages** - Should queue properly, not overlap
- [ ] **Phase type with no specialized agent** - Should use base agent

### Regression Check

- [ ] Existing pipeline UI still works:
  - Projects list loads
  - Project detail shows grant calculations
  - Create default phases works
  - Phase detail shows budget and quotes
  - Quote acceptance/rejection works
- [ ] Profit dashboard still works
- [ ] TypeScript compilation still passes
- [ ] All existing Playwright tests still pass

## Risks

1. **OpenAI API costs** - Each chat message costs ~$0.01-0.05. Mitigation: Monitor usage, add rate limiting in future
2. **Response quality** - AI might give unhelpful responses. Mitigation: Well-crafted system prompts, fallback responses
3. **Response time** - OpenAI can take 5-10 seconds. Mitigation: Loading state, timeout handling
4. **Missing API key** - Deployment without OPENAI_API_KEY will fail. Mitigation: Environment variable validation
5. **Agent confusion** - Base agent for unsupported phases gives generic responses. Mitigation: Clear system prompts for each agent type
