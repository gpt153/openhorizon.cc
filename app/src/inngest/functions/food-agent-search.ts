import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { FoodAgent } from '@/lib/ai/agents/food-agent'
import type { AgentContext } from '@/lib/ai/agents/base-agent'

/**
 * Food Agent Background Search - Inngest Function
 *
 * Part of Epic 001: Fix API Timeout Issues
 *
 * This function executes Food agent searches in the background to avoid
 * 30-second Cloud Run timeout limits. It updates SearchJob status throughout
 * the lifecycle and stores results/errors in the database.
 *
 * Event: 'search/food.requested'
 * Retry Policy: 3 attempts with exponential backoff
 */

export const foodAgentSearch = inngest.createFunction(
  {
    id: 'food-agent-search',
    retries: 3,
  },
  { event: 'search/food.requested' },
  async ({ event, step }) => {
    const { jobId, searchParams } = event.data

    // Step 1: Update status PENDING → PROCESSING
    await step.run('update-status-processing', async () => {
      await prisma.searchJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      })
      console.log(`[Food Search] Job ${jobId}: Status updated to PROCESSING`)
    })

    try {
      // Step 2: Execute Food agent search
      const results = await step.run('execute-food-search', async () => {
        console.log(`[Food Search] Job ${jobId}: Starting search...`)
        console.log(`[Food Search] Params:`, JSON.stringify(searchParams, null, 2))

        // Initialize Food agent
        const agent = new FoodAgent()

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
            name: 'Food & Catering',
            type: 'FOOD',
            budgetAllocated: searchParams.budgetAllocated || 5000,
            startDate: new Date(searchParams.dates.start),
            endDate: new Date(searchParams.dates.end),
          },
        }

        // Execute the search
        const foodOptions = await agent.research(agentContext)

        console.log(`[Food Search] Job ${jobId}: Found ${foodOptions.length} options`)
        return foodOptions
      })

      // Step 3: Update status PROCESSING → COMPLETED
      await step.run('update-status-completed', async () => {
        await prisma.searchJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            results: results as any, // Store FoodOption[] as JSON
          },
        })
        console.log(`[Food Search] Job ${jobId}: Completed successfully`)
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

        console.error(`[Food Search] Job ${jobId}: Failed with error:`, errorMessage)
      })

      // Re-throw error to trigger Inngest retry mechanism
      throw error
    }
  }
)
