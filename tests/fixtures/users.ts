import type { PrismaClient, UserRole, SubscriptionTier } from '@prisma/client'

/**
 * User & Organization Fixtures
 *
 * Provides test data creation functions for:
 * - Organizations
 * - User memberships
 * - Predefined test user accounts
 */

// =============================================================================
// TEST USER DEFINITIONS
// =============================================================================

/**
 * Predefined test users with Clerk IDs
 *
 * IMPORTANT: These Clerk user IDs must be created manually in Clerk dashboard
 * before running tests. See setup documentation for details.
 */
export const TEST_USERS = {
  admin: {
    id: process.env.TEST_ADMIN_USER_ID || 'clerk_test_admin',
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.openhorizon.cc',
    role: 'ADMIN' as UserRole,
  },
  staff: {
    id: process.env.TEST_STAFF_USER_ID || 'clerk_test_staff',
    email: process.env.TEST_STAFF_EMAIL || 'staff@test.openhorizon.cc',
    role: 'STAFF' as UserRole,
  },
  participant: {
    id: process.env.TEST_PARTICIPANT_USER_ID || 'clerk_test_participant',
    email: process.env.TEST_PARTICIPANT_EMAIL || 'participant@test.openhorizon.cc',
    role: 'PARTICIPANT' as UserRole,
  },
}

// =============================================================================
// ORGANIZATION FIXTURES
// =============================================================================

export interface CreateOrganizationOptions {
  name?: string
  slug?: string
  subscriptionTier?: SubscriptionTier
}

/**
 * Create a test organization
 * Uses upsert for idempotency
 */
export async function createTestOrganization(
  prisma: PrismaClient,
  options: CreateOrganizationOptions = {}
) {
  const {
    name = 'Test Organization',
    slug = 'test-org',
    subscriptionTier = 'FREE',
  } = options

  const organization = await prisma.organization.upsert({
    where: { slug },
    create: {
      name,
      slug,
      subscriptionTier,
    },
    update: {
      name,
      subscriptionTier,
    },
  })

  return organization
}

/**
 * Create multiple test organizations
 */
export async function createTestOrganizations(
  prisma: PrismaClient,
  count: number = 3
) {
  const organizations = []

  for (let i = 1; i <= count; i++) {
    const org = await createTestOrganization(prisma, {
      name: `Test Organization ${i}`,
      slug: `test-org-${i}`,
      subscriptionTier: i === 1 ? 'PRO' : i === 2 ? 'BASIC' : 'FREE',
    })
    organizations.push(org)
  }

  return organizations
}

// =============================================================================
// USER MEMBERSHIP FIXTURES
// =============================================================================

/**
 * Create a user membership in an organization
 * Uses upsert for idempotency
 */
export async function createTestUserMembership(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  role: UserRole = 'STAFF'
) {
  const membership = await prisma.userOrganizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    create: {
      userId,
      organizationId,
      role,
    },
    update: {
      role,
    },
  })

  return membership
}

/**
 * Create memberships for all test users in an organization
 */
export async function createAllTestUserMemberships(
  prisma: PrismaClient,
  organizationId: string
) {
  const memberships = []

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const membership = await createTestUserMembership(
      prisma,
      user.id,
      organizationId,
      user.role
    )
    memberships.push({ key, membership })
  }

  return memberships
}

// =============================================================================
// ORGANIZATION SCENARIOS
// =============================================================================

/**
 * Predefined organization scenarios for common test cases
 */
export const ORGANIZATION_SCENARIOS = {
  basicOrg: {
    name: 'Basic Organization',
    slug: 'basic-org',
    subscriptionTier: 'BASIC' as SubscriptionTier,
  },
  proOrg: {
    name: 'Pro Organization',
    slug: 'pro-org',
    subscriptionTier: 'PRO' as SubscriptionTier,
  },
  freeOrg: {
    name: 'Free Organization',
    slug: 'free-org',
    subscriptionTier: 'FREE' as SubscriptionTier,
  },
}

/**
 * Create organization with full setup (org + user memberships)
 */
export async function createCompleteTestOrganization(
  prisma: PrismaClient,
  options: CreateOrganizationOptions = {}
) {
  // Create organization
  const organization = await createTestOrganization(prisma, options)

  // Add all test users as members
  await createAllTestUserMemberships(prisma, organization.id)

  return organization
}
