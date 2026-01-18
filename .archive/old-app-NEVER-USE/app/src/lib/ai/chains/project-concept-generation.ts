import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ProjectConceptSchema } from '@/lib/schemas/project-concept'
import { PROJECT_CONCEPT_GENERATION_PROMPT } from '@/lib/ai/prompts/project-concept-generation'
import type { ProjectDNA, ProjectConcept, SimilarProject } from '@/lib/types/project'

/**
 * Generate project concept from Project DNA
 *
 * Uses GPT-4 to create a complete Erasmus+ Youth Exchange project concept.
 * Temperature is set higher (0.8) for creative generation.
 */
export async function generateProjectConcept(
  projectDna: ProjectDNA,
  similarProjects: SimilarProject[] = []
): Promise<ProjectConcept> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.8, // Higher for creativity
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(ProjectConceptSchema)

  const prompt = PromptTemplate.fromTemplate(PROJECT_CONCEPT_GENERATION_PROMPT)

  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      projectDnaJson: JSON.stringify(projectDna, null, 2),
      similarProjectsJson:
        similarProjects.length > 0
          ? JSON.stringify(similarProjects, null, 2)
          : 'No similar projects available for reference.',
      duration: projectDna.duration_preference,
      participants: projectDna.target_group.size,
      format_instructions: parser.getFormatInstructions(),
    })

    return result as ProjectConcept
  } catch (error) {
    console.error('Error generating project concept:', error)
    throw new Error('Failed to generate project concept')
  }
}
