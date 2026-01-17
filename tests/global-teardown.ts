import { disconnectDatabase, cleanTestData } from './helpers/database'

/**
 * Global Teardown for Playwright E2E Tests
 *
 * Runs once after all tests to:
 * 1. Clean up test data (optional)
 * 2. Disconnect from database
 */

async function globalTeardown() {
  console.log('\n' + '═'.repeat(60))
  console.log('🧹 GLOBAL TEARDOWN - Cleaning Up Test Environment')
  console.log('═'.repeat(60) + '\n')

  try {
    // Option 1: Clean specific test data (keeps database for next run)
    // Uncomment if you want to clean data after each test run
    // console.log('[Teardown] Cleaning test data...')
    // await cleanTestData()

    // Option 2: Leave data in place for faster re-runs
    // Global setup will reset on next run anyway
    console.log('[Teardown] Skipping data cleanup (will reset on next run)')

    // Disconnect from database
    console.log('[Teardown] Disconnecting from database...')
    await disconnectDatabase()

    console.log('\n' + '═'.repeat(60))
    console.log('✅ GLOBAL TEARDOWN COMPLETE')
    console.log('═'.repeat(60) + '\n')
  } catch (error) {
    console.error('\n' + '═'.repeat(60))
    console.error('❌ GLOBAL TEARDOWN FAILED')
    console.error('═'.repeat(60))
    console.error(error)
    console.error('\n')
    // Don't throw - teardown failures shouldn't fail the test run
  }
}

export default globalTeardown
