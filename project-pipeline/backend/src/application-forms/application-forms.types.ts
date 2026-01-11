import { Prisma } from '@prisma/client'

/**
 * Export formats supported for application forms
 */
export type ExportFormat = 'pdf' | 'docx'

/**
 * Form field definition
 */
export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect'
  required: boolean
  dataPath?: string // Path to data in aggregated project data (e.g., 'project.name')
  defaultValue?: any
  options?: string[] // For select/multiselect fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

/**
 * Form section containing related fields
 */
export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
}

/**
 * Complete form template definition
 */
export interface FormTemplate {
  type: 'KA1' | 'KA2' | 'CUSTOM'
  name: string
  version: string
  sections: FormSection[]
  requiredDataPaths: string[] // List of required data paths that must be present
}

/**
 * Aggregated project data from multiple sources
 */
export interface AggregatedProjectData {
  project: {
    id: string
    name: string
    type: string
    description?: string
    start_date: Date
    end_date: Date
    budget_total: number
    budget_spent: number
    participants_count: number
    location: string
    metadata?: any
  }
  phase: {
    id: string
    name: string
    type: string
    start_date: Date
    end_date: Date
    budget_allocated: number
    budget_spent: number
  }
  phases: Array<{
    name: string
    type: string
    budget_allocated: number
    budget_spent: number
    status: string
  }>
  totalBudget: {
    allocated: number
    spent: number
    remaining: number
  }
  participants: {
    count: number
    // Can be extended with participant details when available
  }
}

/**
 * AI-generated narrative content
 */
export interface FormNarrative {
  project_description: string
  objectives: string
  methodology: string
  expected_impact: string
  activities_summary?: string
  partnership_description?: string // For KA2
}

/**
 * Context provided to AI for narrative generation
 */
export interface FormContext {
  projectData: AggregatedProjectData
  formType: 'KA1' | 'KA2' | 'CUSTOM'
  additionalContext?: string
}

/**
 * Complete application form data
 */
export interface ApplicationFormData {
  id: string
  phase_id: string
  project_id: string
  form_type: 'KA1' | 'KA2' | 'CUSTOM'
  version: number
  status: 'DRAFT' | 'FINALIZED'
  form_data: Record<string, any>
  generated_narratives?: FormNarrative
  created_by: string
  created_at: Date
  updated_at: Date
  finalized_at?: Date
}

/**
 * Options for form generation
 */
export interface GenerateFormOptions {
  formType: 'KA1' | 'KA2' | 'CUSTOM'
  aiGenerated?: boolean
  includeNarratives?: boolean
  additionalContext?: string
}

/**
 * Result of field validation
 */
export interface ValidationResult {
  valid: boolean
  missing: string[]
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * Prisma type for ApplicationForm with relations
 */
export type ApplicationFormWithRelations = Prisma.ApplicationFormGetPayload<{
  include: {
    phase: {
      include: {
        project: true
      }
    }
  }
}>
