import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { FoodAgent } from '@/lib/ai/agents/food-agent'
import type { AgentContext } from '@/lib/ai/agents/base-agent'
import { InngestMetrics } from '@/lib/monitoring/inngest-metrics'
import { BusinessMetrics } from '@/lib/monitoring/business-metrics'

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
 *
 * ## Observability
 *
 * Logs are structured with JSON objects for easy parsing in Cloud Run logs.
 * All logs include: jobId, timestamp, and relevant context (duration, status, etc.)
 *
 * ## Alert Thresholds (for future monitoring setup)
 *
 * - High failure rate: >10% failures in last hour
 * - Slow jobs: >60 seconds completion time
 * - Job queue backlog: >50 pending jobs
 *
 * These thresholds can be configured in your monitoring tool (Cloud Monitoring,
 * Inngest dashboard, or external alerting system).
 */

export const foodAgentSearch = inngest.createFunction(
  {
    id: 'food-agent-search',
    retries: 3,
  },
  { event: 'search/food.requested' },
  async ({ event, step, attempt }) => {
    const { jobId, searchParams } = event.data
    const jobStartTime = Date.now()
    const functionId = 'food-agent-search'

    // Record job start and retries
    InngestMetrics.recordJobStart(functionId)
    if (attempt > 0) {
      InngestMetrics.recordJobRetry(functionId, attempt)
    }

    // Structured log: Job started
    console.log('[Food Search] Job started', {
      jobId,
      destination: searchParams.destination,
      participantCount: searchParams.participantCount,
      budgetAllocated: searchParams.budgetAllocated || 5000,
      dateRange: `${searchParams.dates.start} to ${searchParams.dates.end}`,
      timestamp: new Date().toISOString(),
    })

    // Step 1: Update status PENDING → PROCESSING
    await step.run('update-status-processing', async () => {
      await prisma.searchJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      })
      console.log('[Food Search] Status updated', {
        jobId,
        status: 'PROCESSING',
        timestamp: new Date().toISOString(),
      })
    })

    try {
      // Step 2: Execute Food agent search
      const results = await step.run('execute-food-search', async () => {
        const searchStartTime = Date.now()

        console.log('[Food Search] Search execution started', {
          jobId,
          timestamp: new Date().toISOString(),
        })

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
        const searchDuration = Date.now() - searchStartTime

        console.log('[Food Search] Search execution completed', {
          jobId,
          duration: searchDuration,
          durationSeconds: (searchDuration / 1000).toFixed(2),
          resultCount: foodOptions.length,
          timestamp: new Date().toISOString(),
        })

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

        const totalDuration = Date.now() - jobStartTime

        console.log('[Food Search] Job completed', {
          jobId,
          status: 'COMPLETED',
          totalDuration,
          totalDurationSeconds: (totalDuration / 1000).toFixed(2),
          resultCount: results.length,
          timestamp: new Date().toISOString(),
        })
      })

      // Record job success and business metric
      const totalDuration = Date.now() - jobStartTime
      InngestMetrics.recordJobSuccess(functionId, totalDuration)
      BusinessMetrics.recordSearchCompleted('food')

      return {
        success: true,
        jobId,
        optionsFound: results.length,
      }

    } catch (error) {
      // Step 4: Update status PROCESSING → FAILED
      await step.run('update-status-failed', async () => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        const totalDuration = Date.now() - jobStartTime

        await prisma.searchJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        })

        console.error('[Food Search] Job failed', {
          jobId,
          status: 'FAILED',
          error: errorMessage,
          stack: errorStack,
          totalDuration,
          totalDurationSeconds: (totalDuration / 1000).toFixed(2),
          timestamp: new Date().toISOString(),
        })
      })

      // Record job failure
      const totalDuration = Date.now() - jobStartTime
      InngestMetrics.recordJobFailure(functionId, error, totalDuration)

      // Re-throw error to trigger Inngest retry mechanism
      throw error
    }
  }
)
