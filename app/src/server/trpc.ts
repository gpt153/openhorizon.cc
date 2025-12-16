import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

// Base router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts

  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Ensure userId is non-null
    },
  })
})

// Organization-scoped procedure - requires org context
export const orgProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (!ctx.orgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No organization selected',
    })
  }

  // Verify user is member of organization
  const membership = await ctx.prisma.userOrganizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: ctx.userId,
        organizationId: ctx.orgId,
      },
    },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not a member of this organization',
    })
  }

  return opts.next({
    ctx: {
      ...ctx,
      orgId: ctx.orgId,
      organization: membership.organization,
      userRole: membership.role,
    },
  })
})
