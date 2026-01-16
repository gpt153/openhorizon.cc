import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { AccommodationAgent } from '@/lib/ai/agents/accommodation-agent'
import type { AgentContext } from '@/lib/ai/agents/base-agent'

/**
 * Accommodation Agent Background Search - Inngest Function
 *
 * Part of Epic 001: Fix API Timeout Issues
 *
 * This function executes Accommodation agent searches in the background to avoid
 * 30-second Cloud Run timeout limits. It updates SearchJob status throughout
 * the lifecycle and stores results/errors in the database.
 *
 * Event: 'search/accommodation.requested'
 * Retry Policy: 3 attempts with exponential backoff
 */

export const accommodationAgentSearch = inngest.createFunction(
  {
    id: 'accommodation-agent-search',
    retries: 3,
  },
  { event: 'search/accommodation.requested' },
  async ({ event, step }) => {
    const { jobId, searchParams } = event.data

    // Step 1: Update status PENDING → PROCESSING
    await step.run('update-status-processing', async () => {
      await prisma.searchJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      })
      console.log(`[Accommodation Search] Job ${jobId}: Status updated to PROCESSING`)
    })

    try {
      // Step 2: Execute Accommodation agent search
      const results = await step.run('execute-accommodation-search', async () => {
        console.log(`[Accommodation Search] Job ${jobId}: Starting search...`)
        console.log(`[Accommodation Search] Params:`, JSON.stringify(searchParams, null, 2))

        // Initialize Accommodation agent
        const agent = new AccommodationAgent()

        // Build agent context from search parameters
        const agentContext: AgentContext = {
          project: {
            name: searchParams.projectName || 'Erasmus+ Project',
            location: searchParams.destination,
            participantCount: searchParams.participantCount,
            startDate: new Date(searchParams.dates.start),
            endDate: new Date(searchParams.dates.end),
          },
          phase: {
            name: 'Accommodation',
            type: 'ACCOMMODATION',
            budgetAllocated: searchParams.budgetAllocated || 5000,
            startDate: new Date(searchParams.dates.start),
            endDate: new Date(searchParams.dates.end),
          },
        }

        // Execute the search
        const accommodationOptions = await agent.research(agentContext)

        console.log(`[Accommodation Search] Job ${jobId}: Found ${accommodationOptions.length} options`)
        return accommodationOptions
      })

      // Step 3: Update status PROCESSING → COMPLETED
      await step.run('update-status-completed', async () => {
        await prisma.searchJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            results: results as any, // Store AccommodationSuggestion[] as JSON
          },
        })
        console.log(`[Accommodation Search] Job ${jobId}: Completed successfully`)
      })

      return {
        success: true,
        jobId,
        optionsFound: results.length,
      }

    } catch (error) {
      // Step 4: Update status PROCESSING → FAILED
      await step.run('update-status-failed', async () => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        await prisma.searchJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        })

        console.error(`[Accommodation Search] Job ${jobId}: Failed with error:`, errorMessage)
      })

      // Re-throw error to trigger Inngest retry mechanism
      throw error
    }
  }
)
