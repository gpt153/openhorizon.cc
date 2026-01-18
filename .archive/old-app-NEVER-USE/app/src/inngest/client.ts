import { Inngest, EventSchemas } from 'inngest'

/**
 * Event types for type-safe event triggering
 *
 * IMPORTANT: All Inngest events MUST be defined here for TypeScript type safety.
 * When adding a new Inngest function, add its event type to this definition.
 */
export type Events = {
  'brainstorm.generate-seeds': {
    data: {
      sessionId: string
      tenantId: string
      userId: string
    }
  }
  'project.generate-from-idea': {
    data: {
      sessionId: string
      tenantId: string
      userId: string
    }
  }
  'programme.generate-from-concept': {
    data: {
      projectId: string
      tenantId: string
      userId: string
    }
  }
  'search/food.requested': {
    data: {
      jobId: string
      searchParams: {
        destination: string
        dates: {
          start: string
          end: string
        }
        participantCount: number
        projectName?: string
        budgetAllocated?: number
      }
    }
  }
  'search/accommodation.requested': {
    data: {
      jobId: string
      searchParams: {
        destination: string
        dates: {
          start: string
          end: string
        }
        participantCount: number
        projectName?: string
        budgetAllocated?: number
      }
    }
  }
}

/**
 * Inngest Client
 *
 * Used to trigger background jobs for long-running AI generation tasks.
 * Configured with EventSchemas for compile-time type safety on all events.
 */
export const inngest = new Inngest({
  id: 'open-horizon',
  name: 'Open Horizon Project Companion',
  schemas: new EventSchemas().fromRecord<Events>(),
})
