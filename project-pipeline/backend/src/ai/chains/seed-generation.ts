import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { SeedsArraySchema } from '../../seeds/seeds.schemas.js'
import { SEED_GENERATION_PROMPT } from '../prompts/seed-generation.js'
import type { BrainstormInput, GeneratedSeed } from '../../seeds/seeds.types.js'

/**
 * Generate creative project seeds from user prompt
 *
 * Uses GPT-4 with high temperature for maximum creativity.
 * Returns an array of diverse, inspiring seed ideas.
 */
export async function generateSeeds(
  input: BrainstormInput
): Promise<GeneratedSeed[]> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: input.creativityTemp || 0.9,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(SeedsArraySchema)
  const prompt = PromptTemplate.fromTemplate(SEED_GENERATION_PROMPT)
  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      prompt: input.prompt,
      creativityTemp: input.creativityTemp || 0.9,
      seedCount: input.seedCount || 10,
      format_instructions: parser.getFormatInstructions(),
    })

    return (result as any).seeds as GeneratedSeed[]
  } catch (error) {
    console.error('❌ Error generating seeds:', error)
    throw new Error('Failed to generate seeds')
  }
}
