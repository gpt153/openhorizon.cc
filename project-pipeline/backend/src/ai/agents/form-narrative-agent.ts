import { BaseAgent } from './base-agent.js'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import type { FormContext, FormNarrative } from '../../application-forms/application-forms.types.js'

/**
 * Zod schema for form narrative output
 */
const FormNarrativeOutputSchema = z.object({
  project_description: z.string().describe('Comprehensive description of the project, its purpose, and goals in formal Erasmus+ language'),
  objectives: z.string().describe('Clear, measurable SMART objectives of the project aligned with Erasmus+ priorities'),
  methodology: z.string().describe('Detailed methodology and approach for implementing the project, including innovative aspects'),
  expected_impact: z.string().describe('Expected outcomes, impact on participants, organizations, and wider community'),
  activities_summary: z.string().optional().describe('Summary of key activities, timeline, and deliverables'),
  partnership_description: z.string().optional().describe('Description of partnership structure, roles, and complementarity (for KA2 forms)')
})

/**
 * AI Agent for generating professional form narratives
 *
 * Uses Claude to generate compelling, professional narratives for Erasmus+ application forms
 * based on project data and context.
 */
export class FormNarrativeAgent extends BaseAgent {
  private parser: StructuredOutputParser<z.infer<typeof FormNarrativeOutputSchema>>

  constructor() {
    super('claude-3-5-sonnet-20241022')
    this.parser = StructuredOutputParser.fromZodSchema(FormNarrativeOutputSchema)
  }

  /**
   * Generate professional narratives for an application form
   */
  async generateNarrative(context: FormContext): Promise<FormNarrative> {
    const systemPrompt = this.buildSystemPrompt(context.formType)
    const userMessage = this.buildUserMessage(context)

    try {
      console.log('[FormNarrativeAgent] Generating narratives for', context.formType, 'form')
      const response = await this.generateResponse(systemPrompt, userMessage)
      const narrative = await this.parser.parse(response)

      console.log('[FormNarrativeAgent] Successfully generated narratives')
      return narrative as FormNarrative
    } catch (error) {
      console.error('[FormNarrativeAgent] Failed to generate narrative:', error)
      throw new Error('Failed to generate form narratives')
    }
  }

  /**
   * Build system prompt based on form type
   */
  private buildSystemPrompt(formType: 'KA1' | 'KA2' | 'CUSTOM'): string {
    const basePrompt = `You are an expert in writing Erasmus+ grant applications. You have extensive experience in creating compelling, professional narratives that align with European Commission priorities and evaluation criteria.

Your task is to generate high-quality narrative content for an Erasmus+ application form based on the provided project data.

Requirements:
- Use formal, professional language appropriate for EU grant applications
- Align with Erasmus+ priorities: inclusion, sustainability, digital transformation, participation
- Provide specific, measurable objectives (SMART framework)
- Emphasize European dimension and transnational cooperation
- Focus on impact, innovation, and sustainability
- Use concrete examples and avoid generic statements
- Address EU policy priorities and strategic objectives`

    if (formType === 'KA1') {
      return `${basePrompt}

Specific requirements for KA1 (Learning Mobility):
- Focus on individual learning outcomes and competence development
- Emphasize mobility experience and intercultural learning
- Describe clear selection criteria for participants
- Explain how learning will be recognized and validated
- Connect to participants' personal and professional development`
    } else if (formType === 'KA2') {
      return `${basePrompt}

Specific requirements for KA2 (Cooperation Partnerships):
- Emphasize partnership structure and complementarity of partners
- Describe collaborative approach and added value of cooperation
- Focus on innovative outputs and intellectual products
- Explain dissemination strategy and target audiences
- Address sustainability and mainstreaming of results
- Highlight transnational dimension and European added value`
    }

    return basePrompt
  }

  /**
   * Build user message with project context
   */
  private buildUserMessage(context: FormContext): string {
    const { projectData, additionalContext } = context
    const { project, phase, totalBudget, participants } = projectData

    let message = `Generate comprehensive narratives for the following Erasmus+ project:

PROJECT INFORMATION:
- Title: ${project.name}
- Type: ${project.type}
- Location: ${project.location}
- Duration: ${project.start_date.toLocaleDateString()} to ${project.end_date.toLocaleDateString()}
- Participants: ${participants.count} people
${project.description ? `- Current Description: ${project.description}` : ''}

BUDGET:
- Total Budget: €${totalBudget.allocated.toFixed(2)}
- Budget Spent: €${totalBudget.spent.toFixed(2)}
- Remaining: €${totalBudget.remaining.toFixed(2)}

PHASE INFORMATION:
- Phase Name: ${phase.name}
- Phase Type: ${phase.type}
- Phase Budget: €${phase.budget_allocated}
- Phase Dates: ${phase.start_date.toLocaleDateString()} to ${phase.end_date.toLocaleDateString()}`

    // Add all phases summary
    if (projectData.phases && projectData.phases.length > 0) {
      message += `\n\nPROJECT PHASES:`
      projectData.phases.forEach(p => {
        message += `\n- ${p.name} (${p.type}): €${p.budget_allocated} [${p.status}]`
      })
    }

    // Add project metadata if available
    if (project.metadata) {
      message += `\n\nADDITIONAL METADATA:\n${JSON.stringify(project.metadata, null, 2)}`
    }

    // Add additional context if provided
    if (additionalContext) {
      message += `\n\nADDITIONAL CONTEXT:\n${additionalContext}`
    }

    message += `\n\n${this.parser.getFormatInstructions()}`

    return message
  }
}
