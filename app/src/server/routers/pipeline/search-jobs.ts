import { router, orgProcedure } from '../../trpc'
import { inngest } from '@/inngest/client'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

/**
 * Search Jobs Router
 *
 * Handles asynchronous search job submission and status polling.
 * Part of Epic 001: Fix API Timeout Issues
 *
 * Replaces synchronous search procedures with job-based workflow:
 * 1. Submit search job (creates SearchJob record + triggers Inngest)
 * 2. Poll job status (returns current state + results when complete)
 */

// Shared search parameters schema
const searchParamsSchema = z.object({
  projectId: z.string(),
  destination: z.string(),
  dates: z.object({
    start: z.string(),
    end: z.string(),
  }),
  participantCount: z.number().int().positive(),
  projectName: z.string().optional(),
  budgetAllocated: z.number().optional(),
})

export const searchJobsRouter = router({
  /**
   * Submit Food Search Job
   *
   * Creates a SearchJob record and triggers the Inngest food search workflow.
   * Returns a jobId for polling status.
   */
  submitFoodSearch: orgProcedure
    .input(searchParamsSchema)
    .mutation(async ({ ctx, input }) => {
      // Create SearchJob record
      const job = await ctx.prisma.searchJob.create({
        data: {
          type: 'FOOD',
          status: 'PENDING',
          organizationId: ctx.orgId,
          projectId: input.projectId,
          searchParams: input,
        },
      })

      // Trigger Inngest function
      await inngest.send({
        name: 'search/food.requested',
        data: {
          jobId: job.id,
          searchParams: input,
        },
      })

      return { jobId: job.id }
    }),

  /**
   * Submit Accommodation Search Job
   *
   * Creates a SearchJob record and triggers the Inngest accommodation search workflow.
   * Returns a jobId for polling status.
   */
  submitAccommodationSearch: orgProcedure
    .input(searchParamsSchema)
    .mutation(async ({ ctx, input }) => {
      // Create SearchJob record
      const job = await ctx.prisma.searchJob.create({
        data: {
          type: 'ACCOMMODATION',
          status: 'PENDING',
          organizationId: ctx.orgId,
          projectId: input.projectId,
          searchParams: input,
        },
      })

      // Trigger Inngest function
      await inngest.send({
        name: 'search/accommodation.requested',
        data: {
          jobId: job.id,
          searchParams: input,
        },
      })

      return { jobId: job.id }
    }),

  /**
   * Get Job Status
   *
   * Returns the current status of a search job, including results if completed.
   *
   * Authorization: Only returns jobs belonging to the user's organization.
   * Returns NOT_FOUND (instead of FORBIDDEN) to prevent org enumeration.
   */
  getJobStatus: orgProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.searchJob.findUnique({
        where: { id: input.jobId },
      })

      // Multi-tenant isolation: verify job belongs to user's org
      if (!job || job.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return {
        status: job.status,
        results: job.status === 'COMPLETED' ? job.results : null,
        error: job.status === 'FAILED' ? job.error : null,
      }
    }),
})
