import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { generateProjectFromIdea } from '@/inngest/functions/generate-project'
import { generateProgramme } from '@/inngest/functions/generate-programme'

/**
 * Inngest API Route
 *
 * Handles webhooks from Inngest for background job processing.
 */

// Force this route to be dynamic (not evaluated at build time)
export const dynamic = 'force-dynamic'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateProjectFromIdea,
    generateProgramme,
  ],
})
