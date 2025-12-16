import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ProjectDNASchema } from '@/lib/schemas/project-dna'
import { PROJECT_DNA_EXTRACTION_PROMPT } from '@/lib/ai/prompts/project-dna-extraction'
import type { UserIdeaInputs, ProjectDNA } from '@/lib/types/project'

/**
 * Extract Project DNA from user inputs
 *
 * Uses GPT-4 to analyze user inputs and extract structured project characteristics.
 * Temperature is set low (0.3) for consistent, analytical extraction.
 */
export async function extractProjectDNA(
  userInputs: UserIdeaInputs
): Promise<ProjectDNA> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.3, // Lower for consistent extraction
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(ProjectDNASchema)

  const prompt = PromptTemplate.fromTemplate(PROJECT_DNA_EXTRACTION_PROMPT)

  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      userInputs: JSON.stringify(userInputs, null, 2),
      format_instructions: parser.getFormatInstructions(),
    })

    return result as ProjectDNA
  } catch (error) {
    console.error('Error extracting Project DNA:', error)
    throw new Error('Failed to extract Project DNA from user inputs')
  }
}
