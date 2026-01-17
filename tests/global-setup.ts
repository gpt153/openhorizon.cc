import { chromium, type FullConfig } from '@playwright/test'
import {
  connectDatabase,
  resetDatabase,
  migrateDatabase,
  seedDatabase,
  waitForDatabase,
} from './helpers/database'
import { signInAsAdmin, signInAsStaff, signInAsParticipant, saveAuthState } from './helpers/auth'

/**
 * Global Setup for Playwright E2E Tests
 *
 * Runs once before all tests to:
 * 1. Ensure database is ready
 * 2. Run migrations
 * 3. Reset and seed test database
 * 4. Authenticate test users and save auth states
 */

async function globalSetup(config: FullConfig) {
  console.log('\n' + '═'.repeat(60))
  console.log('🚀 GLOBAL SETUP - Initializing Test Environment')
  console.log('═'.repeat(60) + '\n')

  try {
    // 1. Wait for database to be ready
    console.log('[Setup] Step 1/5: Waiting for database...')
    await waitForDatabase()

    // 2. Connect to database
    console.log('[Setup] Step 2/5: Connecting to database...')
    await connectDatabase()

    // 3. Run migrations
    console.log('[Setup] Step 3/5: Running migrations...')
    await migrateDatabase()

    // 4. Reset and seed database
    console.log('[Setup] Step 4/5: Resetting and seeding database...')
    await resetDatabase()
    await seedDatabase()

    // 5. Authenticate test users and save auth states
    console.log('[Setup] Step 5/5: Authenticating test users...')
    await authenticateTestUsers(config)

    console.log('\n' + '═'.repeat(60))
    console.log('✅ GLOBAL SETUP COMPLETE - Ready to run tests!')
    console.log('═'.repeat(60) + '\n')
  } catch (error) {
    console.error('\n' + '═'.repeat(60))
    console.error('❌ GLOBAL SETUP FAILED')
    console.error('═'.repeat(60))
    console.error(error)
    console.error('\n')
    throw error
  }
}

/**
 * Authenticate all test users and save their auth states
 * This allows tests to reuse authenticated sessions without re-logging in
 */
async function authenticateTestUsers(config: FullConfig) {
  const baseURL = config.use?.baseURL || process.env.BASE_URL || 'http://localhost:3000'

  console.log(`[Setup] Authenticating test users at ${baseURL}...`)

  // Launch browser for authentication
  const browser = await chromium.launch()

  try {
    // Authenticate admin user
    console.log('[Setup]   Authenticating admin user...')
    const adminContext = await browser.newContext({ baseURL })
    const adminPage = await adminContext.newPage()
    await signInAsAdmin(adminPage)
    await saveAuthState(adminPage, '.auth/admin-user.json')
    await adminContext.close()

    // Authenticate staff user
    console.log('[Setup]   Authenticating staff user...')
    const staffContext = await browser.newContext({ baseURL })
    const staffPage = await staffContext.newPage()
    await signInAsStaff(staffPage)
    await saveAuthState(staffPage, '.auth/staff-user.json')
    await staffContext.close()

    // Authenticate participant user
    console.log('[Setup]   Authenticating participant user...')
    const participantContext = await browser.newContext({ baseURL })
    const participantPage = await participantContext.newPage()
    await signInAsParticipant(participantPage)
    await saveAuthState(participantPage, '.auth/participant-user.json')
    await participantContext.close()

    console.log('[Setup] ✓ All test users authenticated')
  } catch (error) {
    console.error('[Setup] ✗ Authentication failed:', error)
    // Don't throw - tests can still run, they'll just need to authenticate manually
    console.warn('[Setup] ⚠ Tests will authenticate manually on first run')
  } finally {
    await browser.close()
  }
}

export default globalSetup
