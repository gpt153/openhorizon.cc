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
