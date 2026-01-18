import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { calculateBudget, type BudgetInput } from '@/lib/erasmus/budget-calculator'
import { geocode, getFallbackCoordinates } from '@/lib/erasmus/geocoding'

// Zod schema for budget calculation input
const budgetInputSchema = z.object({
  projectId: z.string().uuid().optional(),
  participantsByCountry: z.record(z.string().length(2), z.number().int().positive()),
  destinationCity: z.string().min(2),
  destinationCountry: z.string().length(2),
  durationDays: z.number().int().positive(),
  useGreenTravel: z.boolean().default(false),
})

export const budgetCalculatorRouter = router({
  /**
   * Calculate budget for a project with multiple origin countries
   */
  calculateBudget: orgProcedure
    .input(budgetInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get destination coordinates
        let destinationCoords
        try {
          destinationCoords = await geocode(
            input.destinationCity,
            input.destinationCountry
          )
        } catch (error) {
          console.warn(
            `Geocoding failed for ${input.destinationCity}, using fallback coordinates`
          )
          destinationCoords = getFallbackCoordinates(input.destinationCountry)
        }

        // Get origin coordinates for each country
        const originCoordsByCountry: Record<
          string,
          { lat: number; lon: number }
        > = {}

        for (const countryCode of Object.keys(input.participantsByCountry)) {
          try {
            // For simplicity, use capital city coordinates
            originCoordsByCountry[countryCode] =
              getFallbackCoordinates(countryCode)
          } catch (error) {
            throw new Error(
              `Could not find coordinates for origin country: ${countryCode}`
            )
          }
        }

        // Calculate budget
        const budget = await calculateBudget(
          input as BudgetInput,
          destinationCoords,
          originCoordsByCountry
        )

        // Optionally save to project
        if (input.projectId) {
          await ctx.prisma.pipelineProject.updateMany({
            where: {
              id: input.projectId,
              tenantId: ctx.orgId,
            },
            data: {
              budgetTotal: budget.totalBudget,
              metadata: {
                calculatedBudget: JSON.parse(JSON.stringify(budget)),
                calculatedAt: new Date().toISOString(),
              } as any,
            },
          })
        }

        return budget
      } catch (error) {
        console.error('Budget calculation failed:', error)
        throw new Error(
          `Budget calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }),

  /**
   * Get saved budget for a project
   */
  getSavedBudget: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
        select: {
          metadata: true,
          budgetTotal: true,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      const metadata = project.metadata as any
      return {
        budget: metadata?.calculatedBudget || null,
        calculatedAt: metadata?.calculatedAt || null,
        budgetTotal: project.budgetTotal,
      }
    }),
})
