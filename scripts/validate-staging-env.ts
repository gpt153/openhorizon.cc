#!/usr/bin/env tsx

/**
 * Staging Environment Validation Script
 *
 * Validates all required services and configurations for seed elaboration feature
 * in the staging environment.
 *
 * Usage:
 *   tsx scripts/validate-staging-env.ts
 *   npm run validate:staging
 *
 * Part of Issue #180: Deployment Validation - Staging Environment Testing
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.staging' })
config({ path: '.env' })

interface EnvCheckResult {
  service: string
  status: 'ok' | 'error' | 'warning'
  message: string
  details?: any
  duration?: number
}

const TIMEOUT_MS = 10000 // 10 second timeout per check

/**
 * Utility: Measure execution time
 */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start
  return { result, duration }
}

/**
 * Check 1: OpenAI API Configuration
 */
async function checkOpenAI(): Promise<EnvCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      service: 'OpenAI API',
      status: 'error',
      message: 'OPENAI_API_KEY environment variable not set'
    }
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      service: 'OpenAI API',
      status: 'error',
      message: 'OPENAI_API_KEY appears to be invalid (should start with sk-)'
    }
  }

  try {
    const { result, duration } = await measureTime(async () => {
      const response = await fetch('https://api.openai.com/v1/models/gpt-4o', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`)
      }

      return response.json()
    })

    return {
      service: 'OpenAI API',
      status: 'ok',
      message: 'API key valid, gpt-4o model accessible',
      duration,
      details: {
        modelId: result.id,
        ownedBy: result.owned_by
      }
    }
  } catch (error) {
    return {
      service: 'OpenAI API',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

/**
 * Check 2: PostgreSQL Database
 */
async function checkPostgreSQL(): Promise<EnvCheckResult> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return {
      service: 'PostgreSQL',
      status: 'error',
      message: 'DATABASE_URL environment variable not set'
    }
  }

  try {
    // Dynamic import to avoid bundling issues
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const { duration } = await measureTime(async () => {
      // Test connection
      await prisma.$connect()

      // Check if seeds table exists
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Seed'
      `

      if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error('Seeds table not found. Run migrations first.')
      }

      // Check if metadata column exists (JSONB)
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Seed'
        AND column_name = 'metadata'
      `

      await prisma.$disconnect()

      return { result, columns }
    })

    return {
      service: 'PostgreSQL',
      status: 'ok',
      message: 'Database connection successful, schema validated',
      duration,
      details: {
        url: databaseUrl.split('@')[1] || 'hidden' // Hide credentials
      }
    }
  } catch (error) {
    return {
      service: 'PostgreSQL',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

/**
 * Check 3: Redis Session Store
 */
async function checkRedis(): Promise<EnvCheckResult> {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL

  if (!redisUrl) {
    return {
      service: 'Redis',
      status: 'warning',
      message: 'REDIS_URL not set. Sessions may not persist across restarts.',
      details: { note: 'Redis is optional for development but recommended for staging/production' }
    }
  }

  try {
    // Try Redis REST API (Upstash) first
    if (redisUrl.startsWith('https://')) {
      const token = process.env.UPSTASH_REDIS_REST_TOKEN

      if (!token) {
        return {
          service: 'Redis',
          status: 'error',
          message: 'UPSTASH_REDIS_REST_TOKEN required for Upstash Redis'
        }
      }

      const { result, duration } = await measureTime(async () => {
        // Test PING command
        const pingResponse = await fetch(`${redisUrl}/ping`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: AbortSignal.timeout(TIMEOUT_MS)
        })

        if (!pingResponse.ok) {
          throw new Error(`HTTP ${pingResponse.status}`)
        }

        const pingResult = await pingResponse.json()

        // Test SET/GET
        const testKey = `staging-validation-${Date.now()}`
        const testValue = 'test-value'

        await fetch(`${redisUrl}/set/${testKey}/${testValue}?EX=60`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const getResponse = await fetch(`${redisUrl}/get/${testKey}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const getValue = await getResponse.json()

        // Clean up
        await fetch(`${redisUrl}/del/${testKey}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        return { pingResult, getValue }
      })

      return {
        service: 'Redis',
        status: 'ok',
        message: 'Upstash Redis connection successful, read/write operations work',
        duration,
        details: { provider: 'Upstash' }
      }
    } else {
      // Try direct Redis connection (ioredis)
      const { Redis } = await import('ioredis')
      const redis = new Redis(redisUrl)

      const { duration } = await measureTime(async () => {
        // Test PING
        const pong = await redis.ping()
        if (pong !== 'PONG') {
          throw new Error('PING command failed')
        }

        // Test SET/GET
        const testKey = `staging-validation-${Date.now()}`
        await redis.set(testKey, 'test-value', 'EX', 60)
        const value = await redis.get(testKey)
        await redis.del(testKey)

        if (value !== 'test-value') {
          throw new Error('SET/GET test failed')
        }

        redis.disconnect()
      })

      return {
        service: 'Redis',
        status: 'ok',
        message: 'Redis connection successful, read/write operations work',
        duration,
        details: { provider: 'Redis' }
      }
    }
  } catch (error) {
    return {
      service: 'Redis',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

/**
 * Check 4: Weaviate Vector Database (Optional)
 */
async function checkWeaviate(): Promise<EnvCheckResult> {
  const weaviateUrl = process.env.WEAVIATE_URL || process.env.WEAVIATE_HOST

  if (!weaviateUrl) {
    return {
      service: 'Weaviate',
      status: 'warning',
      message: 'WEAVIATE_URL not set. Vector search features may not work.',
      details: { note: 'Weaviate is optional for basic elaboration functionality' }
    }
  }

  try {
    const { duration } = await measureTime(async () => {
      // Test health endpoint
      const healthUrl = `${weaviateUrl}/v1/.well-known/ready`
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Test schema endpoint
      const schemaUrl = `${weaviateUrl}/v1/schema`
      const schemaResponse = await fetch(schemaUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })

      if (!schemaResponse.ok) {
        throw new Error(`Schema check failed: HTTP ${schemaResponse.status}`)
      }

      return schemaResponse.json()
    })

    return {
      service: 'Weaviate',
      status: 'ok',
      message: 'Weaviate connection successful, schema accessible',
      duration,
      details: { url: weaviateUrl }
    }
  } catch (error) {
    return {
      service: 'Weaviate',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error,
        note: 'Weaviate is optional. Elaboration can work without it.'
      }
    }
  }
}

/**
 * Check 5: MinIO Storage (Optional)
 */
async function checkMinIO(): Promise<EnvCheckResult> {
  const minioEndpoint = process.env.MINIO_ENDPOINT
  const minioAccessKey = process.env.MINIO_ACCESS_KEY
  const minioSecretKey = process.env.MINIO_SECRET_KEY

  if (!minioEndpoint) {
    return {
      service: 'MinIO',
      status: 'warning',
      message: 'MINIO_ENDPOINT not set. File storage features may not work.',
      details: { note: 'MinIO is optional if not using file uploads' }
    }
  }

  if (!minioAccessKey || !minioSecretKey) {
    return {
      service: 'MinIO',
      status: 'error',
      message: 'MINIO_ACCESS_KEY or MINIO_SECRET_KEY not set'
    }
  }

  try {
    const { duration } = await measureTime(async () => {
      // Test health endpoint (MinIO has /minio/health/live)
      const healthUrl = `${minioEndpoint}/minio/health/live`
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })

      if (!response.ok && response.status !== 403) {
        // 403 is acceptable - means auth is required but service is up
        throw new Error(`HTTP ${response.status}`)
      }

      return true
    })

    return {
      service: 'MinIO',
      status: 'ok',
      message: 'MinIO service is reachable',
      duration,
      details: { endpoint: minioEndpoint }
    }
  } catch (error) {
    return {
      service: 'MinIO',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error,
        note: 'MinIO is optional if not using file uploads.'
      }
    }
  }
}

/**
 * Check 6: Environment Variables
 */
async function checkEnvironmentVariables(): Promise<EnvCheckResult> {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ]

  const recommended = [
    'REDIS_URL',
    'SENTRY_DSN',
    'INNGEST_EVENT_KEY'
  ]

  const optional = [
    'WEAVIATE_URL',
    'MINIO_ENDPOINT'
  ]

  const missing: string[] = []
  const missingRecommended: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  for (const key of recommended) {
    if (!process.env[key]) {
      missingRecommended.push(key)
    }
  }

  if (missing.length > 0) {
    return {
      service: 'Environment Variables',
      status: 'error',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing, missingRecommended }
    }
  }

  if (missingRecommended.length > 0) {
    return {
      service: 'Environment Variables',
      status: 'warning',
      message: `Missing recommended environment variables: ${missingRecommended.join(', ')}`,
      details: { missingRecommended }
    }
  }

  return {
    service: 'Environment Variables',
    status: 'ok',
    message: 'All required and recommended environment variables are set',
    details: {
      required: required.length,
      recommended: recommended.length,
      optional: optional.length
    }
  }
}

/**
 * Run all validation checks
 */
async function runValidation(): Promise<void> {
  console.log('🔍 Validating Staging Environment for Seed Elaboration\n')
  console.log('━'.repeat(70))
  console.log('')

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'OpenAI API', fn: checkOpenAI },
    { name: 'PostgreSQL Database', fn: checkPostgreSQL },
    { name: 'Redis Session Store', fn: checkRedis },
    { name: 'Weaviate Vector DB', fn: checkWeaviate },
    { name: 'MinIO Storage', fn: checkMinIO }
  ]

  const results: EnvCheckResult[] = []

  // Run checks sequentially
  for (const check of checks) {
    const result = await check.fn()
    results.push(result)

    const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌'
    const durationStr = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${icon} ${result.service}${durationStr}`)
    console.log(`   ${result.message}`)

    if (result.details && Object.keys(result.details).length > 0) {
      const detailsStr = JSON.stringify(result.details, null, 2)
        .split('\n')
        .map(line => `   ${line}`)
        .join('\n')
      console.log(detailsStr)
    }
    console.log('')
  }

  console.log('━'.repeat(70))

  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const okCount = results.filter(r => r.status === 'ok').length

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Passed: ${okCount}`)
  console.log(`   ⚠️  Warnings: ${warningCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log('')

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'staging',
    summary: {
      total: results.length,
      passed: okCount,
      warnings: warningCount,
      errors: errorCount
    },
    checks: results
  }

  console.log('📄 Full report written to: staging-env-validation.json')
  await Bun.write('staging-env-validation.json', JSON.stringify(report, null, 2))

  console.log('')
  console.log('━'.repeat(70))

  if (errorCount > 0) {
    console.log('❌ VALIDATION FAILED')
    console.log('   Fix the errors above before proceeding to testing.')
    process.exit(1)
  } else if (warningCount > 0) {
    console.log('⚠️  VALIDATION PASSED WITH WARNINGS')
    console.log('   Review warnings above. Some features may not work.')
    process.exit(0)
  } else {
    console.log('✅ VALIDATION PASSED')
    console.log('   All systems ready for testing!')
    process.exit(0)
  }
}

// Main entry point
runValidation().catch((error) => {
  console.error('Fatal error during validation:')
  console.error(error)
  process.exit(1)
})
