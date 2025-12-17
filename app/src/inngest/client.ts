import { Inngest } from 'inngest'

/**
 * Inngest Client
 *
 * Used to trigger background jobs for long-running AI generation tasks.
 */

export const inngest = new Inngest({
  id: 'open-horizon',
  name: 'Open Horizon Project Companion',
})

/**
 * Event types for type-safe event triggering
 */

export type Events = {
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
}
