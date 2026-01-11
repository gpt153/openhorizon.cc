import { prisma } from '../config/database.js'
import { FormNarrativeAgent } from '../ai/agents/form-narrative-agent.js'
import { getTemplate, renderTemplate, validateRequiredDataPaths } from './templates/template-engine.js'
import type {
  ApplicationFormData,
  GenerateFormOptions,
  AggregatedProjectData,
  FormContext
} from './application-forms.types.js'
import type { FormType, FormStatus } from '@prisma/client'

/**
 * Aggregate project data from multiple sources
 */
export async function aggregateProjectData(projectId: string): Promise<AggregatedProjectData> {
  console.log('[ApplicationForms] Aggregating data for project:', projectId)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phases: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Calculate total budget across all phases
  const phaseBudgets = project.phases.reduce(
    (acc, phase) => ({
      allocated: acc.allocated + Number(phase.budget_allocated),
      spent: acc.spent + Number(phase.budget_spent)
    }),
    { allocated: 0, spent: 0 }
  )

  const aggregatedData: AggregatedProjectData = {
    project: {
      id: project.id,
      name: project.name,
      type: project.type,
      description: project.description || undefined,
      start_date: project.start_date,
      end_date: project.end_date,
      budget_total: Number(project.budget_total),
      budget_spent: Number(project.budget_spent),
      participants_count: project.participants_count,
      location: project.location,
      metadata: project.metadata || undefined
    },
    phase: {
      id: '',
      name: '',
      type: '',
      start_date: new Date(),
      end_date: new Date(),
      budget_allocated: 0,
      budget_spent: 0
    },
    phases: project.phases.map(p => ({
      name: p.name,
      type: p.type,
      budget_allocated: Number(p.budget_allocated),
      budget_spent: Number(p.budget_spent),
      status: p.status
    })),
    totalBudget: {
      allocated: phaseBudgets.allocated,
      spent: phaseBudgets.spent,
      remaining: phaseBudgets.allocated - phaseBudgets.spent
    },
    participants: {
      count: project.participants_count
    }
  }

  return aggregatedData
}

/**
 * Generate application form from phase data
 */
export async function generateApplicationForm(
  phaseId: string,
  userId: string,
  options: GenerateFormOptions
): Promise<ApplicationFormData> {
  console.log('[ApplicationForms] Generating form for phase:', phaseId, 'options:', options)

  // 1. Authorization check - verify user has access to this phase
  const phase = await prisma.phase.findFirst({
    where: {
      id: phaseId,
      project: {
        created_by: userId
      }
    },
    include: {
      project: true
    }
  })

  if (!phase) {
    throw new Error('Phase not found or access denied')
  }

  // 2. Aggregate project data
  const aggregatedData = await aggregateProjectData(phase.project_id)

  // Update phase data in aggregated data
  aggregatedData.phase = {
    id: phase.id,
    name: phase.name,
    type: phase.type,
    start_date: phase.start_date,
    end_date: phase.end_date,
    budget_allocated: Number(phase.budget_allocated),
    budget_spent: Number(phase.budget_spent)
  }

  // 3. Get template and validate required data
  const template = getTemplate(options.formType)
  const validationResult = validateRequiredDataPaths(template, aggregatedData)

  if (!validationResult.valid) {
    console.warn('[ApplicationForms] Missing required data:', validationResult.missing)
    // Continue anyway, but log warnings
  }

  // 4. Render template with aggregated data
  const formData = renderTemplate(template, aggregatedData)

  // 5. Generate AI narratives if requested
  let generatedNarratives = undefined
  if (options.aiGenerated && options.includeNarratives) {
    try {
      console.log('[ApplicationForms] Generating AI narratives')
      const narrativeAgent = new FormNarrativeAgent()
      const context: FormContext = {
        projectData: aggregatedData,
        formType: options.formType,
        additionalContext: options.additionalContext
      }
      generatedNarratives = await narrativeAgent.generateNarrative(context)
    } catch (error) {
      console.error('[ApplicationForms] Failed to generate narratives:', error)
      // Continue without narratives
    }
  }

  // 6. Create form record in database
  const form = await prisma.$transaction(async (tx) => {
    const newForm = await tx.applicationForm.create({
      data: {
        phase_id: phaseId,
        project_id: phase.project_id,
        form_type: options.formType,
        status: 'DRAFT',
        form_data: formData,
        generated_narratives: generatedNarratives || null,
        created_by: userId
      }
    })

    console.log('[ApplicationForms] Created form:', newForm.id)
    return newForm
  })

  return {
    id: form.id,
    phase_id: form.phase_id,
    project_id: form.project_id,
    form_type: form.form_type as 'KA1' | 'KA2' | 'CUSTOM',
    version: form.version,
    status: form.status as 'DRAFT' | 'FINALIZED',
    form_data: form.form_data as Record<string, any>,
    generated_narratives: generatedNarratives,
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    finalized_at: form.finalized_at || undefined
  }
}

/**
 * Get application form by ID
 */
export async function getApplicationForm(
  formId: string,
  userId: string
): Promise<ApplicationFormData> {
  console.log('[ApplicationForms] Fetching form:', formId)

  const form = await prisma.applicationForm.findFirst({
    where: {
      id: formId,
      phase: {
        project: {
          created_by: userId
        }
      }
    }
  })

  if (!form) {
    throw new Error('Form not found or access denied')
  }

  return {
    id: form.id,
    phase_id: form.phase_id,
    project_id: form.project_id,
    form_type: form.form_type as 'KA1' | 'KA2' | 'CUSTOM',
    version: form.version,
    status: form.status as 'DRAFT' | 'FINALIZED',
    form_data: form.form_data as Record<string, any>,
    generated_narratives: form.generated_narratives as any,
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    finalized_at: form.finalized_at || undefined
  }
}

/**
 * Update application form data
 */
export async function updateApplicationForm(
  formId: string,
  userId: string,
  updates: {
    form_data?: Record<string, any>
    generated_narratives?: any
  }
): Promise<ApplicationFormData> {
  console.log('[ApplicationForms] Updating form:', formId)

  // Check authorization
  const existing = await prisma.applicationForm.findFirst({
    where: {
      id: formId,
      phase: {
        project: {
          created_by: userId
        }
      }
    }
  })

  if (!existing) {
    throw new Error('Form not found or access denied')
  }

  // Don't allow updates to finalized forms
  if (existing.status === 'FINALIZED') {
    throw new Error('Cannot update finalized form')
  }

  const form = await prisma.applicationForm.update({
    where: { id: formId },
    data: {
      ...(updates.form_data && { form_data: updates.form_data }),
      ...(updates.generated_narratives && { generated_narratives: updates.generated_narratives })
    }
  })

  return {
    id: form.id,
    phase_id: form.phase_id,
    project_id: form.project_id,
    form_type: form.form_type as 'KA1' | 'KA2' | 'CUSTOM',
    version: form.version,
    status: form.status as 'DRAFT' | 'FINALIZED',
    form_data: form.form_data as Record<string, any>,
    generated_narratives: form.generated_narratives as any,
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    finalized_at: form.finalized_at || undefined
  }
}

/**
 * List application forms with optional filters
 */
export async function listApplicationForms(
  userId: string,
  projectId?: string,
  status?: FormStatus
): Promise<ApplicationFormData[]> {
  console.log('[ApplicationForms] Listing forms for user:', userId, 'filters:', { projectId, status })

  const forms = await prisma.applicationForm.findMany({
    where: {
      ...(projectId && { project_id: projectId }),
      ...(status && { status }),
      phase: {
        project: {
          created_by: userId
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return forms.map(form => ({
    id: form.id,
    phase_id: form.phase_id,
    project_id: form.project_id,
    form_type: form.form_type as 'KA1' | 'KA2' | 'CUSTOM',
    version: form.version,
    status: form.status as 'DRAFT' | 'FINALIZED',
    form_data: form.form_data as Record<string, any>,
    generated_narratives: form.generated_narratives as any,
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    finalized_at: form.finalized_at || undefined
  }))
}

/**
 * Finalize form (change status to FINALIZED)
 */
export async function finalizeForm(
  formId: string,
  userId: string
): Promise<ApplicationFormData> {
  console.log('[ApplicationForms] Finalizing form:', formId)

  // Check authorization
  const existing = await prisma.applicationForm.findFirst({
    where: {
      id: formId,
      phase: {
        project: {
          created_by: userId
        }
      }
    }
  })

  if (!existing) {
    throw new Error('Form not found or access denied')
  }

  if (existing.status === 'FINALIZED') {
    throw new Error('Form is already finalized')
  }

  const form = await prisma.applicationForm.update({
    where: { id: formId },
    data: {
      status: 'FINALIZED',
      finalized_at: new Date()
    }
  })

  return {
    id: form.id,
    phase_id: form.phase_id,
    project_id: form.project_id,
    form_type: form.form_type as 'KA1' | 'KA2' | 'CUSTOM',
    version: form.version,
    status: form.status as 'DRAFT' | 'FINALIZED',
    form_data: form.form_data as Record<string, any>,
    generated_narratives: form.generated_narratives as any,
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    finalized_at: form.finalized_at || undefined
  }
}
