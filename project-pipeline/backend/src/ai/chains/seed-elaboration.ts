import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ElaborationResponseSchema } from '../../seeds/seeds.schemas.js'
import { SEED_ELABORATION_PROMPT } from '../prompts/seed-elaboration.js'
import type { GeneratedSeed, ElaborationMessage, ElaborationResponse } from '../../seeds/seeds.types.js'

/**
 * Elaborate seed through conversational interaction
 *
 * Takes current seed state, conversation history, and user message.
 * Returns assistant response with suggestions and optionally updated seed.
 */
export async function elaborateSeed(
  currentSeed: GeneratedSeed,
  conversationHistory: ElaborationMessage[],
  userMessage: string
): Promise<ElaborationResponse> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7, // Balanced for conversation
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(ElaborationResponseSchema)
  const prompt = PromptTemplate.fromTemplate(SEED_ELABORATION_PROMPT)
  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      currentSeedJson: JSON.stringify(currentSeed, null, 2),
      conversationHistoryJson: JSON.stringify(conversationHistory, null, 2),
      userMessage,
      format_instructions: parser.getFormatInstructions(),
    })

    return result as ElaborationResponse
  } catch (error) {
    console.error('❌ Error elaborating seed:', error)
    throw new Error('Failed to elaborate seed')
  }
}
