import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelineVendorsRouter = router({
  // List all vendors for the organization
  list: orgProcedure
    .input(
      z
        .object({
          type: z
            .enum([
              'HOTEL',
              'HOSTEL',
              'GUESTHOUSE',
              'RESTAURANT',
              'CATERING',
              'ACTIVITY_PROVIDER',
              'TRANSPORT',
              'INSURANCE',
              'OTHER',
            ])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const vendors = await ctx.prisma.vendor.findMany({
        where: {
          tenantId: ctx.orgId,
          ...(input?.type && { type: input.type }),
        },
        include: {
          communications: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          quotes: {
            orderBy: {
              receivedAt: 'desc',
            },
            take: 5,
          },
        },
        orderBy: {
          rating: 'desc',
        },
      })

      return vendors
    }),

  // Get a single vendor by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          communications: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          quotes: {
            orderBy: {
              receivedAt: 'desc',
            },
          },
        },
      })

      if (!vendor) {
        throw new Error('Vendor not found')
      }

      return vendor
    }),

  // Create new vendor
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum([
          'HOTEL',
          'HOSTEL',
          'GUESTHOUSE',
          'RESTAURANT',
          'CATERING',
          'ACTIVITY_PROVIDER',
          'TRANSPORT',
          'INSURANCE',
          'OTHER',
        ]),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.create({
        data: {
          tenantId: ctx.orgId,
          name: input.name,
          type: input.type,
          email: input.email,
          phone: input.phone,
          website: input.website,
          location: input.location,
          notes: input.notes,
        },
      })

      return vendor
    }),

  // Update vendor
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          type: z
            .enum([
              'HOTEL',
              'HOSTEL',
              'GUESTHOUSE',
              'RESTAURANT',
              'CATERING',
              'ACTIVITY_PROVIDER',
              'TRANSPORT',
              'INSURANCE',
              'OTHER',
            ])
            .optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          website: z.string().url().optional(),
          location: z.string().optional(),
          rating: z.number().min(0).max(5).optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Vendor not found')
      }

      const vendor = await ctx.prisma.vendor.update({
        where: { id: input.id },
        data: input.data,
      })

      return vendor
    }),

  // Delete vendor
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!existing) {
        throw new Error('Vendor not found')
      }

      await ctx.prisma.vendor.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Update vendor stats (called after communication)
  updateStats: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        responded: z.boolean(),
        bookingSuccessful: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!vendor) {
        throw new Error('Vendor not found')
      }

      const totalContacts = vendor.totalContacts + 1
      let successfulBookings = vendor.successfulBookings
      if (input.bookingSuccessful) {
        successfulBookings += 1
      }

      // Calculate response rate
      const responseCount = input.responded
        ? Math.ceil(Number(vendor.responseRate || 0) * vendor.totalContacts / 100) + 1
        : Math.ceil(Number(vendor.responseRate || 0) * vendor.totalContacts / 100)
      const responseRate = (responseCount / totalContacts) * 100

      const updated = await ctx.prisma.vendor.update({
        where: { id: input.id },
        data: {
          totalContacts,
          successfulBookings,
          responseRate,
        },
      })

      return updated
    }),
})
