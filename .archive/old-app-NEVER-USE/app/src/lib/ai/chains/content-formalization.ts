import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'

type FieldContext =
  | 'target_group'
  | 'inclusion_plan'
  | 'partner_profile'
  | 'sustainability'
  | 'impact'
  | 'session_title'
  | 'session_description'
  | 'session_preparation'
  | 'day_focus'

const CONTEXT_INSTRUCTIONS: Record<FieldContext, string> = {
  target_group: 'Transform into professional Erasmus+ target group description using formal EU terminology. Emphasize participant demographics, inclusion criteria, and expected outcomes.',
  inclusion_plan: 'Convert to formal inclusion and accessibility plan using Erasmus+ quality standards. Reference EU frameworks for inclusive education.',
  partner_profile: 'Formalize partner description using institutional language suitable for EU funding applications. Emphasize organizational capacity and expertise.',
  sustainability: 'Enhance with formal environmental sustainability terminology for EU applications. Reference sustainable development goals.',
  impact: 'Formalize impact narrative using EU programme evaluation language. Quantify outcomes and align with Key Action objectives.',
  session_title: 'Create professional session title suitable for official programme schedules. Use educational terminology.',
  session_description: 'Transform into formal session description for Erasmus+ documentation. Use structured learning terminology.',
  session_preparation: 'Formalize facilitator preparation notes using professional youth work terminology.',
  day_focus: 'Convert to formal daily focus description for programme documentation. Use pedagogical language.',
}

/**
 * Formalize working mode text to Erasmus+ application-ready language
 */
export async function formalizeText(
  workingText: string,
  context: FieldContext
): Promise<string> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.3, // Lower for consistency
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const prompt = PromptTemplate.fromTemplate(`You are an Erasmus+ application writing expert. Your task is to convert informal "working mode" text into formal, professional "application-ready" language.

CONTEXT: {contextInstruction}

WORKING MODE TEXT:
{workingText}

REQUIREMENTS:
1. Maintain all factual content and meaning
2. Use formal, professional tone appropriate for EU funding applications
3. Incorporate Erasmus+ terminology and framework language (Key Actions, learning outcomes, intercultural dialogue, etc.)
4. Ensure clarity and precision
5. Keep similar length (±20% of original)
6. Reference EU quality standards where applicable
7. Ensure compliance with Erasmus+ Programme Guide terminology

OUTPUT:
Return ONLY the formalized text, no explanations or meta-commentary.`)

  const response = await llm.invoke([
    {
      role: 'user',
      content: await prompt.format({
        contextInstruction: CONTEXT_INSTRUCTIONS[context],
        workingText,
      }),
    },
  ])

  return response.content.toString().trim()
}

/**
 * Batch formalize multiple fields for a project
 */
export async function formalizeProjectFields(fields: {
  targetGroupDescription?: string
  inclusionPlanOverview?: string
  partnerProfile?: string
  sustainabilityNarrative?: string
  impactNarrative?: string
}): Promise<{
  targetGroupDescriptionFormal?: string
  inclusionPlanOverviewFormal?: string
  partnerProfileFormal?: string
  sustainabilityNarrativeFormal?: string
  impactNarrativeFormal?: string
}> {
  const formalized: any = {}

  if (fields.targetGroupDescription) {
    formalized.targetGroupDescriptionFormal = await formalizeText(
      fields.targetGroupDescription,
      'target_group'
    )
  }

  if (fields.inclusionPlanOverview) {
    formalized.inclusionPlanOverviewFormal = await formalizeText(
      fields.inclusionPlanOverview,
      'inclusion_plan'
    )
  }

  if (fields.partnerProfile) {
    formalized.partnerProfileFormal = await formalizeText(
      fields.partnerProfile,
      'partner_profile'
    )
  }

  if (fields.sustainabilityNarrative) {
    formalized.sustainabilityNarrativeFormal = await formalizeText(
      fields.sustainabilityNarrative,
      'sustainability'
    )
  }

  if (fields.impactNarrative) {
    formalized.impactNarrativeFormal = await formalizeText(
      fields.impactNarrative,
      'impact'
    )
  }

  return formalized
}
