/**
 * Checklist Generator
 *
 * Generates phase-specific task checklists based on phase type,
 * project context, and requirements.
 */

import type {
  ChecklistInput,
  ChecklistOutput,
  ChecklistTask,
  PhaseTemplate,
  RichSeedMetadata,
  RequirementsOutput
} from './types.js'
import { randomUUID } from 'crypto'

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Replace template variables in task description
 */
function fillTemplate(
  description: string,
  seed: RichSeedMetadata,
  phase: PhaseTemplate
): string {
  return description
    .replace(/\$\{participants\}/g, String(seed.participants))
    .replace(/\$\{destination\}/g, seed.destination)
    .replace(/\$\{duration\}/g, String(seed.duration))
    .replace(/\$\{phaseName\}/g, phase.name)
}

/**
 * Generate APPLICATION phase checklist
 */
function generateApplicationChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata
): ChecklistTask[] {
  return [
    {
      id: randomUUID(),
      description: 'Review Erasmus+ application guidelines and eligibility criteria',
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Complete project narrative sections (objectives, activities, impact)',
      completed: false,
      dueDate: addDays(phase.deadline, -7),
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: `Prepare detailed budget breakdown for €${seed.estimatedBudget}`,
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Gather partner organization documents and agreements',
      completed: false,
      category: 'admin',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Collect CVs and qualifications of project staff',
      completed: false,
      category: 'admin',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Write learning outcomes and impact assessment plan',
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Submit application before deadline',
      completed: false,
      dueDate: phase.deadline,
      category: 'admin',
      priority: 'high'
    }
  ]
}

/**
 * Generate ACCOMMODATION phase checklist
 */
function generateAccommodationChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata
): ChecklistTask[] {
  return [
    {
      id: randomUUID(),
      description: fillTemplate('Research ${participants}-person hostels/hotels in ${destination}', seed, phase),
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Request quotes from 3-5 accommodation providers',
      completed: false,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Compare accessibility features (wheelchair access, elevators)',
      completed: false,
      category: 'planning',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Confirm group booking discount availability',
      completed: false,
      category: 'booking',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Check cancellation policies and payment terms',
      completed: false,
      category: 'planning',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Book accommodation and receive written confirmation',
      completed: false,
      dueDate: phase.deadline,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Share accommodation details with all participants',
      completed: false,
      category: 'coordination',
      priority: 'low'
    }
  ]
}

/**
 * Generate TRAVEL phase checklist
 */
function generateTravelChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata,
  isReturn: boolean
): ChecklistTask[] {
  const direction = isReturn ? 'return' : 'outbound'
  const baseDate = isReturn ? phase.start_date : phase.deadline

  return [
    {
      id: randomUUID(),
      description: fillTemplate(`Research ${direction} flight/train options to ${destination}`, seed, phase),
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Request group booking quotes from airlines/train companies',
      completed: false,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: `Book ${direction} travel for ${seed.participants} participants`,
      completed: false,
      dueDate: addDays(baseDate, -7),
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Collect passport/ID copies from all participants',
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: `Create ${direction} travel itinerary document`,
      completed: false,
      category: 'coordination',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: isReturn ? 'Arrange transport to airport/station' : 'Arrange airport/station pickup at destination',
      completed: false,
      category: 'coordination',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: `Send ${direction} travel details to all participants`,
      completed: false,
      dueDate: addDays(baseDate, -3),
      category: 'coordination',
      priority: 'high'
    }
  ]
}

/**
 * Generate FOOD phase checklist
 */
function generateFoodChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata
): ChecklistTask[] {
  return [
    {
      id: randomUUID(),
      description: 'Collect dietary restrictions and allergies from all participants',
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: fillTemplate('Research catering options in ${destination}', seed, phase),
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Request quotes from 3+ catering companies',
      completed: false,
      category: 'booking',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: `Plan menu for ${seed.duration} days accommodating all dietary needs`,
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Book catering services and confirm menu',
      completed: false,
      dueDate: phase.deadline,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Confirm meal schedule with accommodation venue',
      completed: false,
      category: 'coordination',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Arrange water, coffee, and snacks for activity breaks',
      completed: false,
      category: 'booking',
      priority: 'low'
    }
  ]
}

/**
 * Generate ACTIVITIES phase checklist
 */
function generateActivitiesChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata
): ChecklistTask[] {
  const activityName = phase.name

  // Find matching activity from seed
  const activity = seed.activities.find(a => a.name === activityName)

  if (activity?.type === 'workshop') {
    return [
      {
        id: randomUUID(),
        description: `Book facilitator for "${activityName}"`,
        completed: false,
        dueDate: addDays(phase.deadline, -14),
        category: 'booking',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Prepare materials and supplies list',
        completed: false,
        category: 'planning',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Purchase/print workshop materials and handouts',
        completed: false,
        dueDate: addDays(phase.deadline, -3),
        category: 'admin',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Test equipment and setup in venue',
        completed: false,
        category: 'planning',
        priority: 'low'
      },
      {
        id: randomUUID(),
        description: 'Prepare certificates and evaluation forms',
        completed: false,
        category: 'admin',
        priority: 'low'
      }
    ]
  }

  if (activity?.type === 'cultural_visit') {
    return [
      {
        id: randomUUID(),
        description: `Book tickets for ${activityName}`,
        completed: false,
        dueDate: addDays(phase.deadline, -7),
        category: 'booking',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Arrange group tour guide (if needed)',
        completed: false,
        category: 'booking',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Check accessibility for all participants',
        completed: false,
        category: 'planning',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Plan transport to/from activity location',
        completed: false,
        category: 'coordination',
        priority: 'medium'
      }
    ]
  }

  // Generic activity checklist
  return [
    {
      id: randomUUID(),
      description: `Prepare for "${activityName}"`,
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Confirm venue and equipment availability',
      completed: false,
      category: 'coordination',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Brief participants on activity objectives',
      completed: false,
      category: 'coordination',
      priority: 'low'
    }
  ]
}

/**
 * Generate INSURANCE phase checklist
 */
function generateInsuranceChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata,
  requirements: RequirementsOutput
): ChecklistTask[] {
  const isGroup = requirements.insurance.type === 'group_travel'

  return [
    {
      id: randomUUID(),
      description: `Research ${isGroup ? 'group' : 'individual'} travel insurance options`,
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Request quotes from 3+ insurance providers',
      completed: false,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Compare coverage (medical, liability, cancellation, evacuation)',
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: `Purchase ${isGroup ? 'group' : 'individual'} travel insurance`,
      completed: false,
      dueDate: phase.deadline,
      category: 'booking',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Collect participant personal information for insurance',
      completed: false,
      category: 'admin',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Distribute insurance certificates to all participants',
      completed: false,
      category: 'coordination',
      priority: 'medium'
    }
  ]
}

/**
 * Generate PERMITS phase checklist
 */
function generatePermitsChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata,
  requirements: RequirementsOutput
): ChecklistTask[] {
  const phaseName = phase.name.toLowerCase()

  // Visa-specific checklist
  if (phaseName.includes('visa')) {
    return [
      {
        id: randomUUID(),
        description: `Collect visa application forms for ${requirements.visas.countries.join(', ')} participants`,
        completed: false,
        category: 'admin',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: `Book visa appointment slots for ${seed.participants} participants`,
        completed: false,
        category: 'booking',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Prepare invitation letters for visa applications',
        completed: false,
        category: 'admin',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Assist participants with visa application completion',
        completed: false,
        category: 'coordination',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Track visa application status for all participants',
        completed: false,
        category: 'admin',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Confirm all visas approved before travel',
        completed: false,
        dueDate: phase.deadline,
        category: 'admin',
        priority: 'high'
      }
    ]
  }

  // Event permit checklist
  if (phaseName.includes('event')) {
    return [
      {
        id: randomUUID(),
        description: 'Research local event permit requirements',
        completed: false,
        category: 'planning',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Complete event permit application form',
        completed: false,
        category: 'admin',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Submit application to local municipality',
        completed: false,
        category: 'admin',
        priority: 'high'
      },
      {
        id: randomUUID(),
        description: 'Follow up on permit application status',
        completed: false,
        category: 'admin',
        priority: 'medium'
      },
      {
        id: randomUUID(),
        description: 'Receive approved event permit',
        completed: false,
        dueDate: phase.deadline,
        category: 'admin',
        priority: 'high'
      }
    ]
  }

  // Generic permit checklist
  return [
    {
      id: randomUUID(),
      description: fillTemplate('Research permit requirements for ${phaseName}', seed, phase),
      completed: false,
      category: 'planning',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Complete and submit permit application',
      completed: false,
      dueDate: addDays(phase.deadline, -7),
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Receive approved permit',
      completed: false,
      dueDate: phase.deadline,
      category: 'admin',
      priority: 'high'
    }
  ]
}

/**
 * Generate REPORTING phase checklist
 */
function generateReportingChecklist(
  phase: PhaseTemplate,
  seed: RichSeedMetadata
): ChecklistTask[] {
  return [
    {
      id: randomUUID(),
      description: 'Collect participant feedback forms and evaluations',
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Compile photos, videos, and documentation from activities',
      completed: false,
      category: 'admin',
      priority: 'medium'
    },
    {
      id: randomUUID(),
      description: 'Draft final report narrative (objectives, activities, outcomes)',
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Complete financial report with receipts and invoices',
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Write impact assessment and learning outcomes analysis',
      completed: false,
      category: 'admin',
      priority: 'high'
    },
    {
      id: randomUUID(),
      description: 'Prepare dissemination materials (social media, website)',
      completed: false,
      category: 'coordination',
      priority: 'low'
    },
    {
      id: randomUUID(),
      description: 'Submit final report to funding agency',
      completed: false,
      dueDate: phase.deadline,
      category: 'admin',
      priority: 'high'
    }
  ]
}

/**
 * Generate checklist for a phase
 *
 * @param input - Checklist generation input
 * @returns Checklist with tasks
 */
export function generateChecklist(input: ChecklistInput): ChecklistOutput {
  const { phase, seed, requirements } = input

  let tasks: ChecklistTask[] = []

  switch (phase.type) {
    case 'APPLICATION':
      tasks = generateApplicationChecklist(phase, seed)
      break

    case 'ACCOMMODATION':
      tasks = generateAccommodationChecklist(phase, seed)
      break

    case 'TRAVEL':
      const isReturn = phase.name.toLowerCase().includes('return')
      tasks = generateTravelChecklist(phase, seed, isReturn)
      break

    case 'FOOD':
      tasks = generateFoodChecklist(phase, seed)
      break

    case 'ACTIVITIES':
      tasks = generateActivitiesChecklist(phase, seed)
      break

    case 'INSURANCE':
      tasks = generateInsuranceChecklist(phase, seed, requirements)
      break

    case 'PERMITS':
      tasks = generatePermitsChecklist(phase, seed, requirements)
      break

    case 'REPORTING':
      tasks = generateReportingChecklist(phase, seed)
      break

    default:
      // Generic checklist for unknown phase types
      tasks = [
        {
          id: randomUUID(),
          description: `Complete tasks for ${phase.name}`,
          completed: false,
          category: 'planning',
          priority: 'medium'
        }
      ]
  }

  return { tasks }
}
