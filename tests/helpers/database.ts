import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

/**
 * Test Database Helper
 *
 * Provides a dedicated Prisma client for testing with utilities for:
 * - Database reset and cleanup
 * - Test isolation
 * - Connection management
 */

// Singleton test Prisma client
let testPrisma: PrismaClient | null = null

/**
 * Get or create test Prisma client
 * Uses TEST_DATABASE_URL if available, otherwise falls back to DATABASE_URL
 */
export function getTestPrismaClient(): PrismaClient {
  if (!testPrisma) {
    // Use test database URL if available
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error(
        'Database URL not configured. Set TEST_DATABASE_URL or DATABASE_URL environment variable.'
      )
    }

    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
    })
  }

  return testPrisma
}

/**
 * Connect to test database
 */
export async function connectDatabase(): Promise<void> {
  const prisma = getTestPrismaClient()
  await prisma.$connect()
  console.log('[DB] Connected to test database')
}

/**
 * Disconnect from test database
 */
export async function disconnectDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect()
    testPrisma = null
    console.log('[DB] Disconnected from test database')
  }
}

/**
 * Reset test database to clean state
 *
 * WARNING: This deletes ALL data in the database!
 * Only use with TEST_DATABASE_URL to avoid data loss.
 */
export async function resetDatabase(): Promise<void> {
  const prisma = getTestPrismaClient()

  // Verify we're using a test database
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if (!databaseUrl?.includes('test') && !process.env.ALLOW_DB_RESET) {
    throw new Error(
      'Safety check: Database URL must contain "test" or ALLOW_DB_RESET must be set. ' +
        'This prevents accidentally wiping production data.'
    )
  }

  console.log('[DB] Resetting test database...')

  // Delete all data in reverse dependency order to avoid FK constraints
  const tablesToClear = [
    // Most dependent tables first
    'expenses',
    'communications',
    'vendor_searches',
    'vendors',
    'brainstorm_messages',
    'brainstorm_sessions',
    'seed_elaborations',
    'seeds',
    'pipeline_phases',
    'programmes',
    'project_generation_sessions',
    'projects',
    'pipeline_projects',
    'user_organization_memberships',
    'organizations',
  ]

  for (const table of tablesToClear) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
      console.log(`[DB]   ✓ Cleared ${table}`)
    } catch (error) {
      // Some tables might not exist, that's OK
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.warn(`[DB]   ⚠ Could not clear ${table}:`, error.message)
      }
    }
  }

  console.log('[DB] ✓ Database reset complete')
}

/**
 * Clean specific test data (softer than full reset)
 * Removes only records created during tests (identifiable by test-specific patterns)
 */
export async function cleanTestData(): Promise<void> {
  const prisma = getTestPrismaClient()

  console.log('[DB] Cleaning test data...')

  // Delete organizations with test slugs
  await prisma.organization.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: 'test-' } },
        { slug: { contains: '-test' } },
        { slug: 'test-org' },
      ],
    },
  })

  // Delete users with test email patterns
  await prisma.userOrganizationMembership.deleteMany({
    where: {
      userId: { startsWith: 'clerk_test_' },
    },
  })

  console.log('[DB] ✓ Test data cleaned')
}

/**
 * Wait for database to be ready (useful in CI/CD)
 */
export async function waitForDatabase(maxAttempts = 10, delayMs = 1000): Promise<void> {
  const prisma = getTestPrismaClient()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('[DB] ✓ Database is ready')
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Database not ready after ${maxAttempts} attempts`)
      }
      console.log(`[DB] Waiting for database... (attempt ${attempt}/${maxAttempts})`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Run Prisma migrations on test database
 * Ensures test database schema is up-to-date
 */
export async function migrateDatabase(): Promise<void> {
  console.log('[DB] Running migrations...')

  try {
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      cwd: process.cwd() + '/app', // Prisma schema is in /app
    })

    console.log('[DB] ✓ Migrations complete')
  } catch (error) {
    console.error('[DB] ✗ Migration failed:', error)
    throw error
  }
}

/**
 * Seed database with minimal required data
 * Called by global setup
 */
export async function seedDatabase(): Promise<void> {
  console.log('[DB] Seeding database...')

  // Import and run fixture functions
  const { createTestOrganization, createTestUserMembership, TEST_USERS } = await import(
    '../fixtures/users'
  )
  const { createTestProject, PROJECT_SCENARIOS } = await import('../fixtures/projects')
  const { createTestSeed, SEED_SCENARIOS } = await import('../fixtures/seeds')
  const { createTestProgramme, PROGRAMME_SCENARIOS } = await import('../fixtures/phases')

  const prisma = getTestPrismaClient()

  // 1. Create test organization
  const testOrg = await createTestOrganization(prisma, {
    name: 'Test Organization',
    slug: 'test-org',
  })
  console.log('[DB]   ✓ Created test organization')

  // 2. Create test user memberships
  for (const [key, user] of Object.entries(TEST_USERS)) {
    await createTestUserMembership(prisma, user.id, testOrg.id, user.role)
    console.log(`[DB]   ✓ Created ${key} user membership`)
  }

  // 3. Create test projects
  for (const [key, scenario] of Object.entries(PROJECT_SCENARIOS)) {
    await createTestProject(prisma, testOrg.id, scenario.status, {
      title: scenario.title,
      projectDna: scenario.projectDna,
      createdByUserId: TEST_USERS.admin.id,
    })
    console.log(`[DB]   ✓ Created ${key}`)
  }

  // 4. Create test seeds
  for (const [key, scenario] of Object.entries(SEED_SCENARIOS)) {
    await createTestSeed(prisma, testOrg.id, {
      title: scenario.title,
      description: scenario.description,
      createdByUserId: TEST_USERS.admin.id,
    })
    console.log(`[DB]   ✓ Created ${key}`)
  }

  // 5. Create test programmes with phases
  const testProject = await prisma.project.findFirst({
    where: { tenantId: testOrg.id, status: 'DRAFT' },
  })

  if (testProject) {
    for (const [key, scenario] of Object.entries(PROGRAMME_SCENARIOS)) {
      await createTestProgramme(prisma, testOrg.id, testProject.id, scenario)
      console.log(`[DB]   ✓ Created ${key}`)
    }
  }

  console.log('[DB] ✓ Database seeding complete')
}
