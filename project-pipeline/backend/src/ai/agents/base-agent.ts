import { ChatAnthropic } from '@langchain/anthropic'
import { env } from '../../config/env.js'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AgentContext {
  project?: any
  phase?: any
  userPreferences?: any
}

export class BaseAgent {
  protected llm: ChatAnthropic
  protected modelName: string

  constructor(modelName: string = 'claude-3-5-sonnet-20241022') {
    this.modelName = modelName
    this.llm = new ChatAnthropic({
      modelName,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      temperature: 0.7,
      maxTokens: 4096
    })
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      const response = await this.llm.invoke(formattedMessages)
      return response.content as string
    } catch (error) {
      console.error('LLM error:', error)
      throw new Error('Failed to get AI response')
    }
  }

  async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
    const messages: Message[] = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ]

    return this.chat(messages)
  }

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
      parts.push(`Dates: ${context.phase.start_date} to ${context.phase.end_date}`)
    }

    return parts.join('\n')
  }
}
