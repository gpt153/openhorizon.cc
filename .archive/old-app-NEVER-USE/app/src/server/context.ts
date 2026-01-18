import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function createContext() {
  // Get authenticated user from Clerk
  const { userId } = await auth()

  // If no user, return unauthenticated context
  if (!userId) {
    return {
      prisma,
      userId: null,
      orgId: null,
      user: null,
    }
  }

  // Get user's organization membership
  const membership = await prisma.userOrganizationMembership.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    console.warn(`⚠️  User ${userId} has no organization membership`)
    return {
      prisma,
      userId,
      orgId: null,
      user: null,
    }
  }

  return {
    prisma,
    userId,
    orgId: membership.organizationId,
    user: {
      id: userId,
      role: membership.role,
      organization: membership.organization,
    },
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
