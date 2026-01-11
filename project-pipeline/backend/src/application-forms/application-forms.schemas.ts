import { z } from 'zod'

/**
 * Schema for phase ID parameter
 */
export const PhaseIdParamSchema = z.object({
  phaseId: z.string().cuid()
})

/**
 * Schema for form ID parameter
 */
export const FormIdParamSchema = z.object({
  id: z.string().cuid()
})

/**
 * Schema for generate form request body
 */
export const GenerateFormBodySchema = z.object({
  formType: z.enum(['KA1', 'KA2', 'CUSTOM']),
  aiGenerated: z.boolean().optional().default(false),
  includeNarratives: z.boolean().optional().default(false),
  additionalContext: z.string().optional()
})

/**
 * Schema for update form request body
 */
export const UpdateFormBodySchema = z.object({
  form_data: z.record(z.unknown()).optional(),
  generated_narratives: z.object({
    project_description: z.string().optional(),
    objectives: z.string().optional(),
    methodology: z.string().optional(),
    expected_impact: z.string().optional(),
    activities_summary: z.string().optional(),
    partnership_description: z.string().optional()
  }).optional()
})

/**
 * Schema for export form request body
 */
export const ExportFormBodySchema = z.object({
  format: z.enum(['pdf', 'docx'])
})

/**
 * Schema for list forms query parameters
 */
export const ListFormsQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'FINALIZED']).optional()
})

/**
 * Schema for form narrative output
 */
export const FormNarrativeSchema = z.object({
  project_description: z.string().describe('Comprehensive description of the project, its purpose, and goals'),
  objectives: z.string().describe('Clear, measurable objectives of the project'),
  methodology: z.string().describe('Detailed methodology and approach for implementing the project'),
  expected_impact: z.string().describe('Expected outcomes, impact, and benefits of the project'),
  activities_summary: z.string().optional().describe('Summary of key activities and timeline'),
  partnership_description: z.string().optional().describe('Description of partnership structure (for KA2 forms)')
})

/**
 * Schema for form response
 */
export const FormResponseSchema = z.object({
  id: z.string(),
  phase_id: z.string(),
  project_id: z.string(),
  form_type: z.enum(['KA1', 'KA2', 'CUSTOM']),
  version: z.number(),
  status: z.enum(['DRAFT', 'FINALIZED']),
  form_data: z.record(z.unknown()),
  generated_narratives: FormNarrativeSchema.optional(),
  created_by: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  finalized_at: z.date().optional()
})

/**
 * Schema for list forms response
 */
export const ListFormsResponseSchema = z.object({
  forms: z.array(FormResponseSchema)
})

// Export types derived from schemas
export type PhaseIdParam = z.infer<typeof PhaseIdParamSchema>
export type FormIdParam = z.infer<typeof FormIdParamSchema>
export type GenerateFormBody = z.infer<typeof GenerateFormBodySchema>
export type UpdateFormBody = z.infer<typeof UpdateFormBodySchema>
export type ExportFormBody = z.infer<typeof ExportFormBodySchema>
export type ListFormsQuery = z.infer<typeof ListFormsQuerySchema>
export type FormResponse = z.infer<typeof FormResponseSchema>
export type ListFormsResponse = z.infer<typeof ListFormsResponseSchema>
