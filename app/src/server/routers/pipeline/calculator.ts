import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { calculateErasmusGrant } from '@/lib/erasmus/income-calculator'

export const calculatorRouter = router({
  calculateIncome: orgProcedure
    .input(z.object({
      projectId: z.string().uuid().optional(),
      participantCount: z.number().int().positive(),
      activityDays: z.number().int().min(5).max(21),
      travelDays: z.number().int().min(1).max(6).default(2),
      originCity: z.string().min(2),
      destinationCity: z.string().min(2),
      hostCountryCode: z.string().length(2),
      includeGreenTravel: z.boolean().default(false),
      participantsWithFewerOpportunities: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = calculateErasmusGrant(input)

      // Optionally save to project
      if (input.projectId) {
        await ctx.prisma.pipelineProject.updateMany({
          where: {
            id: input.projectId,
            tenantId: ctx.orgId,
          },
          data: {
            erasmusGrantCalculated: result.totalGrant,
          },
        })
      }

      return result
    }),
})
