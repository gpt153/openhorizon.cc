import prisma from '@/lib/prisma'

// Auth disabled - using dummy user/org for development
const DUMMY_USER_ID = 'dev-user-001'
const DUMMY_ORG_ID = 'dev-org-001'

export async function createContext() {
  return {
    prisma,
    userId: DUMMY_USER_ID,
    orgId: DUMMY_ORG_ID,
    user: null,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
